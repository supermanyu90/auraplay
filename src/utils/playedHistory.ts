import type { Track } from '../types'

const KEY = 'auraplay:played-history'
const MAX_ENTRIES = 200

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function write(list: string[]): void {
  try {
    while (list.length > MAX_ENTRIES) list.shift()
    window.localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // ignore quota / storage errors
  }
}

function matchKey(artist: string, title: string): string {
  return `match:${artist.toLowerCase().trim()}::${title.toLowerCase().trim()}`
}

export function getPlayedSet(): Set<string> {
  return new Set(read())
}

export function addPlayed(track: Pick<Track, 'id' | 'artist' | 'title'>): void {
  if (!track.id) return
  const list = read()
  const keys = [track.id, matchKey(track.artist, track.title)]
  const filtered = list.filter((k) => !keys.includes(k))
  filtered.push(...keys)
  write(filtered)
}

export function isPlayed(played: Set<string>, track: { artist: string; title: string }): boolean {
  return played.has(matchKey(track.artist, track.title))
}

export function clearPlayed(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
