import { Play, Volume2 } from 'lucide-react'
import type { Track } from '../../types'
import { formatDuration } from '../../utils/youtubeCleanup'

export interface TrackCardProps {
  track: Track
  index: number
  isActive: boolean
  onPlay: () => void
}

export function TrackCard({ track, index, isActive, onPlay }: TrackCardProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onPlay}
        className={`group w-full text-left flex items-center gap-3 p-2.5 md:p-3 rounded-xl transition-colors border ${
          isActive
            ? 'bg-white/90 border-weather-cloudy-200 shadow-sm'
            : 'bg-white/50 hover:bg-white/80 border-transparent'
        }`}
        aria-current={isActive ? 'true' : undefined}
      >
        <span className="w-6 text-sm text-weather-cloudy-700 tabular-nums text-right">
          {index + 1}
        </span>
        {track.albumArt ? (
          <img
            src={track.albumArt}
            alt=""
            className="w-12 h-12 rounded object-cover flex-none"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded bg-weather-cloudy-100 flex-none" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-weather-cloudy-900 truncate">{track.title}</p>
          <p className="text-sm text-weather-cloudy-700 truncate">{track.artist}</p>
        </div>
        {track.duration > 0 ? (
          <span className="text-xs text-weather-cloudy-700 tabular-nums hidden sm:inline">
            {formatDuration(track.duration)}
          </span>
        ) : null}
        <span
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-none transition-colors ${
            isActive
              ? 'bg-weather-cloudy-900 text-white'
              : 'bg-weather-cloudy-100 text-weather-cloudy-900 group-hover:bg-weather-cloudy-900 group-hover:text-white'
          }`}
          aria-hidden="true"
        >
          {isActive ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </span>
      </button>
    </li>
  )
}
