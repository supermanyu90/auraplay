import { create } from 'zustand'
import { getWeatherByCity, getWeatherByCoords } from '../services/weather/weatherService'
import type { MoodProfile, WeatherCondition, WeatherData } from '../types'
import { getMoodForCondition, mapWeatherToMood } from '../utils/moodMapper'

interface WeatherStore {
  weatherData: WeatherData | null
  moodProfile: MoodProfile | null
  isLoading: boolean
  error: string | null
  fetchWeather: (lat: number, lon: number) => Promise<void>
  fetchWeatherByCity: (city: string) => Promise<void>
  setMoodManually: (condition: WeatherCondition) => void
  clearWeather: () => void
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Could not load weather right now.'
}

export const useWeatherStore = create<WeatherStore>((set) => ({
  weatherData: null,
  moodProfile: null,
  isLoading: false,
  error: null,

  async fetchWeather(lat, lon) {
    set({ isLoading: true, error: null })
    try {
      const data = await getWeatherByCoords(lat, lon)
      set({ weatherData: data, moodProfile: mapWeatherToMood(data), isLoading: false })
    } catch (err) {
      set({ error: toMessage(err), isLoading: false })
    }
  },

  async fetchWeatherByCity(city) {
    set({ isLoading: true, error: null })
    try {
      const data = await getWeatherByCity(city)
      set({ weatherData: data, moodProfile: mapWeatherToMood(data), isLoading: false })
    } catch (err) {
      set({ error: toMessage(err), isLoading: false })
    }
  },

  setMoodManually(condition) {
    set({
      weatherData: null,
      moodProfile: getMoodForCondition(condition),
      error: null,
      isLoading: false,
    })
  },

  clearWeather() {
    set({ weatherData: null, moodProfile: null, error: null, isLoading: false })
  },
}))
