import { create } from 'zustand'

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

let playerInstance: IFramePlayer | null = null
let pollInterval: number | null = null
let apiPromise: Promise<IFrameAPI> | null = null
let onTrackEndedHandler: (() => void) | null = null
let onPlayerErrorHandler: ((code: number) => void) | null = null

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
    const player = playerInstance
    if (!player) return
    try {
      const currentTime = player.getCurrentTime()
      const duration = player.getDuration()
      usePlayerStore.getState()._setState({ currentTime, duration })
    } catch {
      // player may be transitioning — ignore
    }
  }, 500)
}

function stopPolling() {
  if (pollInterval != null) {
    window.clearInterval(pollInterval)
    pollInterval = null
  }
}

export async function initializePlayer(hostEl: HTMLElement): Promise<void> {
  if (playerInstance) return
  const YT = await loadIframeAPI()

  playerInstance = new YT.Player(hostEl, {
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
        usePlayerStore.getState()._setState({ isReady: true, volume })
      },
      onStateChange: (e) => {
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
        const code = e.data
        const setState = usePlayerStore.getState()._setState
        setState({ error: describeYouTubeError(code), isPlaying: false, isBuffering: false })
        stopPolling()
        onPlayerErrorHandler?.(code)
        if (SKIPPABLE_ERROR_CODES.has(code)) {
          onTrackEndedHandler?.()
        }
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

export function setOnTrackEnded(handler: (() => void) | null): void {
  onTrackEndedHandler = handler
}

export function setOnPlayerError(handler: ((code: number) => void) | null): void {
  onPlayerErrorHandler = handler
}

export function loadVideo(videoId: string): void {
  if (!playerInstance) {
    usePlayerStore.getState()._setState({ videoId })
    return
  }
  const { hasUserInteracted } = usePlayerStore.getState()
  usePlayerStore.getState()._setState({ videoId, error: null, currentTime: 0, duration: 0 })
  try {
    if (hasUserInteracted) {
      playerInstance.loadVideoById(videoId)
    } else {
      playerInstance.cueVideoById(videoId)
    }
  } catch (err) {
    console.warn('YouTube: loadVideo failed:', err)
  }
}

export function play(): void {
  usePlayerStore.getState()._setState({ hasUserInteracted: true, error: null })
  try {
    playerInstance?.playVideo()
  } catch (err) {
    console.warn('YouTube: play failed:', err)
  }
}

export function pause(): void {
  try {
    playerInstance?.pauseVideo()
  } catch (err) {
    console.warn('YouTube: pause failed:', err)
  }
}

export function seekTo(seconds: number): void {
  try {
    playerInstance?.seekTo(Math.max(0, seconds), true)
    usePlayerStore.getState()._setState({ currentTime: seconds })
  } catch (err) {
    console.warn('YouTube: seekTo failed:', err)
  }
}

export function setVolume(level: number): void {
  const clamped = Math.max(0, Math.min(100, Math.round(level)))
  usePlayerStore.getState()._setState({ volume: clamped })
  try {
    playerInstance?.setVolume(clamped)
  } catch (err) {
    console.warn('YouTube: setVolume failed:', err)
  }
}

export function destroyPlayer(): void {
  stopPolling()
  try {
    playerInstance?.destroy()
  } catch {
    // ignore
  }
  playerInstance = null
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
  loadVideo: (videoId: string) => void
  play: () => void
  pause: () => void
  seekTo: (seconds: number) => void
  setVolume: (level: number) => void
} {
  const state = usePlayerStore()
  return {
    ...state,
    loadVideo,
    play,
    pause,
    seekTo,
    setVolume,
  }
}
