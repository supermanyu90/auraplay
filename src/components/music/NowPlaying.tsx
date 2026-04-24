import { motion } from 'framer-motion'
import {
  ExternalLink,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
  Youtube,
} from 'lucide-react'
import type { MouseEvent } from 'react'
import {
  pause as pausePlayer,
  play as playPlayer,
  seekTo as seekToPlayer,
  setVolume as setPlayerVolume,
  useYouTubePlayer,
} from '../../hooks/useYouTubePlayer'
import { useMusicStore } from '../../stores/musicStore'

export interface NowPlayingProps {
  onClose: () => void
}

export function NowPlaying({ onClose }: NowPlayingProps) {
  const tracks = useMusicStore((s) => s.tracks)
  const currentTrackIndex = useMusicStore((s) => s.currentTrackIndex)
  const shuffle = useMusicStore((s) => s.shuffle)
  const repeat = useMusicStore((s) => s.repeat)
  const setShuffle = useMusicStore((s) => s.setShuffle)
  const cycleRepeat = useMusicStore((s) => s.cycleRepeat)
  const nextTrack = useMusicStore((s) => s.nextTrack)
  const previousTrack = useMusicStore((s) => s.previousTrack)

  const player = useYouTubePlayer()
  const currentTrack = currentTrackIndex != null ? tracks[currentTrackIndex] : null
  if (!currentTrack) return null

  const isFirst = currentTrackIndex === 0
  const isLast = currentTrackIndex != null && currentTrackIndex + 1 >= tracks.length
  const progress =
    player.duration > 0 ? Math.min(100, (player.currentTime / player.duration) * 100) : 0
  const remaining = Math.max(0, player.duration - player.currentTime)

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (player.duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seekToPlayer(ratio * player.duration)
  }

  return (
    <motion.div
      key="now-playing-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md overflow-y-auto flex items-stretch md:items-center md:justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.article
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 240 }}
        className="w-full md:max-w-md md:rounded-3xl bg-white/95 backdrop-blur border border-weather-cloudy-100 shadow-2xl p-6 md:p-8 min-h-full md:min-h-0"
        aria-label="Now playing"
      >
        <header className="flex items-center justify-between mb-6">
          <p className="text-xs uppercase tracking-widest text-weather-cloudy-700">Now playing</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-weather-cloudy-100 text-weather-cloudy-900 flex items-center justify-center hover:bg-weather-cloudy-200 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>

        <motion.div
          className="w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden shadow-xl bg-weather-cloudy-100 mb-6"
          animate={player.isPlaying ? { scale: [1, 1.015, 1] } : { scale: 1 }}
          transition={
            player.isPlaying
              ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
        >
          {currentTrack.albumArt ? (
            <img
              src={currentTrack.albumArt}
              alt=""
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : null}
        </motion.div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-weather-cloudy-900 truncate">
            {currentTrack.title}
          </h2>
          <p className="text-weather-cloudy-700 mt-1 truncate">{currentTrack.artist}</p>
          {currentTrack.album ? (
            <p className="text-sm text-weather-cloudy-700/70 mt-0.5 truncate">
              {currentTrack.album}
            </p>
          ) : null}
        </div>

        <div className="mb-5">
          <div
            role="progressbar"
            aria-label="Playback position"
            aria-valuenow={player.currentTime}
            aria-valuemin={0}
            aria-valuemax={player.duration || 0}
            onClick={handleSeek}
            className="h-2 rounded-full bg-weather-cloudy-100 overflow-hidden cursor-pointer"
          >
            <div
              className="h-full bg-weather-cloudy-900 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-weather-cloudy-700 tabular-nums">
            <span>{formatSec(player.currentTime)}</span>
            <span>-{formatSec(remaining)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 md:gap-5 mb-6">
          <IconToggle
            active={shuffle}
            label={shuffle ? 'Shuffle on' : 'Shuffle off'}
            onClick={() => setShuffle(!shuffle)}
          >
            <Shuffle className="w-5 h-5" aria-hidden="true" />
          </IconToggle>
          <IconButton label="Previous" onClick={previousTrack} disabled={isFirst}>
            <SkipBack className="w-6 h-6" aria-hidden="true" />
          </IconButton>
          <button
            type="button"
            onClick={() => (player.isPlaying ? pausePlayer() : playPlayer())}
            disabled={!player.isReady}
            aria-label={player.isPlaying ? 'Pause' : 'Play'}
            className="w-16 h-16 rounded-full bg-weather-cloudy-900 text-white shadow-lg flex items-center justify-center disabled:opacity-40 hover:scale-[1.04] active:scale-[0.97] transition-transform"
          >
            {player.isPlaying ? (
              <Pause className="w-7 h-7" aria-hidden="true" />
            ) : (
              <Play className="w-7 h-7" aria-hidden="true" />
            )}
          </button>
          <IconButton label="Next" onClick={nextTrack} disabled={isLast}>
            <SkipForward className="w-6 h-6" aria-hidden="true" />
          </IconButton>
          <IconToggle
            active={repeat !== 'off'}
            label={
              repeat === 'one'
                ? 'Repeat one'
                : repeat === 'all'
                  ? 'Repeat all'
                  : 'Repeat off'
            }
            onClick={cycleRepeat}
          >
            {repeat === 'one' ? (
              <Repeat1 className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Repeat className="w-5 h-5" aria-hidden="true" />
            )}
          </IconToggle>
        </div>

        <div className="hidden md:flex items-center gap-3 mb-6">
          <Volume2 className="w-4 h-4 text-weather-cloudy-700 flex-none" aria-hidden="true" />
          <input
            type="range"
            min={0}
            max={100}
            value={player.volume}
            onChange={(e) => setPlayerVolume(Number(e.target.value))}
            className="flex-1 accent-weather-cloudy-900"
            aria-label="Volume"
          />
          <span className="w-8 text-right text-xs text-weather-cloudy-700 tabular-nums">
            {player.volume}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <a
            href={currentTrack.youtubeMusicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF0000]/90 text-white text-sm font-medium hover:bg-[#FF0000] transition-colors"
          >
            <Youtube className="w-4 h-4" aria-hidden="true" />
            Open in YouTube Music
          </a>
          <a
            href={currentTrack.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-weather-cloudy-700 hover:text-weather-cloudy-900 underline underline-offset-2"
          >
            Open in YouTube
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
          <p className="text-[11px] text-weather-cloudy-700/70 mt-3">Discovered via Last.fm</p>
        </div>
      </motion.article>
    </motion.div>
  )
}

interface IconButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

function IconButton({ label, onClick, disabled, children }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-11 h-11 rounded-full flex items-center justify-center text-weather-cloudy-900 hover:bg-weather-cloudy-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
    >
      {children}
    </button>
  )
}

interface IconToggleProps extends IconButtonProps {
  active: boolean
}

function IconToggle({ active, label, onClick, children }: IconToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
        active
          ? 'bg-weather-rainy-100 text-weather-rainy-700'
          : 'text-weather-cloudy-700 hover:bg-weather-cloudy-100'
      }`}
    >
      {children}
    </button>
  )
}

function formatSec(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
