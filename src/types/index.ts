export type WeatherCondition =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'stormy'
  | 'snowy'
  | 'foggy'
  | 'windy'
  | 'scorching'

export interface WeatherData {
  temperature: number
  humidity: number
  pressure: number
  windSpeed: number
  condition: WeatherCondition
  description?: string
  location?: string
  timestamp: number
  visibility?: number
  uvIndex?: number
}

export interface MoodProfile {
  condition: WeatherCondition
  icon: string
  label: string
  energy: number
  valence: number
  tempoMin: number
  tempoMax: number
  genres: string[]
  description: string
  gradientColors: [string, string]
}

export type MusicSource = 'youtube' | 'jamendo' | 'audius'

export type MusicSourcePreference = MusicSource | 'auto'

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  albumArt: string
  duration: number
  service: MusicSource
  externalUrl: string
  // YouTube-only
  youtubeUrl?: string
  youtubeMusicUrl?: string
  // Jamendo / Audius — direct HTML5 audio source
  streamUrl?: string
  // Last.fm metadata (YouTube path only, otherwise empty)
  lastfmUrl: string
  playcount: number
  tags: string[]
}

export interface MusicResult {
  tracks: Track[]
  source: MusicSource | 'lastfm+youtube'
  fromCache: boolean
  quotaUsed: number
  quotaRemaining: number
  errors: string[]
}

export type PlaybackPreference = 'youtube' | 'apple-music'

export type RegionalPreference = 'global' | 'indian' | 'mixed'

export interface UserPreferences {
  temperatureUnit: 'C' | 'F'
  theme: 'auto' | 'light' | 'dark'
  manualLocation?: string
  playbackPreference: PlaybackPreference
  regionalPreference: RegionalPreference
  musicSource: MusicSourcePreference
}

export interface ListeningHistoryEntry {
  id: string
  track: Track
  playedAt: number
  durationListenedMs: number
  weather?: WeatherData
  mood?: MoodProfile
}
