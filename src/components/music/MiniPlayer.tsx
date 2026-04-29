import { AnimatePresence, motion } from 'framer-motion'
import { Pause, Play, SkipForward } from 'lucide-react'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { useMusicStore } from '../../stores/musicStore'
import { VolumeControl } from './VolumeControl'

export interface MiniPlayerProps {
  onExpand: () => void
}

export function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const tracks = useMusicStore((s) => s.tracks)
  const currentTrackIndex = useMusicStore((s) => s.currentTrackIndex)
  const nextTrack = useMusicStore((s) => s.nextTrack)
  const togglePlayPause = useMusicStore((s) => s.togglePlayPause)
  const player = useYouTubePlayer()

  const currentTrack = currentTrackIndex != null ? tracks[currentTrackIndex] : null
  const isLast = currentTrackIndex != null && currentTrackIndex + 1 >= tracks.length
  const progress =
    player.duration > 0 ? Math.min(100, (player.currentTime / player.duration) * 100) : 0

  return (
    <AnimatePresence>
      {currentTrack ? (
        <motion.div
          key="mini-player"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="fixed bottom-16 md:bottom-0 inset-x-0 z-30"
        >
          <div className="relative bg-white/90 backdrop-blur border-t border-weather-cloudy-100 shadow-lg">
            <div
              className="absolute top-0 inset-x-0 h-[2px] bg-weather-cloudy-100"
              aria-hidden="true"
            >
              <div
                className="h-full bg-weather-cloudy-900 transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center gap-3 max-w-4xl mx-auto px-3 py-2">
              <div
                role="button"
                tabIndex={0}
                onClick={onExpand}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onExpand()
                  }
                }}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-weather-cloudy-300"
                aria-label="Open now playing"
              >
                {currentTrack.albumArt ? (
                  <img
                    src={currentTrack.albumArt}
                    alt=""
                    className="w-12 h-12 rounded-md object-cover flex-none"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-md bg-weather-cloudy-100 flex-none" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-weather-cloudy-900 truncate text-sm">
                    {currentTrack.title}
                  </p>
                  <p className="text-xs text-weather-cloudy-700 truncate">{currentTrack.artist}</p>
                </div>
              </div>

              <VolumeControl />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlayPause()
                }}
                disabled={!player.isReady}
                aria-label={player.isPlaying ? 'Pause' : 'Play'}
                className="w-11 h-11 rounded-full bg-weather-cloudy-900 text-white flex items-center justify-center disabled:opacity-40 hover:scale-[1.03] active:scale-[0.98] transition-transform flex-none"
              >
                {player.isPlaying ? (
                  <Pause className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Play className="w-5 h-5" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  nextTrack()
                }}
                disabled={isLast}
                aria-label="Next track"
                className="w-11 h-11 rounded-full bg-weather-cloudy-100 text-weather-cloudy-900 flex items-center justify-center disabled:opacity-40 hover:bg-weather-cloudy-200 transition-colors flex-none"
              >
                <SkipForward className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
