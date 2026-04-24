import { useEffect, useRef } from 'react'
import { initializePlayer } from '../../hooks/useYouTubePlayer'

export function PlayerHost() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = hostRef.current
    if (!root) return
    const mount = document.createElement('div')
    mount.style.width = '100%'
    mount.style.height = '100%'
    root.appendChild(mount)
    void initializePlayer(mount)
  }, [])

  return (
    <div
      id="auraplay-yt-host"
      ref={hostRef}
      className="fixed bottom-0 left-0 pointer-events-none overflow-hidden"
      style={{ width: 1, height: 1, opacity: 0, zIndex: -1 }}
      aria-hidden="true"
    />
  )
}
