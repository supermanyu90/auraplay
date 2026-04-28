import { useEffect, useRef, useState } from 'react'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import {
  setVolume as setPlayerVolume,
  toggleMute as togglePlayerMute,
  useYouTubePlayer,
} from '../../hooks/useYouTubePlayer'

export interface VolumeControlProps {
  layout?: 'compact' | 'inline'
}

export function VolumeControl({ layout = 'compact' }: VolumeControlProps) {
  const volume = useYouTubePlayer().volume
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2
  const muteLabel = volume === 0 ? 'Unmute' : 'Mute'

  if (layout === 'inline') {
    return (
      <div className="flex items-center gap-3 w-full">
        <button
          type="button"
          onClick={togglePlayerMute}
          aria-label={muteLabel}
          className="p-1.5 rounded-full text-weather-cloudy-700 hover:text-weather-cloudy-900 hover:bg-weather-cloudy-100 transition-colors flex-none"
        >
          <VolumeIcon className="w-4 h-4" aria-hidden="true" />
        </button>
        <Slider value={volume} />
        <span className="w-8 text-right text-xs text-weather-cloudy-700 tabular-nums">
          {volume}
        </span>
      </div>
    )
  }

  return <CompactVolume volume={volume} VolumeIcon={VolumeIcon} muteLabel={muteLabel} />
}

function CompactVolume({
  volume,
  VolumeIcon,
  muteLabel,
}: {
  volume: number
  VolumeIcon: typeof Volume2
  muteLabel: string
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          togglePlayerMute()
        }}
        aria-label="Volume"
        aria-expanded={open}
        title={`${muteLabel} · double-click to ${volume === 0 ? 'unmute' : 'mute'}`}
        className="w-11 h-11 rounded-full bg-weather-cloudy-100 text-weather-cloudy-900 flex items-center justify-center hover:bg-weather-cloudy-200 transition-colors flex-none"
      >
        <VolumeIcon className="w-5 h-5" aria-hidden="true" />
      </button>
      {open ? (
        <div
          className="absolute bottom-full right-0 mb-2 w-44 p-3 rounded-xl bg-white border border-weather-cloudy-100 shadow-lg z-40"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlayerMute}
              aria-label={muteLabel}
              className="p-1 rounded text-weather-cloudy-700 hover:text-weather-cloudy-900 flex-none"
            >
              <VolumeIcon className="w-4 h-4" aria-hidden="true" />
            </button>
            <Slider value={volume} />
            <span className="w-7 text-right text-[11px] text-weather-cloudy-700 tabular-nums">
              {volume}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Slider({ value }: { value: number }) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      onChange={(e) => setPlayerVolume(Number(e.target.value))}
      className="flex-1 accent-weather-cloudy-900 cursor-pointer"
      aria-label="Volume level"
    />
  )
}
