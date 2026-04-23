import axios from 'axios'
import { API_ENDPOINTS, env } from '../../config/constants'
import type { MoodProfile } from '../../types'
import { toLastfmTags } from '../../utils/lastfmTagMapping'

export interface LastfmTrack {
  title: string
  artist: string
  playcount: number
  album?: string
  tags?: string[]
  url?: string
}

const CACHE_PREFIX = 'auraplay:lastfm:'
const CACHE_TTL_MS = 30 * 60 * 1000
const RATE_LIMIT_DELAY_MS = 220

function getApiKey(): string {
  if (!env.lastfmApiKey) {
    throw new Error('Last.fm API key is missing. Set VITE_LASTFM_API_KEY in .env.local')
  }
  return env.lastfmApiKey
}

interface LastfmErrorResponse {
  error: number
  message: string
}

async function callLastfm<T>(params: Record<string, string | number>): Promise<T> {
  const apiKey = getApiKey()
  const { data } = await axios.get<T | LastfmErrorResponse>(API_ENDPOINTS.lastfm, {
    params: { ...params, api_key: apiKey, format: 'json' },
    timeout: 8000,
  })
  if (data && typeof data === 'object' && 'error' in data) {
    const err = data as LastfmErrorResponse
    throw new Error(`Last.fm error ${err.error}: ${err.message ?? 'unknown error'}`)
  }
  return data as T
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
    // quota exceeded or storage unavailable — ignore
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function dedupeKey(track: LastfmTrack): string {
  return `${track.artist.toLowerCase().trim()}::${track.title.toLowerCase().trim()}`
}

interface TagTopTracksResponse {
  tracks?: {
    track?: Array<{
      name: string
      playcount?: string
      artist: { name: string } | string
      url?: string
    }>
  }
}

export async function getTopTracksByTag(tag: string, limit = 30): Promise<LastfmTrack[]> {
  const cacheKey = `tag:${tag}:${limit}`
  const cached = cacheGet<LastfmTrack[]>(cacheKey)
  if (cached) return cached

  const data = await callLastfm<TagTopTracksResponse>({
    method: 'tag.getTopTracks',
    tag,
    limit,
  })

  const tracks = (data.tracks?.track ?? []).map(
    (t): LastfmTrack => ({
      title: t.name,
      artist: typeof t.artist === 'string' ? t.artist : t.artist.name,
      playcount: Number(t.playcount ?? 0),
      url: t.url,
    }),
  )

  cacheSet(cacheKey, tracks)
  return tracks
}

interface SimilarTracksResponse {
  similartracks?: {
    track?: Array<{
      name: string
      playcount?: number
      artist: { name: string }
      url?: string
    }>
  }
}

export async function getSimilarTracks(
  artist: string,
  track: string,
  limit = 10,
): Promise<LastfmTrack[]> {
  const data = await callLastfm<SimilarTracksResponse>({
    method: 'track.getSimilar',
    artist,
    track,
    limit,
  })
  return (data.similartracks?.track ?? []).map(
    (t): LastfmTrack => ({
      title: t.name,
      artist: t.artist.name,
      playcount: Number(t.playcount ?? 0),
      url: t.url,
    }),
  )
}

interface ArtistTopTracksResponse {
  toptracks?: {
    track?: Array<{
      name: string
      playcount?: string
      artist: { name: string }
      url?: string
    }>
  }
}

export async function getTopTracksByArtist(artist: string, limit = 10): Promise<LastfmTrack[]> {
  const data = await callLastfm<ArtistTopTracksResponse>({
    method: 'artist.getTopTracks',
    artist,
    limit,
  })
  return (data.toptracks?.track ?? []).map(
    (t): LastfmTrack => ({
      title: t.name,
      artist: t.artist.name,
      playcount: Number(t.playcount ?? 0),
      url: t.url,
    }),
  )
}

interface TrackSearchResponse {
  results?: {
    trackmatches?: {
      track?: Array<{
        name: string
        artist: string
        url?: string
        listeners?: string
      }>
    }
  }
}

export async function searchTracks(query: string, limit = 10): Promise<LastfmTrack[]> {
  const data = await callLastfm<TrackSearchResponse>({
    method: 'track.search',
    track: query,
    limit,
  })
  return (data.results?.trackmatches?.track ?? []).map(
    (t): LastfmTrack => ({
      title: t.name,
      artist: t.artist,
      playcount: Number(t.listeners ?? 0),
      url: t.url,
    }),
  )
}

interface TrackInfoResponse {
  track?: {
    name: string
    artist: { name: string } | string
    album?: { title?: string }
    duration?: string
    playcount?: string
    listeners?: string
    url?: string
    toptags?: { tag?: Array<{ name: string }> }
  }
}

export async function getTrackInfo(artist: string, track: string): Promise<LastfmTrack | null> {
  const data = await callLastfm<TrackInfoResponse>({
    method: 'track.getInfo',
    artist,
    track,
  })
  const t = data.track
  if (!t) return null
  return {
    title: t.name,
    artist: typeof t.artist === 'string' ? t.artist : t.artist.name,
    album: t.album?.title,
    playcount: Number(t.playcount ?? 0),
    tags: t.toptags?.tag?.map((x) => x.name),
    url: t.url,
  }
}

export async function getRecommendationsForMood(
  moodProfile: MoodProfile,
  limit = 30,
): Promise<LastfmTrack[]> {
  const allTags = toLastfmTags(moodProfile.genres)
  if (allTags.length === 0) return []

  const primaryTags = allTags.slice(0, 3)

  const primaryResults = await Promise.all(
    primaryTags.map(async (tag, i) => {
      if (i > 0) await sleep(i * RATE_LIMIT_DELAY_MS)
      try {
        return await getTopTracksByTag(tag, limit)
      } catch (err) {
        console.warn(`Last.fm: failed to fetch tracks for tag "${tag}":`, err)
        return [] as LastfmTrack[]
      }
    }),
  )

  const seen = new Set<string>()
  const merged: LastfmTrack[] = []
  for (const batch of primaryResults) {
    for (const track of batch) {
      const key = dedupeKey(track)
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(track)
      }
    }
  }

  if (merged.length < Math.ceil(limit / 2)) {
    const fallbackTags = allTags.slice(3)
    for (const tag of fallbackTags) {
      if (merged.length >= limit) break
      await sleep(RATE_LIMIT_DELAY_MS)
      try {
        const more = await getTopTracksByTag(tag, limit)
        for (const track of more) {
          const key = dedupeKey(track)
          if (!seen.has(key)) {
            seen.add(key)
            merged.push(track)
          }
        }
      } catch (err) {
        console.warn(`Last.fm: fallback tag "${tag}" failed:`, err)
      }
    }
  }

  merged.sort((a, b) => b.playcount - a.playcount)
  return merged.slice(0, limit)
}
