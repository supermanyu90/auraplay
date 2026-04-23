import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Droplets,
  Eye,
  Gauge,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
  ArrowRight,
} from 'lucide-react'
import { SensorGauge } from '../components/weather/SensorGauge'
import { WeatherCard } from '../components/weather/WeatherCard'
import { useGeolocation } from '../hooks/useGeolocation'
import { useWeatherStore } from '../stores/weatherStore'
import type { WeatherCondition, WeatherData } from '../types'

const SCAN_EMOJIS = ['☀️', '☁️', '🌧️', '⛈️', '❄️', '🌫️', '🌬️', '🔥']

const UV_BY_CONDITION: Record<WeatherCondition, number> = {
  sunny: 7,
  scorching: 10,
  cloudy: 3,
  foggy: 2,
  windy: 4,
  rainy: 1,
  stormy: 1,
  snowy: 2,
}

function estimateUV(weather: WeatherData): number {
  return weather.uvIndex ?? UV_BY_CONDITION[weather.condition]
}

export default function Sense() {
  const navigate = useNavigate()
  const {
    latitude,
    longitude,
    error: geoError,
    isLoading: geoLoading,
    requestLocation,
  } = useGeolocation()
  const weatherData = useWeatherStore((s) => s.weatherData)
  const moodProfile = useWeatherStore((s) => s.moodProfile)
  const wxLoading = useWeatherStore((s) => s.isLoading)
  const wxError = useWeatherStore((s) => s.error)
  const fetchWeather = useWeatherStore((s) => s.fetchWeather)

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      void fetchWeather(latitude, longitude)
    }
  }, [latitude, longitude, fetchWeather])

  const hasData = Boolean(weatherData && moodProfile)
  const isLoading = (geoLoading || wxLoading) && !hasData
  const error = !hasData ? geoError ?? wxError : null

  if (isLoading) {
    return <ScanningAnimation />
  }

  if (error) {
    return (
      <div className="py-16 max-w-md mx-auto text-center">
        <p className="text-weather-cloudy-900 font-medium">We couldn't sense your environment.</p>
        <p className="mt-2 text-sm text-weather-cloudy-700">{error}</p>
        <button
          type="button"
          onClick={requestLocation}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-weather-cloudy-900 text-white text-sm font-medium hover:scale-[1.02] transition-transform"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    )
  }

  if (!weatherData || !moodProfile) return null

  const uv = estimateUV(weatherData)
  const visibility = weatherData.visibility ?? 10

  return (
    <div className="py-8 md:py-12 space-y-8">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-widest text-weather-cloudy-700">Detected</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-weather-cloudy-900 mt-1">
          Your current environment
        </h1>
      </header>

      <section
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
        aria-label="Environmental sensors"
      >
        <SensorGauge
          label="Temperature"
          value={weatherData.temperature}
          unit="°C"
          icon={Thermometer}
          max={50}
          color="#FBBF24"
        />
        <SensorGauge
          label="Humidity"
          value={weatherData.humidity}
          unit="%"
          icon={Droplets}
          max={100}
          color="#3B82F6"
        />
        <SensorGauge
          label="Pressure"
          value={weatherData.pressure}
          unit="hPa"
          icon={Gauge}
          max={1050}
          color="#4B5563"
        />
        <SensorGauge
          label="Wind"
          value={weatherData.windSpeed}
          unit="km/h"
          icon={Wind}
          max={60}
          color="#10B981"
        />
        <SensorGauge
          label="UV Index"
          value={uv}
          unit=""
          icon={Sun}
          max={11}
          color="#F97316"
        />
        <SensorGauge
          label="Visibility"
          value={visibility}
          unit="km"
          icon={Eye}
          max={10}
          color="#9CA3AF"
        />
      </section>

      <WeatherCard />

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => navigate('/music')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-weather-cloudy-900 text-white font-medium shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          See Your Soundtrack
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={requestLocation}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/70 hover:bg-white/90 border border-weather-cloudy-100 text-weather-cloudy-900 font-medium backdrop-blur transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Re-scan
        </button>
      </div>
    </div>
  )
}

function ScanningAnimation() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % SCAN_EMOJIS.length)
    }, 600)
    return () => window.clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border-2 border-weather-rainy-500/70 animate-ping"
          aria-hidden="true"
        />
        <span
          className="absolute inset-3 rounded-full border-2 border-weather-rainy-500/40 animate-ping"
          style={{ animationDelay: '0.4s' }}
          aria-hidden="true"
        />
        <span
          className="absolute inset-6 rounded-full bg-white/70 backdrop-blur"
          aria-hidden="true"
        />
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, scale: 0.6, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-5xl relative"
            aria-hidden="true"
          >
            {SCAN_EMOJIS[idx]}
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="text-weather-cloudy-900 font-medium mt-8">Sensing your environment…</p>
      <p className="text-sm text-weather-cloudy-700 mt-1">
        Reading location, temperature, and sky.
      </p>
    </div>
  )
}
