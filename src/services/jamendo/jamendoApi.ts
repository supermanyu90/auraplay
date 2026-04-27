import axios from 'axios'
import { JAMENDO_BASE_URL, JAMENDO_CLIENT_ID } from '../../config/constants'
import type { MoodProfile, Track } from '../../types'

interface JamendoTrack {
  id: string
  name: string
  artist_name: string
  album_name?: string
  image?: string
  album_image?: string
  audio?: string
  audiodownload?: string
  duration?: number
  shareurl?: string
  musicinfo?: { tags?: { genres?: string[]; vartags?: string[] } }
}

interface JamendoResponse {
  results?: JamendoTrack[]
  headers?: { code?: number; error_message?: string }
}

function requireClientId(): string {
  if (!JAMENDO_CLIENT_ID) {
    throw new Error('Jamendo client ID is missing. Set VITE_JAMENDO_CLIENT_ID in .env.local')
  }
  return JAMENDO_CLIENT_ID
}

function toTrack(t: JamendoTrack): Track | null {
  if (!t.audio) return null
  const tagSet: string[] = []
  for (const g of t.musicinfo?.tags?.genres ?? []) tagSet.push(g)
  for (const v of t.musicinfo?.tags?.vartags ?? []) tagSet.push(v)
  return {
    id: `jamendo:${t.id}`,
    title: t.name,
    artist: t.artist_name,
    album: t.album_name ?? '',
    albumArt: t.image ?? t.album_image ?? '',
    duration: (t.duration ?? 0) * 1000,
    service: 'jamendo',
    externalUrl: t.shareurl ?? `https://www.jamendo.com/track/${t.id}`,
    streamUrl: t.audio,
    lastfmUrl: '',
    playcount: 0,
    tags: tagSet,
  }
}

export async function getTracksByTag(tag: string, limit = 20): Promise<Track[]> {
  const client_id = requireClientId()
  try {
    const { data } = await axios.get<JamendoResponse>(`${JAMENDO_BASE_URL}/tracks/`, {
      params: {
        client_id,
        format: 'json',
        limit,
        tags: tag,
        include: 'musicinfo',
        order: 'popularity_total',
      },
      timeout: 12000,
    })
    return (data.results ?? []).map(toTrack).filter((t): t is Track => t !== null)
  } catch (err) {
    console.warn(`Jamendo: failed to fetch tracks for tag "${tag}":`, err)
    return []
  }
}

export async function searchTracks(query: string, limit = 20): Promise<Track[]> {
  const client_id = requireClientId()
  try {
    const { data } = await axios.get<JamendoResponse>(`${JAMENDO_BASE_URL}/tracks/`, {
      params: {
        client_id,
        format: 'json',
        limit,
        search: query,
        include: 'musicinfo',
        order: 'popularity_total',
      },
      timeout: 12000,
    })
    return (data.results ?? []).map(toTrack).filter((t): t is Track => t !== null)
  } catch (err) {
    console.warn(`Jamendo: search "${query}" failed:`, err)
    return []
  }
}

export async function getRecommendationsForMood(
  mood: MoodProfile,
  limit = 20,
): Promise<Track[]> {
  if (!JAMENDO_CLIENT_ID) {
    throw new Error('Jamendo client ID is missing. Set VITE_JAMENDO_CLIENT_ID in .env.local')
  }

  const tags = mood.genres.slice(0, 3)
  if (tags.length === 0) return []

  const seen = new Set<string>()
  const merged: Track[] = []

  for (const tag of tags) {
    const batch = await getTracksByTag(tag, limit)
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
