import { useMusicStore } from '../../stores/musicStore'
import { YouTubePlayer } from './YouTubePlayer'

export function MiniPlayer() {
  const tracks = useMusicStore((s) => s.tracks)
  const currentTrackIndex = useMusicStore((s) => s.currentTrackIndex)
  const nextTrack = useMusicStore((s) => s.nextTrack)
  const previousTrack = useMusicStore((s) => s.previousTrack)
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying)

  if (currentTrackIndex == null) return null
  const currentTrack = tracks[currentTrackIndex]
  if (!currentTrack) return null

  return (
    <section
      className="flex flex-col items-center gap-4 rounded-3xl p-5 md:p-6 bg-white/85 backdrop-blur border border-weather-cloudy-100 shadow-md"
      aria-label="Now playing"
    >
      <div className="flex items-center gap-3 w-full max-w-sm">
        {currentTrack.albumArt ? (
          <img
            src={currentTrack.albumArt}
            alt=""
            className="w-14 h-14 rounded-lg object-cover flex-none"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-weather-cloudy-100 flex-none" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-weather-cloudy-700">Now playing</p>
          <p className="font-semibold text-weather-cloudy-900 truncate">{currentTrack.title}</p>
          <p className="text-sm text-weather-cloudy-700 truncate">{currentTrack.artist}</p>
        </div>
      </div>

      <YouTubePlayer
        videoId={currentTrack.id}
        autoplay
        onEnded={nextTrack}
        onNext={currentTrackIndex + 1 < tracks.length ? nextTrack : undefined}
        onPrevious={currentTrackIndex > 0 ? previousTrack : undefined}
        onPlayStateChange={setIsPlaying}
      />

      {currentTrack.youtubeMusicUrl ? (
        <a
          href={currentTrack.youtubeMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-weather-cloudy-700 underline underline-offset-2 hover:text-weather-cloudy-900"
        >
          Open in YouTube Music
        </a>
      ) : null}
    </section>
  )
}
