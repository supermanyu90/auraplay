import { useState } from 'react'
import { Check, ExternalLink, Trash2, X } from 'lucide-react'
import {
  LASTFM_API_KEY,
  OPENWEATHER_API_KEY,
  YOUTUBE_API_KEY,
  YOUTUBE_DAILY_SEARCH_LIMIT,
} from '../config/constants'
import { cacheClear } from '../utils/cache'
import { getQuotaRemaining } from '../utils/quotaTracker'
import { useMusicStore } from '../stores/musicStore'
import { usePreferencesStore } from '../stores/preferencesStore'
import { useWeatherStore } from '../stores/weatherStore'

export default function Profile() {
  const temperatureUnit = usePreferencesStore((s) => s.temperatureUnit)
  const theme = usePreferencesStore((s) => s.theme)
  const savedLocation = usePreferencesStore((s) => s.manualLocation)
  const setTemperatureUnit = usePreferencesStore((s) => s.setTemperatureUnit)
  const setTheme = usePreferencesStore((s) => s.setTheme)
  const setManualLocation = usePreferencesStore((s) => s.setManualLocation)

  const [locationInput, setLocationInput] = useState(savedLocation ?? '')

  const clearMusic = useMusicStore((s) => s.clearTracks)
  const clearWeather = useWeatherStore((s) => s.clearWeather)
  const fetchWeatherByCity = useWeatherStore((s) => s.fetchWeatherByCity)

  const lastfmConfigured = LASTFM_API_KEY.length > 0
  const youtubeConfigured = YOUTUBE_API_KEY.length > 0
  const weatherConfigured = OPENWEATHER_API_KEY.length > 0
  const allConfigured = lastfmConfigured && youtubeConfigured && weatherConfigured
  const quotaRemaining = getQuotaRemaining()

  const handleClearCache = () => {
    cacheClear('auraplay:')
    clearMusic()
    clearWeather()
  }

  const handleLocationSubmit = () => {
    const trimmed = locationInput.trim()
    setManualLocation(trimmed || undefined)
    if (trimmed) void fetchWeatherByCity(trimmed)
  }

  return (
    <div className="py-8 md:py-12 max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold text-weather-cloudy-900">Profile</h1>
        <p className="text-sm text-weather-cloudy-700 mt-1">
          Service status, settings, and about.
        </p>
      </header>

      <section aria-label="Connected services">
        <h2 className="text-lg font-semibold text-weather-cloudy-900 mb-3">Connected services</h2>
        {allConfigured ? (
          <p className="text-sm font-medium text-weather-windy-700 mb-3">All systems go ✓</p>
        ) : (
          <p className="text-sm text-weather-cloudy-700 mb-3">
            Missing keys — see the README for setup instructions.
          </p>
        )}
        <ul className="space-y-2">
          <ServiceRow
            label="Last.fm"
            sublabel="Discovery Engine"
            description="Finds songs matching your weather mood"
            ok={lastfmConfigured}
          />
          <ServiceRow
            label="YouTube Music"
            sublabel="Playback"
            description={
              youtubeConfigured
                ? `${quotaRemaining}/${YOUTUBE_DAILY_SEARCH_LIMIT} searches left today`
                : 'Needed for song playback'
            }
            extra={youtubeConfigured ? 'Resets at midnight UTC' : undefined}
            ok={youtubeConfigured}
          />
          <ServiceRow
            label="OpenWeatherMap"
            sublabel="Weather"
            description="Detects ambient conditions"
            ok={weatherConfigured}
          />
        </ul>
      </section>

      <section aria-label="Settings">
        <h2 className="text-lg font-semibold text-weather-cloudy-900 mb-3">Settings</h2>
        <div className="space-y-3">
          <Row
            label="Temperature unit"
            description="Celsius or Fahrenheit"
            control={
              <div className="flex gap-1 p-1 rounded-full bg-weather-cloudy-100">
                <UnitButton
                  selected={temperatureUnit === 'C'}
                  onClick={() => setTemperatureUnit('C')}
                  label="°C"
                />
                <UnitButton
                  selected={temperatureUnit === 'F'}
                  onClick={() => setTemperatureUnit('F')}
                  label="°F"
                />
              </div>
            }
          />

          <Row
            label="Theme"
            description="Background mode"
            control={
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'auto' | 'light' | 'dark')}
                className="px-3 py-1.5 rounded-full text-sm bg-weather-cloudy-100 border-none focus:outline-none focus:ring-2 focus:ring-weather-cloudy-300"
                aria-label="Theme"
              >
                <option value="auto">Auto</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            }
          />

          <div className="p-3 rounded-xl bg-white/70 border border-weather-cloudy-100">
            <div className="mb-2">
              <p className="font-medium text-weather-cloudy-900">Manual location</p>
              <p className="text-xs text-weather-cloudy-700">
                Override geolocation with a city name
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLocationSubmit()
                }}
                placeholder="e.g., London"
                className="flex-1 px-3 py-2 rounded-lg bg-white border border-weather-cloudy-100 text-sm focus:outline-none focus:ring-2 focus:ring-weather-cloudy-300"
                aria-label="City name"
              />
              <button
                type="button"
                onClick={handleLocationSubmit}
                className="px-4 py-2 rounded-lg bg-weather-cloudy-900 text-white text-sm font-medium hover:scale-[1.02] transition-transform"
              >
                Set
              </button>
            </div>
          </div>

          <Row
            label="Clear cache"
            description="Remove cached recommendations and weather"
            control={
              <button
                type="button"
                onClick={handleClearCache}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-weather-cloudy-100 text-sm text-weather-cloudy-900 hover:bg-weather-cloudy-300"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" /> Clear
              </button>
            }
          />
        </div>
      </section>

      <section aria-label="About">
        <h2 className="text-lg font-semibold text-weather-cloudy-900 mb-3">About</h2>
        <div className="p-4 rounded-xl bg-white/70 border border-weather-cloudy-100 text-sm space-y-1.5">
          <p>
            <span className="text-weather-cloudy-700">Version</span> 0.1.0
          </p>
          <p>
            <span className="text-weather-cloudy-700">License</span> MIT
          </p>
          <p>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-weather-rainy-700 hover:underline"
            >
              Source on GitHub <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}

interface ServiceRowProps {
  label: string
  sublabel: string
  description: string
  extra?: string
  ok: boolean
}

function ServiceRow({ label, sublabel, description, extra, ok }: ServiceRowProps) {
  return (
    <li className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-weather-cloudy-100">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-none ${
          ok ? 'bg-weather-windy-500 text-white' : 'bg-weather-cloudy-300 text-white'
        }`}
        aria-hidden="true"
      >
        {ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-weather-cloudy-900">
          {label}
          <span className="font-normal text-xs text-weather-cloudy-700 ml-2">{sublabel}</span>
        </p>
        <p className="text-xs text-weather-cloudy-700">{description}</p>
        {extra ? <p className="text-[10px] text-weather-cloudy-700/70 mt-0.5">{extra}</p> : null}
      </div>
    </li>
  )
}

function Row({
  label,
  description,
  control,
}: {
  label: string
  description: string
  control: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/70 border border-weather-cloudy-100">
      <div className="min-w-0">
        <p className="font-medium text-weather-cloudy-900">{label}</p>
        <p className="text-xs text-weather-cloudy-700">{description}</p>
      </div>
      <div className="flex-none">{control}</div>
    </div>
  )
}

function UnitButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm transition-colors ${
        selected ? 'bg-weather-cloudy-900 text-white' : 'text-weather-cloudy-700'
      }`}
      aria-pressed={selected}
    >
      {label}
    </button>
  )
}
