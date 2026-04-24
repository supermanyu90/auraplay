import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ExternalLink, Info, Loader2 } from 'lucide-react'
import { MiniPlayer } from '../components/music/MiniPlayer'
import { TrackList } from '../components/music/TrackList'
import { WeatherCard } from '../components/weather/WeatherCard'
import { useMusicStore } from '../stores/musicStore'
import { useWeatherStore } from '../stores/weatherStore'

export default function Music() {
  const navigate = useNavigate()
  const moodProfile = useWeatherStore((s) => s.moodProfile)
  const tracks = useMusicStore((s) => s.tracks)
  const currentTrackIndex = useMusicStore((s) => s.currentTrackIndex)
  const isLoading = useMusicStore((s) => s.isLoading)
  const loadingMessage = useMusicStore((s) => s.loadingMessage)
  const error = useMusicStore((s) => s.error)
  const warnings = useMusicStore((s) => s.warnings)
  const quotaUsed = useMusicStore((s) => s.youtubeQuotaUsed)
  const quotaLimit = useMusicStore((s) => s.youtubeQuotaLimit)
  const fetchRecommendations = useMusicStore((s) => s.fetchRecommendations)
  const playTrack = useMusicStore((s) => s.playTrack)

  useEffect(() => {
    if (moodProfile) {
      void fetchRecommendations(moodProfile)
    }
  }, [moodProfile, fetchRecommendations])

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
  const hasTracks = tracks.length > 0

  return (
    <div className="py-8 md:py-12 space-y-6">
      <WeatherCard />

      {warnings.length > 0 && hasTracks ? (
        <WarningBanner warnings={warnings} quotaExceeded={quotaExceeded} />
      ) : null}

      {isLoading ? (
        <LoadingState message={loadingMessage} />
      ) : error ? (
        <ErrorState message={error} genres={moodProfile.genres} />
      ) : !hasTracks ? (
        <FallbackGenrePicker
          genres={moodProfile.genres}
          warnings={warnings}
          quotaExceeded={quotaExceeded}
        />
      ) : (
        <>
          <TrackList tracks={tracks} currentIndex={currentTrackIndex ?? -1} onPlay={playTrack} />
          <MiniPlayer />
        </>
      )}

      <footer className="pt-6 text-center text-xs text-weather-cloudy-700">
        Music discovered via Last.fm · Played via YouTube
      </footer>
    </div>
  )
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center animate-pulse">
      <Loader2
        className="w-8 h-8 mx-auto mb-3 text-weather-cloudy-700 animate-spin"
        aria-hidden="true"
      />
      <p className="text-weather-cloudy-900 font-medium">{message || 'Getting ready…'}</p>
    </div>
  )
}

function ErrorState({ message, genres }: { message: string; genres: string[] }) {
  return (
    <div className="py-10 max-w-md mx-auto text-center flex flex-col items-center">
      <AlertCircle className="w-8 h-8 text-weather-stormy-700 mb-3" aria-hidden="true" />
      <p className="text-weather-cloudy-900 font-medium">Could not load music.</p>
      <p className="text-sm text-weather-cloudy-700 mt-2">{message}</p>
      <FallbackGenrePicker genres={genres} compact />
    </div>
  )
}

function WarningBanner({
  warnings,
  quotaExceeded,
}: {
  warnings: string[]
  quotaExceeded: boolean
}) {
  return (
    <div className="rounded-2xl p-4 bg-weather-sunny-50/80 border border-weather-sunny-100 text-sm text-weather-cloudy-900 flex gap-3">
      <Info className="w-5 h-5 flex-none text-weather-sunny-700 mt-0.5" aria-hidden="true" />
      <div>
        {quotaExceeded ? (
          <p className="font-medium mb-1">Daily search limit reached</p>
        ) : null}
        <ul className="list-disc pl-5 space-y-0.5">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function FallbackGenrePicker({
  genres,
  warnings,
  quotaExceeded,
  compact,
}: {
  genres: string[]
  warnings?: string[]
  quotaExceeded?: boolean
  compact?: boolean
}) {
  if (genres.length === 0) return null
  return (
    <div className={compact ? 'mt-6' : 'py-10 max-w-md mx-auto text-center'}>
      {!compact ? (
        <>
          <p className="text-weather-cloudy-900 font-medium">Having trouble connecting.</p>
          <p className="text-sm text-weather-cloudy-700 mt-2">Search YouTube Music directly:</p>
        </>
      ) : (
        <p className="text-sm text-weather-cloudy-700">Or search YouTube Music directly:</p>
      )}
      <ul className="flex flex-wrap gap-2 justify-center mt-4" aria-label="Genre shortcuts">
        {genres.slice(0, 5).map((genre) => (
          <li key={genre}>
            <a
              href={`https://music.youtube.com/search?q=${encodeURIComponent(genre + ' music')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-white/80 border border-weather-cloudy-100 text-weather-cloudy-900 hover:bg-white"
            >
              {genre}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      {warnings && warnings.length > 0 && !compact ? (
        <ul className="mt-6 text-xs text-weather-cloudy-700 list-disc pl-5 text-left max-w-xs mx-auto">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      ) : null}
      {quotaExceeded && !compact ? (
        <p className="mt-4 text-xs text-weather-cloudy-700">
          Daily YouTube search budget exhausted. Resets at midnight UTC.
        </p>
      ) : null}
    </div>
  )
}
