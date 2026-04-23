import axios from 'axios'
import { API_ENDPOINTS, env } from '../../config/constants'
import type { Track } from '../../types'
import type { LastfmTrack } from '../lastfm/lastfmApi'
import { cleanChannelName, parseDuration, parseYouTubeTitle } from '../../utils/youtubeCleanup'

const CACHE_PREFIX = 'auraplay:youtube:'
const CACHE_TTL_MS = 60 * 60 * 1000

const QUOTA_LIMIT = 10_000
const QUOTA_WARN_THRESHOLD = 0.8
const QUOTA_KEY = 'auraplay:youtube:quota'
const SEARCH_COST = 100
const DETAILS_COST_PER_ID = 1
const SEARCH_DELAY_MS = 200

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

interface QuotaState {
  date: string
  used: number
}

function readQuotaState(): QuotaState {
  try {
    const raw = window.localStorage.getItem(QUOTA_KEY)
    if (!raw) return { date: todayKey(), used: 0 }
    const state = JSON.parse(raw) as QuotaState
    if (state.date !== todayKey()) return { date: todayKey(), used: 0 }
    return state
  } catch {
    return { date: todayKey(), used: 0 }
  }
}

function writeQuotaState(state: QuotaState): void {
  try {
    window.localStorage.setItem(QUOTA_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable — ignore
  }
}

function recordQuotaUse(units: number): void {
  const before = readQuotaState()
  const after: QuotaState = { date: todayKey(), used: before.used + units }
  writeQuotaState(after)
  const warnAt = QUOTA_LIMIT * QUOTA_WARN_THRESHOLD
  if (after.used >= warnAt && before.used < warnAt) {
    console.warn(
      `YouTube API: ${Math.round((after.used / QUOTA_LIMIT) * 100)}% of daily quota used (${after.used}/${QUOTA_LIMIT})`,
    )
  }
}

export function getQuotaUsage(): { used: number; limit: number; percent: number } {
  const state = readQuotaState()
  return { used: state.used, limit: QUOTA_LIMIT, percent: state.used / QUOTA_LIMIT }
}

interface CacheEntry<T> {
  value: T
  expires: number
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (!entry || entry.expires < Date.now()) {
      window.localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return entry.value
  } catch {
    return null
  }
}

function cacheSet<T>(key: string, value: T): void {
  try {
    const entry: CacheEntry<T> = { value, expires: Date.now() + CACHE_TTL_MS }
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch {
    // quota exceeded or unavailable — ignore
  }
}

function searchCacheKey(artist: string, title: string): string {
  return `search:${artist.toLowerCase().trim()}::${title.toLowerCase().trim()}`
}

function requireApiKey(): string {
  if (!env.youtubeApiKey) {
    throw new Error('YouTube API key is missing. Set VITE_YOUTUBE_API_KEY in .env.local')
  }
  return env.youtubeApiKey
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isQuotaExceededError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 403
}

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
    contentDetails: { duration: string }
    statistics: { viewCount?: string }
  }>
}

function pickThumbnail(thumbs: YouTubeThumbnails): string | undefined {
  return thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url
}

function trackFromSnippet(
  videoId: string,
  snippet: YouTubeSearchResponse['items'][number]['snippet'],
  override: { title?: string; artist?: string; album?: string },
  durationMs: number,
): Track {
  return {
    id: videoId,
    title: override.title ?? parseYouTubeTitle(snippet.title),
    artist: override.artist ?? cleanChannelName(snippet.channelTitle),
    album: override.album,
    duration: durationMs,
    albumArt: pickThumbnail(snippet.thumbnails),
    previewUrl: null,
    service: 'youtube',
    externalUrl: `https://music.youtube.com/watch?v=${videoId}`,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
  }
}

export async function searchTrack(title: string, artist: string): Promise<Track | null> {
  const cacheKey = searchCacheKey(artist, title)
  const cached = cacheGet<Track>(cacheKey)
  if (cached) return cached

  const apiKey = requireApiKey()
  const q = `${artist} ${title} official audio`

  try {
    const { data } = await axios.get<YouTubeSearchResponse>(`${API_ENDPOINTS.youtube}/search`, {
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
    recordQuotaUse(SEARCH_COST)

    const top = data.items[0]
    if (!top) return null

    const videoId = top.id.videoId
    const details = await getVideoDetails([videoId])
    const duration = details[0]?.duration ?? 0

    const track = trackFromSnippet(videoId, top.snippet, { title, artist }, duration)
    cacheSet(cacheKey, track)
    return track
  } catch (err) {
    if (isQuotaExceededError(err)) {
      console.warn('YouTube API quota exceeded for today; serving cached results if available.')
      return cacheGet<Track>(cacheKey)
    }
    throw err
  }
}

export interface VideoDetails {
  id: string
  duration: number
  viewCount: number
}

export async function getVideoDetails(videoIds: string[]): Promise<VideoDetails[]> {
  if (videoIds.length === 0) return []
  const apiKey = requireApiKey()

  try {
    const { data } = await axios.get<YouTubeVideoDetailsResponse>(
      `${API_ENDPOINTS.youtube}/videos`,
      {
        params: {
          part: 'contentDetails,statistics',
          id: videoIds.join(','),
          key: apiKey,
        },
        timeout: 8000,
      },
    )
    recordQuotaUse(DETAILS_COST_PER_ID * videoIds.length)

    return data.items.map((item) => ({
      id: item.id,
      duration: parseDuration(item.contentDetails.duration),
      viewCount: Number(item.statistics.viewCount ?? 0),
    }))
  } catch (err) {
    if (isQuotaExceededError(err)) {
      console.warn('YouTube API quota exceeded; could not fetch video details.')
      return []
    }
    throw err
  }
}

export async function searchBatch(tracks: LastfmTrack[], maxResults = 20): Promise<Track[]> {
  const limited = tracks.slice(0, Math.min(maxResults, tracks.length))
  const results: Track[] = []
  const needsDetails: Array<{ track: Track; videoId: string }> = []
  let quotaBlocked = false

  for (const src of limited) {
    const cacheKey = searchCacheKey(src.artist, src.title)
    const cached = cacheGet<Track>(cacheKey)
    if (cached) {
      results.push({
        ...cached,
        title: src.title,
        artist: src.artist,
        album: src.album ?? cached.album,
      })
      continue
    }

    if (quotaBlocked) continue

    try {
      const apiKey = requireApiKey()
      const q = `${src.artist} ${src.title} official audio`
      const { data } = await axios.get<YouTubeSearchResponse>(
        `${API_ENDPOINTS.youtube}/search`,
        {
          params: {
            part: 'snippet',
            q,
            type: 'video',
            videoCategoryId: '10',
            maxResults: 3,
            key: apiKey,
          },
          timeout: 8000,
        },
      )
      recordQuotaUse(SEARCH_COST)

      const top = data.items[0]
      if (top) {
        const videoId = top.id.videoId
        const track = trackFromSnippet(
          videoId,
          top.snippet,
          { title: src.title, artist: src.artist, album: src.album },
          0,
        )
        results.push(track)
        needsDetails.push({ track, videoId })
      }
    } catch (err) {
      if (isQuotaExceededError(err)) {
        console.warn('YouTube API quota exceeded; stopping batch search.')
        quotaBlocked = true
      } else {
        console.warn(`YouTube search failed for "${src.artist} - ${src.title}":`, err)
      }
    }

    await sleep(SEARCH_DELAY_MS)
  }

  if (needsDetails.length > 0 && !quotaBlocked) {
    try {
      const details = await getVideoDetails(needsDetails.map((p) => p.videoId))
      const byId = new Map(details.map((d) => [d.id, d]))
      for (const { track, videoId } of needsDetails) {
        const info = byId.get(videoId)
        if (info) track.duration = info.duration
      }
    } catch (err) {
      console.warn('YouTube: batched details fetch failed:', err)
    }
  }

  for (const { track } of needsDetails) {
    cacheSet(searchCacheKey(track.artist, track.title), track)
  }

  return results
}
