import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { TrackList } from '../components/music/TrackList'
import { YouTubePlayer } from '../components/music/YouTubePlayer'
import { WeatherCard } from '../components/weather/WeatherCard'
import { useMusicStore } from '../stores/musicStore'
import { useWeatherStore } from '../stores/weatherStore'

export default function Music() {
  const navigate = useNavigate()
  const moodProfile = useWeatherStore((s) => s.moodProfile)
  const tracks = useMusicStore((s) => s.tracks)
  const currentIndex = useMusicStore((s) => s.currentIndex)
  const isLoading = useMusicStore((s) => s.isLoading)
  const error = useMusicStore((s) => s.error)
  const loadRecommendations = useMusicStore((s) => s.loadRecommendations)
  const playTrack = useMusicStore((s) => s.playTrack)
  const nextTrack = useMusicStore((s) => s.nextTrack)
  const previousTrack = useMusicStore((s) => s.previousTrack)

  useEffect(() => {
    if (moodProfile) {
      void loadRecommendations(moodProfile)
    }
  }, [moodProfile, loadRecommendations])

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

  const currentTrack = tracks[currentIndex] ?? null

  return (
    <div className="py-8 md:py-12 space-y-6">
      <WeatherCard />

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : tracks.length === 0 ? (
        <div className="py-10 text-center text-weather-cloudy-700">No tracks yet.</div>
      ) : (
        <>
          <TrackList tracks={tracks} currentIndex={currentIndex} onPlay={playTrack} />

          {currentTrack ? (
            <section
              className="flex flex-col items-center gap-4 rounded-3xl p-5 md:p-6 bg-white/85 backdrop-blur border border-weather-cloudy-100 shadow-md"
              aria-label="Now playing"
            >
              <div className="text-center max-w-sm">
                <p className="text-xs uppercase tracking-widest text-weather-cloudy-700">
                  Now playing
                </p>
                <p className="font-semibold text-weather-cloudy-900 truncate mt-1">
                  {currentTrack.title}
                </p>
                <p className="text-sm text-weather-cloudy-700 truncate">{currentTrack.artist}</p>
              </div>
              <YouTubePlayer
                videoId={currentTrack.id}
                autoplay
                onEnded={nextTrack}
                onNext={currentIndex + 1 < tracks.length ? nextTrack : undefined}
                onPrevious={currentIndex > 0 ? previousTrack : undefined}
              />
              {currentTrack.youtubeUrl ? (
                <a
                  href={currentTrack.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-weather-cloudy-700 underline underline-offset-2 hover:text-weather-cloudy-900"
                >
                  Open on YouTube
                </a>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="py-16 text-center">
      <Loader2
        className="w-8 h-8 mx-auto mb-3 text-weather-cloudy-700 animate-spin"
        aria-hidden="true"
      />
      <p className="text-weather-cloudy-900 font-medium">Building your soundtrack…</p>
      <p className="text-sm text-weather-cloudy-700 mt-1">
        Matching mood tags on Last.fm, then finding playable versions on YouTube.
      </p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-10 max-w-md mx-auto text-center flex flex-col items-center">
      <AlertCircle className="w-8 h-8 text-weather-stormy-700 mb-3" aria-hidden="true" />
      <p className="text-weather-cloudy-900 font-medium">Could not load music.</p>
      <p className="text-sm text-weather-cloudy-700 mt-2">{message}</p>
    </div>
  )
}
