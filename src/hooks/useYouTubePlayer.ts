import { create } from 'zustand'
import type { Track } from '../types'

export interface PlayerState {
  isReady: boolean
  isPlaying: boolean
  isBuffering: boolean
  currentTime: number
  duration: number
  volume: number
  error: string | null
  hasUserInteracted: boolean
  videoId: string | null
}

interface PlayerStore extends PlayerState {
  _setState: (partial: Partial<PlayerState>) => void
}

const usePlayerStore = create<PlayerStore>((set) => ({
  isReady: false,
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  volume: 100,
  error: null,
  hasUserInteracted: false,
  videoId: null,
  _setState: (partial) => set(partial),
}))

interface IFramePlayer {
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  loadVideoById(videoId: string): void
  cueVideoById(videoId: string): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  setVolume(level: number): void
  getVolume(): number
  getCurrentTime(): number
  getDuration(): number
  destroy(): void
  getPlayerState(): number
}

interface IFrameAPI {
  Player: new (
    host: HTMLElement | string,
    opts: {
      width?: string | number
      height?: string | number
      videoId?: string
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: (e: { target: IFramePlayer }) => void
        onStateChange?: (e: { data: number; target: IFramePlayer }) => void
        onError?: (e: { data: number; target: IFramePlayer }) => void
      }
    },
  ) => IFramePlayer
  PlayerState: {
    UNSTARTED: -1
    ENDED: 0
    PLAYING: 1
    PAUSED: 2
    BUFFERING: 3
    CUED: 5
  }
}

declare global {
  interface Window {
    YT?: IFrameAPI
    onYouTubeIframeAPIReady?: () => void
  }
}

type Backend = 'youtube' | 'audio'

let ytPlayer: IFramePlayer | null = null
let audioElement: HTMLAudioElement | null = null
let activeBackend: Backend | null = null
let pollInterval: number | null = null
let apiPromise: Promise<IFrameAPI> | null = null
let onTrackEndedHandler: (() => void) | null = null
let onPlayerErrorHandler: ((code: number) => void) | null = null
let ytReady = false

const SKIPPABLE_ERROR_CODES = new Set([2, 5, 100, 101, 150])

function loadIframeAPI(): Promise<IFrameAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise<IFrameAPI>((resolve) => {
    if (!document.querySelector('script[data-youtube-iframe-api]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.setAttribute('data-youtube-iframe-api', 'true')
      document.head.appendChild(script)
    }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      if (window.YT) resolve(window.YT)
    }
  })
  return apiPromise
}

function startPolling() {
  stopPolling()
  pollInterval = window.setInterval(() => {
    if (activeBackend === 'youtube' && ytPlayer) {
      try {
        const currentTime = ytPlayer.getCurrentTime()
        const duration = ytPlayer.getDuration()
        usePlayerStore.getState()._setState({ currentTime, duration })
      } catch {
        // ignore
      }
    } else if (activeBackend === 'audio' && audioElement) {
      const currentTime = audioElement.currentTime
      const duration = Number.isFinite(audioElement.duration) ? audioElement.duration : 0
      usePlayerStore.getState()._setState({ currentTime, duration })
    }
  }, 500)
}

function stopPolling() {
  if (pollInterval != null) {
    window.clearInterval(pollInterval)
    pollInterval = null
  }
}

function markReadyIfPossible() {
  if (ytReady && audioElement) {
    usePlayerStore.getState()._setState({ isReady: true })
  }
}

function attachAudioListeners(el: HTMLAudioElement) {
  el.addEventListener('playing', () => {
    if (activeBackend !== 'audio') return
    usePlayerStore.getState()._setState({ isPlaying: true, isBuffering: false, error: null })
    startPolling()
  })
  el.addEventListener('pause', () => {
    if (activeBackend !== 'audio') return
    usePlayerStore.getState()._setState({ isPlaying: false })
    stopPolling()
  })
  el.addEventListener('waiting', () => {
    if (activeBackend !== 'audio') return
    usePlayerStore.getState()._setState({ isBuffering: true })
  })
  el.addEventListener('loadedmetadata', () => {
    if (activeBackend !== 'audio') return
    const duration = Number.isFinite(el.duration) ? el.duration : 0
    usePlayerStore.getState()._setState({ duration })
  })
  el.addEventListener('ended', () => {
    if (activeBackend !== 'audio') return
    usePlayerStore.getState()._setState({ isPlaying: false, currentTime: 0 })
    stopPolling()
    onTrackEndedHandler?.()
  })
  el.addEventListener('error', () => {
    if (activeBackend !== 'audio') return
    const code = el.error?.code ?? 0
    usePlayerStore
      .getState()
      ._setState({ error: describeAudioError(code), isPlaying: false, isBuffering: false })
    stopPolling()
    onPlayerErrorHandler?.(code)
    onTrackEndedHandler?.()
  })
}

export async function initializePlayer(
  ytHostEl: HTMLElement,
  audioEl: HTMLAudioElement,
): Promise<void> {
  if (audioElement !== audioEl) {
    audioElement = audioEl
    attachAudioListeners(audioEl)
  }
  markReadyIfPossible()

  if (ytPlayer) return
  const YT = await loadIframeAPI()

  ytPlayer = new YT.Player(ytHostEl, {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      playsinline: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: (e) => {
        const volume = (() => {
          try {
            return e.target.getVolume()
          } catch {
            return 100
          }
        })()
        usePlayerStore.getState()._setState({ volume })
        ytReady = true
        markReadyIfPossible()
      },
      onStateChange: (e) => {
        if (activeBackend !== 'youtube') return
        const setState = usePlayerStore.getState()._setState
        switch (e.data) {
          case YT.PlayerState.PLAYING:
            setState({ isPlaying: true, isBuffering: false, error: null })
            startPolling()
            break
          case YT.PlayerState.PAUSED:
            setState({ isPlaying: false })
            stopPolling()
            break
          case YT.PlayerState.BUFFERING:
            setState({ isBuffering: true })
            break
          case YT.PlayerState.ENDED:
            setState({ isPlaying: false, currentTime: 0 })
            stopPolling()
            onTrackEndedHandler?.()
            break
        }
      },
      onError: (e) => {
        if (activeBackend !== 'youtube') return
        const code = e.data
        const setState = usePlayerStore.getState()._setState
        setState({ error: describeYouTubeError(code), isPlaying: false, isBuffering: false })
        stopPolling()
        onPlayerErrorHandler?.(code)
        if (SKIPPABLE_ERROR_CODES.has(code)) onTrackEndedHandler?.()
      },
    },
  })
}

function describeYouTubeError(code: number): string {
  switch (code) {
    case 2:
      return 'Invalid video ID — skipping.'
    case 5:
      return 'HTML5 player error — skipping.'
    case 100:
      return 'Video is removed or private — skipping.'
    case 101:
    case 150:
      return 'Embedding disabled for this video — skipping.'
    default:
      return `YouTube player error ${code}.`
  }
}

function describeAudioError(code: number): string {
  switch (code) {
    case 1:
      return 'Audio playback aborted — skipping.'
    case 2:
      return 'Network error fetching audio — skipping.'
    case 3:
      return 'Audio decoding error — skipping.'
    case 4:
      return 'Audio source not supported — skipping.'
    default:
      return 'Audio playback error — skipping.'
  }
}

export function setOnTrackEnded(handler: (() => void) | null): void {
  onTrackEndedHandler = handler
}

export function setOnPlayerError(handler: ((code: number) => void) | null): void {
  onPlayerErrorHandler = handler
}

function stopOtherBackend(target: Backend) {
  if (target !== 'youtube' && ytPlayer) {
    try {
      ytPlayer.stopVideo()
    } catch {
      // ignore
    }
  }
  if (target !== 'audio' && audioElement) {
    audioElement.pause()
  }
}

export function loadTrack(track: Track | null): void {
  if (!track) {
    stopOtherBackend('youtube')
    stopOtherBackend('audio')
    activeBackend = null
    usePlayerStore
      .getState()
      ._setState({ videoId: null, isPlaying: false, currentTime: 0, duration: 0 })
    stopPolling()
    return
  }

  const { hasUserInteracted } = usePlayerStore.getState()
  usePlayerStore
    .getState()
    ._setState({ videoId: track.id, error: null, currentTime: 0, duration: 0 })

  if (track.service === 'youtube') {
    stopOtherBackend('youtube')
    activeBackend = 'youtube'
    if (!ytPlayer) return
    try {
      const ytId = track.id.startsWith('youtube:') ? track.id.slice('youtube:'.length) : track.id
      if (hasUserInteracted) ytPlayer.loadVideoById(ytId)
      else ytPlayer.cueVideoById(ytId)
    } catch (err) {
      console.warn('YouTube: loadTrack failed:', err)
    }
    return
  }

  if (!track.streamUrl || !audioElement) {
    usePlayerStore.getState()._setState({ error: 'No playable stream for this track.' })
    onTrackEndedHandler?.()
    return
  }
  stopOtherBackend('audio')
  activeBackend = 'audio'
  audioElement.src = track.streamUrl
  audioElement.load()
  if (hasUserInteracted) {
    audioElement.play().catch((err) => {
      console.warn('Audio: play failed:', err)
    })
  }
}

export function play(): void {
  usePlayerStore.getState()._setState({ hasUserInteracted: true, error: null })
  if (activeBackend === 'youtube') {
    try {
      ytPlayer?.playVideo()
    } catch (err) {
      console.warn('YouTube: play failed:', err)
    }
  } else if (activeBackend === 'audio' && audioElement) {
    audioElement.play().catch((err) => {
      console.warn('Audio: play failed:', err)
    })
  }
}

export function pause(): void {
  if (activeBackend === 'youtube') {
    try {
      ytPlayer?.pauseVideo()
    } catch (err) {
      console.warn('YouTube: pause failed:', err)
    }
  } else if (activeBackend === 'audio' && audioElement) {
    audioElement.pause()
  }
}

export function seekTo(seconds: number): void {
  const safe = Math.max(0, seconds)
  if (activeBackend === 'youtube') {
    try {
      ytPlayer?.seekTo(safe, true)
    } catch (err) {
      console.warn('YouTube: seekTo failed:', err)
    }
  } else if (activeBackend === 'audio' && audioElement) {
    try {
      audioElement.currentTime = safe
    } catch (err) {
      console.warn('Audio: seekTo failed:', err)
    }
  }
  usePlayerStore.getState()._setState({ currentTime: safe })
}

export function setVolume(level: number): void {
  const clamped = Math.max(0, Math.min(100, Math.round(level)))
  usePlayerStore.getState()._setState({ volume: clamped })
  if (activeBackend === 'youtube') {
    try {
      ytPlayer?.setVolume(clamped)
    } catch (err) {
      console.warn('YouTube: setVolume failed:', err)
    }
  } else if (activeBackend === 'audio' && audioElement) {
    audioElement.volume = clamped / 100
  }
}

export function destroyPlayer(): void {
  stopPolling()
  try {
    ytPlayer?.destroy()
  } catch {
    // ignore
  }
  ytPlayer = null
  if (audioElement) {
    audioElement.pause()
    audioElement.removeAttribute('src')
  }
  activeBackend = null
  ytReady = false
  usePlayerStore.getState()._setState({
    isReady: false,
    isPlaying: false,
    isBuffering: false,
    currentTime: 0,
    duration: 0,
    videoId: null,
  })
}

export function useYouTubePlayer(): PlayerState & {
  loadTrack: (track: Track | null) => void
  play: () => void
  pause: () => void
  seekTo: (seconds: number) => void
  setVolume: (level: number) => void
} {
  const state = usePlayerStore()
  return {
    ...state,
    loadTrack,
    play,
    pause,
    seekTo,
    setVolume,
  }
}
