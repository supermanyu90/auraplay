import axios from 'axios'
import { AUDIUS_APP_NAME, AUDIUS_HOST_DISCOVERY_URL } from '../../config/constants'
import type { MoodProfile, Track } from '../../types'

interface AudiusUser {
  name?: string
  handle?: string
}

interface AudiusArtwork {
  '150x150'?: string
  '480x480'?: string
  '1000x1000'?: string
}

interface AudiusTrack {
  id: string
  title: string
  user?: AudiusUser
  artwork?: AudiusArtwork
  duration?: number
  permalink?: string
  play_count?: number
  genre?: string
  tags?: string
  release_date?: string
  is_streamable?: boolean
}

interface AudiusListResponse<T> {
  data?: T[]
}

interface AudiusHostResponse {
  data?: string[]
}

let cachedHost: string | null = null
let hostPromise: Promise<string | null> | null = null

async function discoverHost(): Promise<string | null> {
  if (cachedHost) return cachedHost
  if (hostPromise) return hostPromise
  hostPromise = (async () => {
    try {
      const { data } = await axios.get<AudiusHostResponse>(AUDIUS_HOST_DISCOVERY_URL, {
        timeout: 5000,
      })
      const hosts = data.data ?? []
      if (hosts.length === 0) return null
      cachedHost = hosts[Math.floor(Math.random() * hosts.length)]
      return cachedHost
    } catch (err) {
      console.warn('Audius: discovery failed:', err)
      return null
    } finally {
      hostPromise = null
    }
  })()
  return hostPromise
}

function toTrack(host: string, t: AudiusTrack): Track | null {
  if (t.is_streamable === false) return null
  const artworkUrl =
    t.artwork?.['480x480'] ?? t.artwork?.['1000x1000'] ?? t.artwork?.['150x150'] ?? ''
  const tagList = t.tags ? t.tags.split(',').map((s) => s.trim()).filter(Boolean) : []
  if (t.genre) tagList.push(t.genre)
  return {
    id: `audius:${t.id}`,
    title: t.title,
    artist: t.user?.name ?? t.user?.handle ?? 'Unknown',
    album: '',
    albumArt: artworkUrl,
    duration: (t.duration ?? 0) * 1000,
    service: 'audius',
    externalUrl: t.permalink ? `https://audius.co${t.permalink}` : `https://audius.co/tracks/${t.id}`,
    streamUrl: `${host}/v1/tracks/${t.id}/stream?app_name=${encodeURIComponent(AUDIUS_APP_NAME)}`,
    lastfmUrl: '',
    playcount: t.play_count ?? 0,
    tags: tagList,
  }
}

export async function searchTracks(query: string, limit = 20): Promise<Track[]> {
  const host = await discoverHost()
  if (!host) return []
  try {
    const { data } = await axios.get<AudiusListResponse<AudiusTrack>>(
      `${host}/v1/tracks/search`,
      {
        params: { query, app_name: AUDIUS_APP_NAME },
        timeout: 8000,
      },
    )
    return (data.data ?? [])
      .slice(0, limit)
      .map((t) => toTrack(host, t))
      .filter((t): t is Track => t !== null)
  } catch (err) {
    console.warn(`Audius: search "${query}" failed:`, err)
    return []
  }
}

export async function getTrendingByGenre(genre: string, limit = 20): Promise<Track[]> {
  const host = await discoverHost()
  if (!host) return []
  try {
    const { data } = await axios.get<AudiusListResponse<AudiusTrack>>(
      `${host}/v1/tracks/trending`,
      {
        params: { genre, time: 'week', app_name: AUDIUS_APP_NAME },
        timeout: 8000,
      },
    )
    return (data.data ?? [])
      .slice(0, limit)
      .map((t) => toTrack(host, t))
      .filter((t): t is Track => t !== null)
  } catch (err) {
    console.warn(`Audius: trending "${genre}" failed:`, err)
    return []
  }
}

export async function getRecommendationsForMood(
  mood: MoodProfile,
  limit = 20,
): Promise<Track[]> {
  const seen = new Set<string>()
  const merged: Track[] = []

  for (const tag of mood.genres.slice(0, 3)) {
    const batch = await searchTracks(tag, limit)
    for (const track of batch) {
      const key = `${track.artist.toLowerCase().trim()}::${track.title.toLowerCase().trim()}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(track)
      }
    }
    if (merged.length >= limit) break
  }

  return merged.slice(0, limit)
}
