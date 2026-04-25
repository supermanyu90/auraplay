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

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  albumArt: string
  duration: number
  youtubeUrl: string
  youtubeMusicUrl: string
  lastfmUrl: string
  playcount: number
  tags: string[]
  service: 'youtube'
}

export interface MusicResult {
  tracks: Track[]
  source: 'lastfm+youtube'
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
}

export interface ListeningHistoryEntry {
  id: string
  track: Track
  playedAt: number
  durationListenedMs: number
  weather?: WeatherData
  mood?: MoodProfile
}
