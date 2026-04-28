export const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY || ''
export const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/'

export const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || ''
export const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3'

export const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || ''
export const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID || ''
export const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0'

export const AUDIUS_HOST_DISCOVERY_URL = 'https://api.audius.co'
export const AUDIUS_APP_NAME = 'AuraPlay'

export const YOUTUBE_DAILY_SEARCH_LIMIT = 100
export const CACHE_DURATION_MS = 30 * 60 * 1000
export const MAX_TRACKS = 10

export const SHUFFLE_CAPS = {
  youtube: 2,
  jamendo: 4,
  audius: 6,
} as const
