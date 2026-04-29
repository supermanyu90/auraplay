import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Header from './Header'
import MobileNav from './MobileNav'
import WeatherBackground from './WeatherBackground'
import { AuthGateModal } from '../auth/AuthGateModal'
import { MiniPlayer } from '../music/MiniPlayer'
import { NowPlaying } from '../music/NowPlaying'
import { PlayerHost } from '../music/PlayerHost'
import {
  loadTrack,
  setOnPlayerError,
  setOnTrackEnded,
  useYouTubePlayer,
} from '../../hooks/useYouTubePlayer'
import { useAuthStore } from '../../stores/authStore'
import { useMusicStore } from '../../stores/musicStore'
import { addPlayed } from '../../utils/playedHistory'

export default function Layout() {
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false)
  const userMinimizedRef = useRef(false)

  const tracks = useMusicStore((s) => s.tracks)
  const currentTrackIndex = useMusicStore((s) => s.currentTrackIndex)
  const nextTrack = useMusicStore((s) => s.nextTrack)
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying)
  const authGateOpen = useMusicStore((s) => s.authGateOpen)
  const tryResumePending = useMusicStore((s) => s.tryResumePending)
  const user = useAuthStore((s) => s.user)

  const { isReady, videoId, isPlaying: playerIsPlaying } = useYouTubePlayer()

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
      loadTrack(track)
    }
  }, [currentTrackIndex, tracks, isReady, videoId])

  useEffect(() => {
    setIsPlaying(playerIsPlaying)
  }, [playerIsPlaying, setIsPlaying])

  // Record played tracks once playback actually starts so future
  // recommendations can avoid them.
  useEffect(() => {
    if (!playerIsPlaying || currentTrackIndex == null) return
    const track = tracks[currentTrackIndex]
    if (track) addPlayed(track)
  }, [playerIsPlaying, currentTrackIndex, tracks])

  // Once the user signs in, resume whatever play action triggered the
  // auth gate.
  useEffect(() => {
    if (user && authGateOpen) tryResumePending()
  }, [user, authGateOpen, tryResumePending])

  // Auto-expand NowPlaying when a track first becomes current. The user's
  // explicit minimize is remembered for the rest of the session (until tracks
  // are cleared, e.g. by picking a new mood) so auto-advance doesn't pop the
  // modal back open.
  useEffect(() => {
    if (currentTrackIndex == null) {
      userMinimizedRef.current = false
      setNowPlayingOpen(false)
      return
    }
    if (!userMinimizedRef.current) setNowPlayingOpen(true)
  }, [currentTrackIndex])

  const handleMinimize = () => {
    userMinimizedRef.current = true
    setNowPlayingOpen(false)
  }
  const handleExpand = () => {
    userMinimizedRef.current = false
    setNowPlayingOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <WeatherBackground />
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 pb-32 md:pb-24 relative">
        <Outlet />
      </main>
      <MobileNav />
      <MiniPlayer onExpand={handleExpand} />
      <AnimatePresence>
        {nowPlayingOpen ? <NowPlaying onClose={handleMinimize} /> : null}
      </AnimatePresence>
      <AnimatePresence>{authGateOpen ? <AuthGateModal /> : null}</AnimatePresence>
      <PlayerHost />
    </div>
  )
}
