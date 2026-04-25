import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  Clock,
  ExternalLink,
  Info,
  LogIn,
  LogOut,
  Trash2,
  X,
  Youtube,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import {
  LASTFM_API_KEY,
  YOUTUBE_API_KEY,
  YOUTUBE_DAILY_SEARCH_LIMIT,
} from '../config/constants'
import { cacheClear } from '../utils/cache'
import { getQuotaUsed } from '../utils/quotaTracker'
import { useAuthStore } from '../stores/authStore'
import { useMusicStore } from '../stores/musicStore'
import { usePreferencesStore } from '../stores/preferencesStore'
import { useWeatherStore } from '../stores/weatherStore'
import type {
  MusicSourcePreference,
  PlaybackPreference,
  RegionalPreference,
} from '../types'

export default function Profile() {
  const temperatureUnit = usePreferencesStore((s) => s.temperatureUnit)
  const theme = usePreferencesStore((s) => s.theme)
  const playbackPreference = usePreferencesStore((s) => s.playbackPreference)
  const regionalPreference = usePreferencesStore((s) => s.regionalPreference)
  const musicSource = usePreferencesStore((s) => s.musicSource)
  const savedLocation = usePreferencesStore((s) => s.manualLocation)
  const setTemperatureUnit = usePreferencesStore((s) => s.setTemperatureUnit)
  const setTheme = usePreferencesStore((s) => s.setTheme)
  const setPlaybackPreference = usePreferencesStore((s) => s.setPlaybackPreference)
  const setRegionalPreference = usePreferencesStore((s) => s.setRegionalPreference)
  const setMusicSource = usePreferencesStore((s) => s.setMusicSource)
  const setManualLocation = usePreferencesStore((s) => s.setManualLocation)

  const [locationInput, setLocationInput] = useState(savedLocation ?? '')

  const clearMusic = useMusicStore((s) => s.clearTracks)
  const clearWeather = useWeatherStore((s) => s.clearWeather)
  const fetchWeatherByCity = useWeatherStore((s) => s.fetchWeatherByCity)

  const lastfmConfigured = LASTFM_API_KEY.length > 0
  const youtubeConfigured = YOUTUBE_API_KEY.length > 0
  const configuredCount = (lastfmConfigured ? 1 : 0) + (youtubeConfigured ? 1 : 0)
  const quotaUsed = getQuotaUsed()

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
          Account, service status, settings, and about.
        </p>
      </header>

      <AccountSection />

      <section aria-label="Connected services">
        <h2 className="text-lg font-semibold text-weather-cloudy-900 mb-3">Connected services</h2>
        <ul className="space-y-2">
          <ServiceCard
            label="Last.fm"
            sublabel="Recommendation Engine (Free)"
            description="Powering your music discovery"
            configured={lastfmConfigured}
          />
          <ServiceCard
            label="YouTube Music"
            sublabel="Primary Playback (Free)"
            description={
              youtubeConfigured
                ? `${quotaUsed}/${YOUTUBE_DAILY_SEARCH_LIMIT} searches used today`
                : 'Needed for song playback'
            }
            extra={youtubeConfigured ? 'Resets daily at midnight UTC' : undefined}
            configured={youtubeConfigured}
          />
        </ul>
      </section>

      {configuredCount < 2 ? (
        <section
          aria-label="Setup guide"
          className="rounded-2xl p-4 bg-weather-sunny-50/80 border border-weather-sunny-100 flex gap-3"
        >
          <Info className="w-5 h-5 text-weather-sunny-700 flex-none mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-weather-cloudy-900">Finish setup</p>
            <p className="text-sm text-weather-cloudy-700 mt-1">
              Get the best experience by adding your API keys. See the README for a step-by-step
              guide. At minimum, you need Last.fm + YouTube (both free).
            </p>
          </div>
        </section>
      ) : null}

      <section aria-label="Settings">
        <h2 className="text-lg font-semibold text-weather-cloudy-900 mb-3">Settings</h2>
        <div className="space-y-3">
          <Row
            label="Temperature unit"
            description="Celsius or Fahrenheit"
            control={
              <div className="flex gap-1 p-1 rounded-full bg-weather-cloudy-100">
                <PillOption
                  selected={temperatureUnit === 'C'}
                  onClick={() => setTemperatureUnit('C')}
                  label="°C"
                />
                <PillOption
                  selected={temperatureUnit === 'F'}
                  onClick={() => setTemperatureUnit('F')}
                  label="°F"
                />
              </div>
            }
          />

          <div className="p-3 rounded-xl bg-white/70 border border-weather-cloudy-100">
            <p className="font-medium text-weather-cloudy-900">Music source</p>
            <p className="text-xs text-weather-cloudy-700">
              Where playable tracks come from
            </p>
            <div className="mt-3 space-y-2">
              <SourceOption
                value="auto"
                label="Auto"
                sublabel="YouTube first, fall back to Jamendo or Audius if quota is gone"
                selected={musicSource === 'auto'}
                onSelect={() => setMusicSource('auto')}
              />
              <SourceOption
                value="youtube"
                label="YouTube"
                sublabel="Full songs, mainstream catalog (100 searches/day cap)"
                selected={musicSource === 'youtube'}
                onSelect={() => setMusicSource('youtube')}
              />
              <SourceOption
                value="jamendo"
                label="Jamendo"
                sublabel="Creative Commons full songs, indie catalog (free API key required)"
                selected={musicSource === 'jamendo'}
                onSelect={() => setMusicSource('jamendo')}
              />
              <SourceOption
                value="audius"
                label="Audius"
                sublabel="Decentralized catalog, indie / hip-hop / electronic, no key required"
                selected={musicSource === 'audius'}
                onSelect={() => setMusicSource('audius')}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-weather-cloudy-100">
            <p className="font-medium text-weather-cloudy-900">Music taste</p>
            <p className="text-xs text-weather-cloudy-700">
              Which kinds of songs show up in recommendations
            </p>
            <div className="mt-3 space-y-2">
              <RegionOption
                value="global"
                label="Global"
                sublabel="Western genres — indie, rock, electronic, etc."
                selected={regionalPreference === 'global'}
                onSelect={() => setRegionalPreference('global')}
              />
              <RegionOption
                value="indian"
                label="Indian"
                sublabel="Bollywood, ghazals, classical, bhangra, Punjabi, Sufi"
                selected={regionalPreference === 'indian'}
                onSelect={() => setRegionalPreference('indian')}
              />
              <RegionOption
                value="mixed"
                label="Mixed"
                sublabel="A blend of both"
                selected={regionalPreference === 'mixed'}
                onSelect={() => setRegionalPreference('mixed')}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-weather-cloudy-100">
            <p className="font-medium text-weather-cloudy-900">Default playback</p>
            <p className="text-xs text-weather-cloudy-700">Which service plays your tracks</p>
            <div className="mt-3 space-y-2">
              <PlaybackOption
                value="youtube"
                label="YouTube"
                sublabel="Full songs"
                selected={playbackPreference === 'youtube'}
                onSelect={() => setPlaybackPreference('youtube')}
              />
              <PlaybackOption
                value="apple-music"
                label="Apple Music"
                sublabel="30s previews"
                badge="Coming soon"
                selected={playbackPreference === 'apple-music'}
                onSelect={() => setPlaybackPreference('apple-music')}
              />
            </div>
            {playbackPreference === 'apple-music' ? (
              <p className="mt-3 text-xs text-weather-cloudy-700">
                Apple Music playback is coming soon. YouTube will be used in the meantime.
              </p>
            ) : null}
          </div>

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
            label="Clear recommendation cache"
            description="Remove cached tracks, weather, and YouTube search results"
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

          <div className="p-3 rounded-xl bg-white/70 border border-weather-cloudy-100 flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-full bg-weather-rainy-100 text-weather-rainy-700 flex items-center justify-center flex-none"
              aria-hidden="true"
            >
              <Clock className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-weather-cloudy-900">YouTube quota</p>
              <p className="text-xs text-weather-cloudy-700">
                Resets daily at midnight UTC — {YOUTUBE_DAILY_SEARCH_LIMIT - quotaUsed} searches
                remaining today
              </p>
            </div>
          </div>
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

function AccountSection() {
  const user = useAuthStore((s) => s.user)
  const enabled = useAuthStore((s) => s.enabled)
  const isReady = useAuthStore((s) => s.isReady)
  const isLoading = useAuthStore((s) => s.isLoading)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()

  if (!enabled) return null
  if (!isReady) return null

  if (user) {
    return (
      <section
        aria-label="Account"
        className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 border border-weather-cloudy-100"
      >
        <UserAvatar user={user} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-weather-cloudy-900 truncate">
            {displayName(user) ?? 'Signed in'}
          </p>
          <p className="text-xs text-weather-cloudy-700 truncate">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-weather-cloudy-100 text-sm text-weather-cloudy-900 hover:bg-weather-cloudy-300 disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Sign out
        </button>
      </section>
    )
  }

  return (
    <section
      aria-label="Account"
      className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 border border-weather-cloudy-100"
    >
      <div className="w-10 h-10 rounded-full bg-weather-cloudy-200 text-weather-cloudy-700 flex items-center justify-center flex-none">
        <LogIn className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-weather-cloudy-900">Sign in (optional)</p>
        <p className="text-xs text-weather-cloudy-700">
          Save listening history and preferences across devices.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/auth')}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-weather-cloudy-900 text-white text-sm font-medium hover:scale-[1.02] transition-transform"
      >
        Sign in
      </button>
    </section>
  )
}

function displayName(user: User): string | null {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const name = meta?.full_name ?? meta?.name
  return typeof name === 'string' && name.length > 0 ? name : null
}

function UserAvatar({ user }: { user: User }) {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const avatarUrl = typeof meta?.avatar_url === 'string' ? (meta.avatar_url as string) : null
  const initial = (user.email ?? '?').charAt(0).toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="w-10 h-10 rounded-full object-cover flex-none"
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div
      aria-hidden="true"
      className="w-10 h-10 rounded-full bg-weather-rainy-500 text-white flex items-center justify-center font-semibold flex-none"
    >
      {initial}
    </div>
  )
}

interface ServiceCardProps {
  label: string
  sublabel: string
  description: string
  extra?: string
  configured: boolean
}

function ServiceCard({ label, sublabel, description, extra, configured }: ServiceCardProps) {
  return (
    <li className="flex items-start gap-3 p-4 rounded-xl bg-white/70 border border-weather-cloudy-100">
      <span
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-none ${
          configured ? 'bg-weather-windy-500 text-white' : 'bg-weather-cloudy-300 text-white'
        }`}
        aria-hidden="true"
      >
        {configured ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold text-weather-cloudy-900">{label}</p>
          <span className="text-xs text-weather-cloudy-700 truncate">{sublabel}</span>
        </div>
        <p className="text-sm text-weather-cloudy-700 mt-0.5">{description}</p>
        {extra ? <p className="text-[11px] text-weather-cloudy-700/70 mt-1">{extra}</p> : null}
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

function PillOption({
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
      aria-pressed={selected}
      className={`px-3 py-1 rounded-full text-sm transition-colors ${
        selected ? 'bg-weather-cloudy-900 text-white' : 'text-weather-cloudy-700'
      }`}
    >
      {label}
    </button>
  )
}

interface SourceOptionProps {
  value: MusicSourcePreference
  label: string
  sublabel: string
  selected: boolean
  onSelect: () => void
}

function SourceOption({ value, label, sublabel, selected, onSelect }: SourceOptionProps) {
  return (
    <label
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
        selected
          ? 'bg-white border-weather-cloudy-300 shadow-sm'
          : 'bg-white/40 border-weather-cloudy-100 hover:bg-white/70'
      }`}
    >
      <input
        type="radio"
        name="musicSource"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={`w-5 h-5 rounded-full flex-none border-2 flex items-center justify-center transition-colors ${
          selected ? 'border-weather-cloudy-900' : 'border-weather-cloudy-300'
        }`}
        aria-hidden="true"
      >
        {selected ? (
          <span className="w-2.5 h-2.5 rounded-full bg-weather-cloudy-900" />
        ) : null}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-medium text-weather-cloudy-900">{label}</span>
        <span className="block text-xs text-weather-cloudy-700">{sublabel}</span>
      </span>
    </label>
  )
}

interface RegionOptionProps {
  value: RegionalPreference
  label: string
  sublabel: string
  selected: boolean
  onSelect: () => void
}

function RegionOption({ value, label, sublabel, selected, onSelect }: RegionOptionProps) {
  return (
    <label
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
        selected
          ? 'bg-white border-weather-cloudy-300 shadow-sm'
          : 'bg-white/40 border-weather-cloudy-100 hover:bg-white/70'
      }`}
    >
      <input
        type="radio"
        name="regionalPreference"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={`w-5 h-5 rounded-full flex-none border-2 flex items-center justify-center transition-colors ${
          selected ? 'border-weather-cloudy-900' : 'border-weather-cloudy-300'
        }`}
        aria-hidden="true"
      >
        {selected ? (
          <span className="w-2.5 h-2.5 rounded-full bg-weather-cloudy-900" />
        ) : null}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-medium text-weather-cloudy-900">{label}</span>
        <span className="block text-xs text-weather-cloudy-700">{sublabel}</span>
      </span>
    </label>
  )
}

interface PlaybackOptionProps {
  value: PlaybackPreference
  label: string
  sublabel: string
  badge?: string
  selected: boolean
  onSelect: () => void
}

function PlaybackOption({
  value,
  label,
  sublabel,
  badge,
  selected,
  onSelect,
}: PlaybackOptionProps) {
  return (
    <label
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
        selected
          ? 'bg-white border-weather-cloudy-300 shadow-sm'
          : 'bg-white/40 border-weather-cloudy-100 hover:bg-white/70'
      }`}
    >
      <input
        type="radio"
        name="playbackPreference"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={`w-5 h-5 rounded-full flex-none border-2 flex items-center justify-center transition-colors ${
          selected ? 'border-weather-cloudy-900' : 'border-weather-cloudy-300'
        }`}
        aria-hidden="true"
      >
        {selected ? (
          <span className="w-2.5 h-2.5 rounded-full bg-weather-cloudy-900" />
        ) : null}
      </span>
      <span
        className="w-9 h-9 rounded-lg bg-[#FF0000]/10 text-[#FF0000] flex items-center justify-center flex-none"
        aria-hidden="true"
      >
        <Youtube className="w-4 h-4" strokeWidth={2.5} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-medium text-weather-cloudy-900 flex items-center gap-2">
          {label}
          {badge ? (
            <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-weather-cloudy-100 text-weather-cloudy-700">
              {badge}
            </span>
          ) : null}
        </span>
        <span className="block text-xs text-weather-cloudy-700">{sublabel}</span>
      </span>
    </label>
  )
}
