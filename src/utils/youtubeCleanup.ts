const TITLE_NOISE_PATTERN =
  /\s*[([][^)\]]*(?:official|audio|video|lyric|lyrics|visualiser|visualizer|hd|4k|mv|m\/v|explicit|clean|remaster(?:ed)?|extended|radio(?:\s+edit)?|album\s+version|live|performance)[^)\]]*[)\]]/gi

const TITLE_TRAILING_DASH = /\s+[-–—]\s*$/

export function parseYouTubeTitle(rawTitle: string): string {
  let t = rawTitle.replace(TITLE_NOISE_PATTERN, '')
  t = t.replace(TITLE_TRAILING_DASH, '')
  return t.replace(/\s{2,}/g, ' ').trim()
}

export function cleanChannelName(channel: string): string {
  return channel
    .replace(/\s*-\s*Topic\s*$/i, '')
    .replace(/\s*VEVO\s*$/i, '')
    .replace(/\s*Official\s*$/i, '')
    .trim()
}

export function parseDuration(iso8601: string): number {
  if (!iso8601) return 0
  const match = iso8601.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return 0
  const [, h, m, s] = match
  const seconds = Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0)
  return seconds * 1000
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0:00'
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
