import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Header from './Header'
import MobileNav from './MobileNav'
import WeatherBackground from './WeatherBackground'
import { MiniPlayer } from '../music/MiniPlayer'
import { NowPlaying } from '../music/NowPlaying'
import { PlayerHost } from '../music/PlayerHost'
import {
  loadVideo,
  play,
  setOnPlayerError,
  setOnTrackEnded,
  useYouTubePlayer,
} from '../../hooks/useYouTubePlayer'
import { useMusicStore } from '../../stores/musicStore'

export default function Layout() {
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false)

  const tracks = useMusicStore((s) => s.tracks)
  const currentTrackIndex = useMusicStore((s) => s.currentTrackIndex)
  const isPlayingIntent = useMusicStore((s) => s.isPlaying)
  const nextTrack = useMusicStore((s) => s.nextTrack)
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying)

  const { isReady, videoId, isPlaying: playerIsPlaying, hasUserInteracted } = useYouTubePlayer()

  useEffect(() => {
    setOnTrackEnded(nextTrack)
    setOnPlayerError(() => nextTrack())
    return () => {
      setOnTrackEnded(null)
      setOnPlayerError(null)
    }
  }, [nextTrack])

  useEffect(() => {
    const track = currentTrackIndex != null ? tracks[currentTrackIndex] : null
    if (!track || !isReady) return
    if (videoId !== track.id) {
      loadVideo(track.id)
    }
  }, [currentTrackIndex, tracks, isReady, videoId])

  useEffect(() => {
    if (!isReady) return
    if (isPlayingIntent && !playerIsPlaying && hasUserInteracted) {
      play()
    }
  }, [isPlayingIntent, playerIsPlaying, isReady, hasUserInteracted])

  useEffect(() => {
    setIsPlaying(playerIsPlaying)
  }, [playerIsPlaying, setIsPlaying])

  return (
    <div className="min-h-screen flex flex-col">
      <WeatherBackground />
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 pb-32 md:pb-24 relative">
        <Outlet />
      </main>
      <MobileNav />
      <MiniPlayer onExpand={() => setNowPlayingOpen(true)} />
      <AnimatePresence>
        {nowPlayingOpen ? <NowPlaying onClose={() => setNowPlayingOpen(false)} /> : null}
      </AnimatePresence>
      <PlayerHost />
    </div>
  )
}
