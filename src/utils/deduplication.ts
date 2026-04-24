import type { LastfmTrack } from '../services/lastfm/lastfmApi'

const SUFFIX_PATTERN =
  /\s*[([][^)\]]*(?:remaster(?:ed)?|deluxe|feat\.?|featuring|explicit|clean|radio\s*edit|album\s+version|live|extended|bonus\s+track|anniversary|mono|stereo)[^)\]]*[)\]]/gi

const WHITESPACE = /\s{2,}/g

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(SUFFIX_PATTERN, '').replace(WHITESPACE, ' ').trim()
}

function normalizeArtist(artist: string): string {
  return artist.toLowerCase().replace(WHITESPACE, ' ').trim()
}

function dedupeKey(track: LastfmTrack): string {
  return `${normalizeArtist(track.artist)}::${normalizeTitle(track.title)}`
}

export function deduplicateTracks(tracks: LastfmTrack[]): LastfmTrack[] {
  const byKey = new Map<string, LastfmTrack>()
  for (const track of tracks) {
    const key = dedupeKey(track)
    const existing = byKey.get(key)
    if (!existing || track.playcount > existing.playcount) {
      byKey.set(key, track)
    }
  }
  return Array.from(byKey.values())
}
