import axios from 'axios'
import { YOUTUBE_API_KEY, YOUTUBE_BASE_URL } from '../../config/constants'
import type { Track } from '../../types'
import type { LastfmTrack } from '../lastfm/lastfmApi'
import { cleanChannelName, parseDuration, parseYouTubeTitle } from '../../utils/youtubeCleanup'
import { addQuotaUsage, isQuotaExceeded } from '../../utils/quotaTracker'

const SEARCH_DELAY_MS = 200

interface YouTubeThumbnails {
  default?: { url: string }
  medium?: { url: string }
  high?: { url: string }
  standard?: { url: string }
  maxres?: { url: string }
}

interface YouTubeSearchResponse {
  items: Array<{
    id: { videoId: string }
    snippet: {
      title: string
      channelTitle: string
      thumbnails: YouTubeThumbnails
    }
  }>
}

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string
    contentDetails?: { duration: string }
    statistics?: { viewCount?: string }
  }>
}

export interface VideoDetails {
  id: string
  duration: number
  viewCount: number
}

function requireApiKey(): string {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is missing. Set VITE_YOUTUBE_API_KEY in .env.local')
  }
  return YOUTUBE_API_KEY
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isQuotaExceededError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 403
}

function pickThumbnail(thumbs: YouTubeThumbnails): string {
  return thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url ?? ''
}

function buildTrack(
  videoId: string,
  snippet: YouTubeSearchResponse['items'][number]['snippet'],
  opts: {
    title?: string
    artist?: string
    album?: string
    lastfmUrl?: string
    playcount?: number
    tags?: string[]
    duration?: number
  },
): Track {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
  return {
    id: videoId,
    title: opts.title ?? parseYouTubeTitle(snippet.title),
    artist: opts.artist ?? cleanChannelName(snippet.channelTitle),
    album: opts.album ?? '',
    albumArt: pickThumbnail(snippet.thumbnails),
    duration: opts.duration ?? 0,
    service: 'youtube',
    externalUrl: youtubeUrl,
    youtubeUrl,
    youtubeMusicUrl: `https://music.youtube.com/watch?v=${videoId}`,
    lastfmUrl: opts.lastfmUrl ?? '',
    playcount: opts.playcount ?? 0,
    tags: opts.tags ?? [],
  }
}

export async function getVideoDetails(videoIds: string[]): Promise<VideoDetails[]> {
  if (videoIds.length === 0) return []
  const apiKey = requireApiKey()

  try {
    const { data } = await axios.get<YouTubeVideoDetailsResponse>(`${YOUTUBE_BASE_URL}/videos`, {
      params: {
        part: 'contentDetails,statistics',
        id: videoIds.join(','),
        key: apiKey,
      },
      timeout: 8000,
    })

    return data.items
      .filter((item) => item.contentDetails?.duration)
      .map((item) => ({
        id: item.id,
        duration: parseDuration(item.contentDetails!.duration),
        viewCount: Number(item.statistics?.viewCount ?? 0),
      }))
  } catch (err) {
    if (isQuotaExceededError(err)) {
      console.warn('YouTube API quota exceeded; could not fetch video details.')
      return []
    }
    throw err
  }
}

export async function searchTrack(title: string, artist: string): Promise<Track | null> {
  if (isQuotaExceeded()) return null
  const apiKey = requireApiKey()
  const q = `${artist} ${title} official audio`

  try {
    const { data } = await axios.get<YouTubeSearchResponse>(`${YOUTUBE_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q,
        type: 'video',
        videoCategoryId: '10',
        maxResults: 3,
        key: apiKey,
      },
      timeout: 8000,
    })
    addQuotaUsage(1)

    const top = data.items[0]
    if (!top) return null

    const videoId = top.id.videoId
    const details = await getVideoDetails([videoId])
    const duration = details[0]?.duration ?? 0

    return buildTrack(videoId, top.snippet, { title, artist, duration })
  } catch (err) {
    if (isQuotaExceededError(err)) {
      console.warn('YouTube API quota exceeded for today.')
      return null
    }
    throw err
  }
}

export interface SearchBatchCallbacks {
  onTrackFound?: (track: Track) => void
  onDurationResolved?: (videoId: string, durationMs: number) => void
}

export async function searchBatch(
  sources: LastfmTrack[],
  maxResults = 20,
  callbacks: SearchBatchCallbacks = {},
): Promise<{ tracks: Track[]; missing: number; quotaStopped: boolean }> {
  const limited = sources.slice(0, Math.min(maxResults, sources.length))
  const tracks: Track[] = []
  const needsDuration: Array<{ track: Track; videoId: string }> = []
  let quotaStopped = false
  let missing = 0

  for (const src of limited) {
    if (isQuotaExceeded()) {
      quotaStopped = true
      break
    }
    try {
      const apiKey = requireApiKey()
      const q = `${src.artist} ${src.title} official audio`
      const { data } = await axios.get<YouTubeSearchResponse>(`${YOUTUBE_BASE_URL}/search`, {
        params: {
          part: 'snippet',
          q,
          type: 'video',
          videoCategoryId: '10',
          maxResults: 3,
          key: apiKey,
        },
        timeout: 8000,
      })
      addQuotaUsage(1)

      const top = data.items[0]
      if (!top) {
        missing += 1
        continue
      }

      const videoId = top.id.videoId
      const track = buildTrack(videoId, top.snippet, {
        title: src.title,
        artist: src.artist,
        album: src.album ?? '',
        lastfmUrl: src.url ?? '',
        playcount: src.playcount,
        tags: src.tags ?? [],
      })
      tracks.push(track)
      needsDuration.push({ track, videoId })
      callbacks.onTrackFound?.(track)
    } catch (err) {
      if (isQuotaExceededError(err)) {
        console.warn('YouTube API quota exceeded; stopping batch search.')
        quotaStopped = true
        break
      } else {
        console.warn(`YouTube search failed for "${src.artist} - ${src.title}":`, err)
        missing += 1
      }
    }

    await sleep(SEARCH_DELAY_MS)
  }

  if (needsDuration.length > 0) {
    try {
      const details = await getVideoDetails(needsDuration.map((p) => p.videoId))
      const byId = new Map(details.map((d) => [d.id, d]))
      for (const { track, videoId } of needsDuration) {
        const info = byId.get(videoId)
        if (info) {
          track.duration = info.duration
          callbacks.onDurationResolved?.(videoId, info.duration)
        }
      }
    } catch (err) {
      console.warn('YouTube: batched details fetch failed:', err)
    }
  }

  return { tracks, missing, quotaStopped }
}

export async function searchYouTubeByKeywords(genres: string[], limit = 20): Promise<Track[]> {
  const cleaned = genres.map((g) => g.trim()).filter(Boolean)
  if (cleaned.length === 0 || isQuotaExceeded()) return []

  const apiKey = requireApiKey()
  const q = `${cleaned.join(' ')} music playlist`

  try {
    const { data } = await axios.get<YouTubeSearchResponse>(`${YOUTUBE_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q,
        type: 'video',
        videoCategoryId: '10',
        maxResults: limit,
        key: apiKey,
      },
      timeout: 8000,
    })
    addQuotaUsage(1)

    const items = data.items
    if (items.length === 0) return []

    const details = await getVideoDetails(items.map((i) => i.id.videoId))
    const byId = new Map(details.map((d) => [d.id, d]))

    return items.map((item): Track => {
      const videoId = item.id.videoId
      const info = byId.get(videoId)
      return buildTrack(videoId, item.snippet, {
        duration: info?.duration ?? 0,
        playcount: info?.viewCount ?? 0,
        tags: cleaned.slice(),
      })
    })
  } catch (err) {
    if (isQuotaExceededError(err)) {
      console.warn('YouTube API quota exceeded during keyword search.')
      return []
    }
    throw err
  }
}
