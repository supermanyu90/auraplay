import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shuffle } from 'lucide-react'
import { TrackList } from '../components/music/TrackList'
import { WeatherCard } from '../components/weather/WeatherCard'
import { useMusicStore } from '../stores/musicStore'
import { usePreferencesStore } from '../stores/preferencesStore'
import { useWeatherStore } from '../stores/weatherStore'

export default function Music() {
  const navigate = useNavigate()
  const moodProfile = useWeatherStore((s) => s.moodProfile)
  const tracks = useMusicStore((s) => s.tracks)
  const currentTrackIndex = useMusicStore((s) => s.currentTrackIndex)
  const isPlaying = useMusicStore((s) => s.isPlaying)
  const isLoading = useMusicStore((s) => s.isLoading)
  const loadingMessage = useMusicStore((s) => s.loadingMessage)
  const error = useMusicStore((s) => s.error)
  const warnings = useMusicStore((s) => s.warnings)
  const quotaUsed = useMusicStore((s) => s.youtubeQuotaUsed)
  const quotaLimit = useMusicStore((s) => s.youtubeQuotaLimit)
  const fetchRecommendations = useMusicStore((s) => s.fetchRecommendations)
  const playTrack = useMusicStore((s) => s.playTrack)
  const regionalPreference = usePreferencesStore((s) => s.regionalPreference)
  const musicSource = usePreferencesStore((s) => s.musicSource)

  useEffect(() => {
    if (moodProfile) {
      void fetchRecommendations(moodProfile)
    }
  }, [moodProfile, regionalPreference, musicSource, fetchRecommendations])

  if (!moodProfile) {
    return (
      <div className="py-16 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-semibold text-weather-cloudy-900">No mood yet</h1>
        <p className="text-sm text-weather-cloudy-700 mt-2">
          Pick a weather mood from the home page, or scan your environment to auto-detect one.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-weather-cloudy-900 text-white text-sm font-medium hover:scale-[1.02] transition-transform"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Go to home
        </button>
      </div>
    )
  }

  const quotaExceeded = quotaUsed >= quotaLimit
  const handleRetry = () => {
    void fetchRecommendations(moodProfile)
  }
  const handleShuffleNew = () => {
    void fetchRecommendations(moodProfile, { refresh: true })
  }

  return (
    <div className="py-8 md:py-12 space-y-6">
      <WeatherCard />

      {isLoading && tracks.length === 0 && loadingMessage ? (
        <p className="text-center text-sm text-weather-cloudy-700 animate-pulse">
          {loadingMessage}
        </p>
      ) : null}

      {tracks.length > 0 && !isLoading ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleShuffleNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-weather-cloudy-100 text-sm font-medium text-weather-cloudy-900 hover:bg-white shadow-sm"
          >
            <Shuffle className="w-4 h-4" aria-hidden="true" />
            Shuffle to new music
          </button>
        </div>
      ) : null}

      <TrackList
        tracks={tracks}
        currentIndex={currentTrackIndex}
        isPlaying={isPlaying}
        isLoading={isLoading}
        error={error}
        warnings={warnings}
        quotaExceeded={quotaExceeded}
        onPlay={playTrack}
        onRetry={handleRetry}
      />
    </div>
  )
}
