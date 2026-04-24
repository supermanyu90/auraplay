import axios from 'axios'
import { OPENWEATHER_API_KEY, OPENWEATHER_BASE_URL } from '../../config/constants'
import type { WeatherCondition, WeatherData } from '../../types'

interface OpenWeatherResponse {
  main: { temp: number; pressure: number; humidity: number }
  wind: { speed: number; deg?: number }
  weather: Array<{ main: string; description: string; icon: string }>
  visibility?: number
  name: string
  dt: number
}

const CONDITION_MAP: Record<string, WeatherCondition> = {
  Clear: 'sunny',
  Clouds: 'cloudy',
  Rain: 'rainy',
  Drizzle: 'rainy',
  Thunderstorm: 'stormy',
  Tornado: 'stormy',
  Snow: 'snowy',
  Mist: 'foggy',
  Fog: 'foggy',
  Haze: 'foggy',
  Smoke: 'foggy',
  Dust: 'foggy',
  Sand: 'foggy',
  Ash: 'foggy',
  Squall: 'windy',
}

function normalize(res: OpenWeatherResponse): WeatherData {
  const mainKey = res.weather[0]?.main ?? 'Clouds'
  return {
    temperature: Math.round(res.main.temp * 10) / 10,
    humidity: res.main.humidity,
    pressure: res.main.pressure,
    windSpeed: Math.round(res.wind.speed * 3.6 * 10) / 10,
    condition: CONDITION_MAP[mainKey] ?? 'cloudy',
    description: res.weather[0]?.description,
    location: res.name || undefined,
    timestamp: res.dt * 1000,
    visibility: res.visibility != null ? Math.round((res.visibility / 1000) * 10) / 10 : undefined,
  }
}

function requireApiKey(): string {
  if (!OPENWEATHER_API_KEY) {
    throw new Error(
      'OpenWeatherMap API key is missing. Set VITE_OPENWEATHER_API_KEY in .env.local',
    )
  }
  return OPENWEATHER_API_KEY
}

function messageFromError(err: unknown, fallback: string): Error {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    if (status === 401)
      return new Error('OpenWeatherMap rejected the API key. Check VITE_OPENWEATHER_API_KEY.')
    if (status === 404) return new Error('Location not found.')
    if (status === 429)
      return new Error('Weather lookups are rate-limited. Try again in a minute.')
  }
  return new Error(fallback)
}

export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherData> {
  const appid = requireApiKey()
  try {
    const { data } = await axios.get<OpenWeatherResponse>(`${OPENWEATHER_BASE_URL}/weather`, {
      params: { lat, lon, appid, units: 'metric' },
      timeout: 8000,
    })
    return normalize(data)
  } catch (err) {
    throw messageFromError(err, 'Could not fetch weather for your location.')
  }
}

export async function getWeatherByCity(cityName: string): Promise<WeatherData> {
  const appid = requireApiKey()
  try {
    const { data } = await axios.get<OpenWeatherResponse>(`${OPENWEATHER_BASE_URL}/weather`, {
      params: { q: cityName, appid, units: 'metric' },
      timeout: 8000,
    })
    return normalize(data)
  } catch (err) {
    throw messageFromError(err, `Could not fetch weather for "${cityName}".`)
  }
}
