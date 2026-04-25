import { CACHE_DURATION_MS, MAX_TRACKS } from '../config/constants'
import type { LastfmTrack } from './lastfm/lastfmApi'
import { getRecommendationsForMood } from './lastfm/lastfmApi'
import { searchBatch, searchYouTubeByKeywords } from './youtube/youtubeMusicApi'
import { cacheGet, cacheGetStale, cacheSet } from '../utils/cache'
import { deduplicateTracks } from '../utils/deduplication'
import { applyRegionalPreference } from '../utils/moodMapper'
import { getQuotaRemaining, getQuotaUsed, isQuotaExceeded } from '../utils/quotaTracker'
import type { MoodProfile, MusicResult, RegionalPreference, Track } from '../types'

const TRACKS_CACHE_PREFIX = 'auraplay:tracks:'

export interface GetRecommendationsOptions {
  onProgress?: (message: string) => void
  onTrackFound?: (track: Track) => void
  onDurationResolved?: (videoId: string, durationMs: number) => void
  regionalPreference?: RegionalPreference
}

function quotaSnapshot(): { used: number; remaining: number } {
  return { used: getQuotaUsed(), remaining: getQuotaRemaining() }
}

export async function getRecommendations(
  mood: MoodProfile,
  opts: GetRecommendationsOptions = {},
): Promise<MusicResult> {
  const onProgress = opts.onProgress ?? (() => {})
  const regional = opts.regionalPreference ?? 'global'
  const adjustedMood = applyRegionalPreference(mood, regional)
  const cacheKey = `${TRACKS_CACHE_PREFIX}${mood.condition}:${regional}`
  const errors: string[] = []

  onProgress('Reading the weather...')

  const fresh = cacheGet<Track[]>(cacheKey)
  if (fresh && fresh.length > 0) {
    for (const track of fresh) opts.onTrackFound?.(track)
    const q = quotaSnapshot()
    return {
      tracks: fresh,
      source: 'lastfm+youtube',
      fromCache: true,
      quotaUsed: q.used,
      quotaRemaining: q.remaining,
      errors: [],
    }
  }

  if (isQuotaExceeded()) {
    const stale = cacheGetStale<Track[]>(cacheKey)
    if (stale) for (const track of stale) opts.onTrackFound?.(track)
    const message =
      stale && stale.length > 0
        ? 'Daily search limit reached. Showing saved recommendations.'
        : 'Daily search limit reached. Fresh results available tomorrow.'
    return {
      tracks: stale ?? [],
      source: 'lastfm+youtube',
      fromCache: true,
      quotaUsed: getQuotaUsed(),
      quotaRemaining: 0,
      errors: [message],
    }
  }

  onProgress('Finding matching songs...')

  let lastfmTracks: LastfmTrack[] = []
  let lastfmFailed = false
  try {
    lastfmTracks = await getRecommendationsForMood(adjustedMood, 30)
  } catch (err) {
    lastfmFailed = true
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`Last.fm unavailable: ${msg}`)
  }

  const deduped = deduplicateTracks(lastfmTracks).slice(0, MAX_TRACKS)
  let finalTracks: Track[] = []

  if (deduped.length > 0) {
    onProgress('Searching YouTube...')
    const result = await searchBatch(deduped, MAX_TRACKS, {
      onTrackFound: opts.onTrackFound,
      onDurationResolved: opts.onDurationResolved,
    })
    finalTracks = result.tracks
    if (result.missing > 0) {
      errors.push(`${result.missing} tracks not found on YouTube.`)
    }
    if (result.quotaStopped) {
      errors.push('Daily YouTube search limit reached partway through.')
    }
  } else {
    onProgress('Searching YouTube by genre...')
    if (!lastfmFailed) {
      errors.push('Last.fm returned no tracks; falling back to YouTube genre search.')
    }
    finalTracks = await searchYouTubeByKeywords(adjustedMood.genres.slice(0, 2))
    for (const track of finalTracks) opts.onTrackFound?.(track)
    if (finalTracks.length === 0) {
      errors.push('YouTube genre search returned nothing.')
    }
  }

  onProgress('Almost ready...')

  if (finalTracks.length > 0) {
    cacheSet(cacheKey, finalTracks, CACHE_DURATION_MS)
  } else {
    const stale = cacheGetStale<Track[]>(cacheKey)
    if (stale && stale.length > 0) {
      finalTracks = stale
      for (const track of stale) opts.onTrackFound?.(track)
      errors.push('Live fetch failed; showing previously saved recommendations.')
    }
  }

  const q = quotaSnapshot()
  return {
    tracks: finalTracks,
    source: 'lastfm+youtube',
    fromCache: false,
    quotaUsed: q.used,
    quotaRemaining: q.remaining,
    errors,
  }
}
