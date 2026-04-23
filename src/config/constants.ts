export const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000
export const MUSIC_CACHE_TTL_MS = 30 * 60 * 1000

export const API_ENDPOINTS = {
  openweather: 'https://api.openweathermap.org/data/2.5',
  spotify: 'https://api.spotify.com/v1',
  appleMusic: 'https://api.music.apple.com/v1',
  youtube: 'https://www.googleapis.com/youtube/v3',
  lastfm: 'https://ws.audioscrobbler.com/2.0/',
} as const

export const env = {
  spotifyClientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '',
  openWeatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY ?? '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  appleMusicToken: import.meta.env.VITE_APPLE_MUSIC_TOKEN ?? '',
  youtubeApiKey: import.meta.env.VITE_YOUTUBE_API_KEY ?? '',
  lastfmApiKey: import.meta.env.VITE_LASTFM_API_KEY ?? '',
}
