import { Play, Youtube } from 'lucide-react'
import type { Track } from '../../types'
import { formatDuration } from '../../utils/youtubeCleanup'

export interface TrackCardProps {
  track: Track
  index: number
  isActive: boolean
  isPlaying: boolean
  onPlay: () => void
}

export function TrackCard({ track, index, isActive, isPlaying, onPlay }: TrackCardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onPlay}
        className={`group w-full text-left flex items-center gap-3 p-2.5 md:p-3 rounded-xl border transition-all duration-200 ${
          isActive
            ? 'bg-white/95 border-weather-cloudy-200 shadow-sm'
            : 'bg-white/50 hover:bg-white/80 hover:translate-x-1 border-transparent'
        }`}
        aria-current={isActive ? 'true' : undefined}
      >
        <span className="w-6 text-center flex items-center justify-center flex-none">
          {isActive && isPlaying ? (
            <Equalizer />
          ) : (
            <span className="text-sm text-weather-cloudy-700 tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
          )}
        </span>

        <span className="relative flex-none">
          {track.albumArt ? (
            <img
              src={track.albumArt}
              alt=""
              className="w-12 h-12 rounded object-cover"
              loading="lazy"
            />
          ) : (
            <span className="block w-12 h-12 rounded bg-weather-cloudy-100" />
          )}
          <span className="absolute inset-0 rounded bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-5 h-5 text-white" aria-hidden="true" />
          </span>
          <span
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FF0000] flex items-center justify-center shadow"
            aria-hidden="true"
          >
            <Youtube className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
          </span>
        </span>

        <span className="flex-1 min-w-0">
          <span className="block font-medium text-weather-cloudy-900 truncate">{track.title}</span>
          <span className="block text-sm text-weather-cloudy-700 truncate">{track.artist}</span>
        </span>

        <span className="text-xs text-weather-cloudy-700 tabular-nums hidden sm:inline flex-none">
          {track.duration > 0 ? formatDuration(track.duration) : '—'}
        </span>
      </button>
    </li>
  )
}

function Equalizer() {
  return (
    <span className="flex items-end gap-[2px] h-4" aria-hidden="true">
      <span className="w-[3px] bg-weather-cloudy-900 rounded-sm equalizer-bar-1" />
      <span className="w-[3px] bg-weather-cloudy-900 rounded-sm equalizer-bar-2" />
      <span className="w-[3px] bg-weather-cloudy-900 rounded-sm equalizer-bar-3" />
    </span>
  )
}
