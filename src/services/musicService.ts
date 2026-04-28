import {
  CACHE_DURATION_MS,
  JAMENDO_CLIENT_ID,
  MAX_TRACKS,
  SHUFFLE_CAPS,
} from '../config/constants'
import * as audius from './audius/audiusApi'
import * as jamendo from './jamendo/jamendoApi'
import type { LastfmTrack } from './lastfm/lastfmApi'
import { getRecommendationsForMood } from './lastfm/lastfmApi'
import { searchBatch, searchYouTubeByKeywords } from './youtube/youtubeMusicApi'
import { cacheGet, cacheGetStale, cacheSet } from '../utils/cache'
import { deduplicateTracks } from '../utils/deduplication'
import { applyRegionalPreference } from '../utils/moodMapper'
import { getPlayedSet, isPlayed } from '../utils/playedHistory'
import { getQuotaRemaining, getQuotaUsed, isQuotaExceeded } from '../utils/quotaTracker'
import type {
  MoodProfile,
  MusicResult,
  MusicSource,
  MusicSourcePreference,
  RegionalPreference,
  Track,
} from '../types'

const TRACKS_CACHE_PREFIX = 'auraplay:tracks:'

export interface GetRecommendationsOptions {
  onProgress?: (message: string) => void
  onTrackFound?: (track: Track) => void
  onDurationResolved?: (videoId: string, durationMs: number) => void
  regionalPreference?: RegionalPreference
  source?: MusicSourcePreference
  /**
   * When true, bypass the cache and sample fresh tracks. Used by the
   * "Shuffle to new music" UI affordance.
   */
  refresh?: boolean
}

const LASTFM_POOL_SIZE = 50
const JAMENDO_POOL_SIZE = 30
const AUDIUS_POOL_SIZE = 30

function shuffleArray<T>(arr: T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function filterAndSample<T extends { artist: string; title: string; id?: string }>(
  pool: T[],
  played: Set<string>,
  limit: number,
): T[] {
  const unplayed = pool.filter((t) => {
    if (t.id && played.has(t.id)) return false
    return !isPlayed(played, t)
  })
  // If history filtered everything out, fall back to the full pool so the
  // user still gets results — they've just heard a lot of this mood.
  const candidates = unplayed.length >= Math.min(limit, 3) ? unplayed : pool
  return shuffleArray(candidates).slice(0, limit)
}

interface RunResult {
  tracks: Track[]
  source: MusicSource | 'lastfm+youtube'
  errors: string[]
}

function quotaSnapshot(): { used: number; remaining: number } {
  return { used: getQuotaUsed(), remaining: getQuotaRemaining() }
}

function emitTracks(tracks: Track[], onTrackFound?: (t: Track) => void) {
  if (!onTrackFound) return
  for (const t of tracks) onTrackFound(t)
}

async function runYouTube(
  mood: MoodProfile,
  opts: GetRecommendationsOptions,
  errors: string[],
  limit: number = MAX_TRACKS,
): Promise<RunResult> {
  const onProgress = opts.onProgress ?? (() => {})
  const played = getPlayedSet()

  onProgress('Finding matching songs...')
  let lastfmTracks: LastfmTrack[] = []
  let lastfmFailed = false
  try {
    lastfmTracks = await getRecommendationsForMood(mood, LASTFM_POOL_SIZE)
  } catch (err) {
    lastfmFailed = true
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`Last.fm unavailable: ${msg}`)
  }

  // Larger pool → filter recently-played → random sample → only YT-search those.
  const pool = deduplicateTracks(lastfmTracks)
  const sampled = filterAndSample(pool, played, limit)
  let tracks: Track[] = []

  if (sampled.length > 0) {
    onProgress('Searching YouTube...')
    const result = await searchBatch(sampled, limit, {
      onTrackFound: opts.onTrackFound,
      onDurationResolved: opts.onDurationResolved,
    })
    tracks = result.tracks
    if (result.missing > 0) errors.push(`${result.missing} tracks not found on YouTube.`)
    if (result.quotaStopped)
      errors.push('Daily YouTube search limit reached partway through.')
  } else {
    onProgress('Searching YouTube by genre...')
    if (!lastfmFailed)
      errors.push('Last.fm returned no tracks; falling back to YouTube genre search.')
    const yt = await searchYouTubeByKeywords(mood.genres.slice(0, 2))
    tracks = filterAndSample(yt, played, limit)
    emitTracks(tracks, opts.onTrackFound)
    if (tracks.length === 0) errors.push('YouTube genre search returned nothing.')
  }

  return { tracks, source: 'lastfm+youtube', errors }
}

async function runJamendo(
  mood: MoodProfile,
  opts: GetRecommendationsOptions,
  errors: string[],
  limit: number = MAX_TRACKS,
): Promise<RunResult> {
  const onProgress = opts.onProgress ?? (() => {})
  if (!JAMENDO_CLIENT_ID) {
    errors.push('Jamendo client ID is missing; set VITE_JAMENDO_CLIENT_ID to enable.')
    return { tracks: [], source: 'jamendo', errors }
  }
  onProgress('Searching Jamendo (Creative Commons)...')
  try {
    const pool = await jamendo.getRecommendationsForMood(mood, JAMENDO_POOL_SIZE)
    const tracks = filterAndSample(pool, getPlayedSet(), limit)
    emitTracks(tracks, opts.onTrackFound)
    if (tracks.length === 0) errors.push('Jamendo returned no tracks for this mood.')
    return { tracks, source: 'jamendo', errors }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`Jamendo failed: ${msg}`)
    return { tracks: [], source: 'jamendo', errors }
  }
}

async function runAudius(
  mood: MoodProfile,
  opts: GetRecommendationsOptions,
  errors: string[],
  limit: number = MAX_TRACKS,
): Promise<RunResult> {
  const onProgress = opts.onProgress ?? (() => {})
  onProgress('Searching Audius (decentralized)...')
  try {
    const pool = await audius.getRecommendationsForMood(mood, AUDIUS_POOL_SIZE)
    const tracks = filterAndSample(pool, getPlayedSet(), limit)
    emitTracks(tracks, opts.onTrackFound)
    if (tracks.length === 0) errors.push('Audius returned no tracks for this mood.')
    return { tracks, source: 'audius', errors }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`Audius failed: ${msg}`)
    return { tracks: [], source: 'audius', errors }
  }
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

async function runAuto(
  mood: MoodProfile,
  opts: GetRecommendationsOptions,
  errors: string[],
): Promise<RunResult> {
  const onProgress = opts.onProgress ?? (() => {})
  // Suppress per-source progress + per-track streaming so we can emit a
  // single shuffled batch when all three backends settle.
  const innerOpts: GetRecommendationsOptions = {
    onProgress: () => {},
    regionalPreference: opts.regionalPreference,
    source: opts.source,
  }

  onProgress('Mixing all sources…')

  const tasks: Array<Promise<RunResult>> = []
  if (!isQuotaExceeded()) {
    tasks.push(runYouTube(mood, innerOpts, errors, SHUFFLE_CAPS.youtube))
  } else {
    errors.push('YouTube daily quota exhausted; mix will use Jamendo + Audius only.')
  }
  if (JAMENDO_CLIENT_ID) {
    tasks.push(runJamendo(mood, innerOpts, errors, SHUFFLE_CAPS.jamendo))
  }
  tasks.push(runAudius(mood, innerOpts, errors, SHUFFLE_CAPS.audius))

  const settled = await Promise.allSettled(tasks)
  const combined: Track[] = []
  for (const r of settled) {
    if (r.status === 'fulfilled') combined.push(...r.value.tracks)
  }

  const finalTracks = shuffleInPlace(combined).slice(0, MAX_TRACKS)
  emitTracks(finalTracks, opts.onTrackFound)
  if (finalTracks.length === 0) errors.push('All three sources returned nothing.')

  return { tracks: finalTracks, source: 'lastfm+youtube', errors }
}

export async function getRecommendations(
  mood: MoodProfile,
  opts: GetRecommendationsOptions = {},
): Promise<MusicResult> {
  const onProgress = opts.onProgress ?? (() => {})
  const regional = opts.regionalPreference ?? 'global'
  const source: MusicSourcePreference = opts.source ?? 'auto'
  const adjustedMood = applyRegionalPreference(mood, regional)
  const cacheKey = `${TRACKS_CACHE_PREFIX}${mood.condition}:${regional}:${source}`
  const errors: string[] = []

  onProgress('Reading the weather...')

  const fresh = !opts.refresh ? cacheGet<Track[]>(cacheKey) : null
  if (fresh && fresh.length > 0) {
    emitTracks(fresh, opts.onTrackFound)
    const q = quotaSnapshot()
    return {
      tracks: fresh,
      source: fresh[0]?.service ?? 'youtube',
      fromCache: true,
      quotaUsed: q.used,
      quotaRemaining: q.remaining,
      errors: [],
    }
  }

  if (source === 'youtube' && isQuotaExceeded()) {
    const stale = cacheGetStale<Track[]>(cacheKey)
    if (stale) emitTracks(stale, opts.onTrackFound)
    const message =
      stale && stale.length > 0
        ? 'Daily search limit reached. Showing saved recommendations.'
        : 'Daily search limit reached. Pick Jamendo or Audius in Profile, or try again tomorrow.'
    return {
      tracks: stale ?? [],
      source: 'youtube',
      fromCache: true,
      quotaUsed: getQuotaUsed(),
      quotaRemaining: 0,
      errors: [message],
    }
  }

  let outcome: RunResult
  switch (source) {
    case 'youtube':
      outcome = await runYouTube(adjustedMood, opts, errors)
      break
    case 'jamendo':
      outcome = await runJamendo(adjustedMood, opts, errors)
      break
    case 'audius':
      outcome = await runAudius(adjustedMood, opts, errors)
      break
    case 'auto':
    default:
      outcome = await runAuto(adjustedMood, opts, errors)
  }

  onProgress('Almost ready...')

  if (outcome.tracks.length > 0) {
    cacheSet(cacheKey, outcome.tracks, CACHE_DURATION_MS)
  } else {
    const stale = cacheGetStale<Track[]>(cacheKey)
    if (stale && stale.length > 0) {
      outcome.tracks = stale
      emitTracks(stale, opts.onTrackFound)
      errors.push('Live fetch failed; showing previously saved recommendations.')
    }
  }

  const q = quotaSnapshot()
  return {
    tracks: outcome.tracks,
    source: outcome.source,
    fromCache: false,
    quotaUsed: q.used,
    quotaRemaining: q.remaining,
    errors: outcome.errors,
  }
}
