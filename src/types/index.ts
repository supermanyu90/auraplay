export type MusicSource = 'spotify' | 'apple' | 'youtube'

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
  album?: string
  duration: number
  albumArt?: string
  previewUrl: string | null
  service: MusicSource
  externalUrl?: string
  youtubeUrl?: string
}

export interface UserPreferences {
  favoriteGenres: string[]
  preferredSources: MusicSource[]
  autoPlay: boolean
  volume: number
  theme: 'auto' | 'light' | 'dark'
}

export interface ListeningHistoryEntry {
  id: string
  track: Track
  playedAt: number
  durationListenedMs: number
  weather?: WeatherData
  mood?: MoodProfile
}

export interface MusicRecommendationResult {
  tracks: Track[]
  mood: MoodProfile
  cachedAt: number
  errors: Array<{ source: MusicSource; message: string }>
}
