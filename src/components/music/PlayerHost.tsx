import { useEffect, useRef } from 'react'
import { initializePlayer } from '../../hooks/useYouTubePlayer'

export function PlayerHost() {
  const ytHostRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const root = ytHostRef.current
    const audio = audioRef.current
    if (!root || !audio) return
    const mount = document.createElement('div')
    mount.style.width = '100%'
    mount.style.height = '100%'
    root.appendChild(mount)
    void initializePlayer(mount, audio)
  }, [])

  return (
    <>
      <div
        id="auraplay-yt-host"
        ref={ytHostRef}
        className="fixed bottom-0 left-0 pointer-events-none overflow-hidden"
        style={{ width: 1, height: 1, opacity: 0, zIndex: -1 }}
        aria-hidden="true"
      />
      <audio ref={audioRef} preload="auto" crossOrigin="anonymous" aria-hidden="true" />
    </>
  )
}
