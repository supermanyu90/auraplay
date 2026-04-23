import type { Track } from '../../types'
import { TrackCard } from './TrackCard'

export interface TrackListProps {
  tracks: Track[]
  currentIndex: number
  onPlay: (index: number) => void
}

export function TrackList({ tracks, currentIndex, onPlay }: TrackListProps) {
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Recommendations">
      {tracks.map((track, i) => (
        <TrackCard
          key={`${track.id}-${i}`}
          track={track}
          index={i}
          isActive={i === currentIndex}
          onPlay={() => onPlay(i)}
        />
      ))}
    </ul>
  )
}
