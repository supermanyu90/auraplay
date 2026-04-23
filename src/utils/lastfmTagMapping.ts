const TAG_MAP: Record<string, string> = {
  pop: 'pop',
  'indie-pop': 'indie pop',
  'indie pop': 'indie pop',
  'lo-fi': 'lo-fi',
  lofi: 'lo-fi',
  ambient: 'ambient',
  jazz: 'jazz',
  electronic: 'electronic',
  'trip-hop': 'trip-hop',
  classical: 'classical',
  folk: 'folk',
  afrobeats: 'afrobeats',
  reggaeton: 'reggaeton',
  'post-punk': 'post-punk',
  'dream-pop': 'dream pop',
  'dream pop': 'dream pop',
  shoegaze: 'shoegaze',
  downtempo: 'downtempo',
  'neo-soul': 'neo-soul',
  'prog-rock': 'progressive rock',
  'psych-rock': 'psychedelic rock',
  darkwave: 'darkwave',
  'new-age': 'new age',
  chillwave: 'chillwave',
  funk: 'funk',
  disco: 'disco',
  dancehall: 'dancehall',
  'surf-rock': 'surf rock',
  latin: 'latin',
  'r&b': 'rnb',
  rnb: 'rnb',
  acoustic: 'acoustic',
  soul: 'soul',
  metal: 'metal',
  trance: 'trance',
  industrial: 'industrial',
}

function normalize(genre: string): string {
  const lower = genre.toLowerCase().trim()
  return TAG_MAP[lower] ?? lower
}

export function toLastfmTags(genres: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const genre of genres) {
    const tag = normalize(genre)
    if (tag && !seen.has(tag)) {
      seen.add(tag)
      out.push(tag)
    }
  }
  return out
}
