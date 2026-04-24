import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Info, RefreshCw } from 'lucide-react'
import type { Track } from '../../types'
import { TrackCard } from './TrackCard'

export interface TrackListProps {
  tracks: Track[]
  currentIndex: number | null
  isPlaying: boolean
  isLoading: boolean
  error: string | null
  warnings: string[]
  quotaExceeded: boolean
  fromCache?: boolean
  onPlay: (index: number) => void
  onRetry?: () => void
}

export function TrackList({
  tracks,
  currentIndex,
  isPlaying,
  isLoading,
  error,
  warnings,
  quotaExceeded,
  onPlay,
  onRetry,
}: TrackListProps) {
  const hasTracks = tracks.length > 0

  if (!hasTracks && isLoading) {
    return <Skeleton />
  }

  if (!hasTracks && error) {
    return <ErrorBlock message={error} onRetry={onRetry} />
  }

  if (!hasTracks) {
    return <EmptyBlock />
  }

  return (
    <div className="space-y-3">
      {quotaExceeded ? <QuotaBanner /> : null}
      {warnings.length > 0 && !quotaExceeded ? <WarningBanner warnings={warnings} /> : null}

      <ul className="flex flex-col gap-1.5" aria-label="Recommendations">
        <AnimatePresence initial={false}>
          {tracks.map((track, i) => (
            <motion.div
              key={`${track.id}-${i}`}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <TrackCard
                track={track}
                index={i}
                isActive={i === currentIndex}
                isPlaying={i === currentIndex && isPlaying}
                onPlay={() => onPlay(i)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading ? <StreamingPlaceholder /> : null}
      </ul>

      <p className="pt-4 text-center text-xs text-weather-cloudy-700">
        Music discovered via Last.fm · Played via YouTube
      </p>
    </div>
  )
}

function Skeleton() {
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Loading recommendations" aria-busy="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-transparent"
        >
          <span className="w-6 h-4 rounded bg-weather-cloudy-200/70 animate-pulse" />
          <span className="w-12 h-12 rounded bg-weather-cloudy-200/70 animate-pulse" />
          <span className="flex-1 space-y-2">
            <span className="block h-4 w-2/3 rounded bg-weather-cloudy-200/70 animate-pulse" />
            <span className="block h-3 w-1/3 rounded bg-weather-cloudy-200/70 animate-pulse" />
          </span>
          <span className="hidden sm:inline w-10 h-3 rounded bg-weather-cloudy-200/70 animate-pulse" />
        </li>
      ))}
    </ul>
  )
}

function StreamingPlaceholder() {
  return (
    <li className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl bg-white/30 animate-pulse">
      <span className="w-6 h-4 rounded bg-weather-cloudy-200/70" />
      <span className="w-12 h-12 rounded bg-weather-cloudy-200/70" />
      <span className="flex-1 space-y-2">
        <span className="block h-4 w-2/3 rounded bg-weather-cloudy-200/70" />
        <span className="block h-3 w-1/3 rounded bg-weather-cloudy-200/70" />
      </span>
    </li>
  )
}

function EmptyBlock() {
  return (
    <div className="py-12 max-w-md mx-auto text-center">
      <p className="text-weather-cloudy-900 font-medium">No tracks found for this mood.</p>
      <p className="text-sm text-weather-cloudy-700 mt-2">
        Try a different weather condition or re-scan your environment.
      </p>
    </div>
  )
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-10 max-w-md mx-auto text-center flex flex-col items-center">
      <AlertCircle className="w-8 h-8 text-weather-stormy-700 mb-3" aria-hidden="true" />
      <p className="text-weather-cloudy-900 font-medium">Could not load music.</p>
      <p className="text-sm text-weather-cloudy-700 mt-2">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-weather-cloudy-900 text-white text-sm font-medium hover:scale-[1.02] transition-transform"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Retry
        </button>
      ) : null}
    </div>
  )
}

function QuotaBanner() {
  return (
    <div className="rounded-2xl p-4 bg-weather-sunny-50/80 border border-weather-sunny-100 text-sm text-weather-cloudy-900 flex gap-3">
      <Info className="w-5 h-5 flex-none text-weather-sunny-700 mt-0.5" aria-hidden="true" />
      <div>
        <p className="font-medium">Showing saved recommendations.</p>
        <p className="text-weather-cloudy-700 mt-0.5">Fresh results available tomorrow.</p>
      </div>
    </div>
  )
}

function WarningBanner({ warnings }: { warnings: string[] }) {
  return (
    <div className="rounded-2xl p-4 bg-weather-sunny-50/60 border border-weather-sunny-100 text-sm text-weather-cloudy-900 flex gap-3">
      <Info className="w-5 h-5 flex-none text-weather-sunny-700 mt-0.5" aria-hidden="true" />
      <ul className="list-disc pl-5 space-y-0.5">
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  )
}
