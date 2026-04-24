import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Pause, Play, SkipBack, SkipForward } from 'lucide-react'

export interface YouTubePlayerProps {
  videoId: string | null
  autoplay?: boolean
  onEnded?: () => void
  onNext?: () => void
  onPrevious?: () => void
  onPlayStateChange?: (isPlaying: boolean) => void
}

interface IFramePlayer {
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  loadVideoById(videoId: string): void
  cueVideoById(videoId: string): void
  destroy(): void
  getPlayerState(): number
}

interface PlayerStateChangeEvent {
  data: number
  target: IFramePlayer
}

interface IFrameAPI {
  Player: new (
    host: HTMLElement | string,
    opts: {
      width?: number
      height?: number
      videoId?: string
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: (e: { target: IFramePlayer }) => void
        onStateChange?: (e: PlayerStateChangeEvent) => void
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

let apiPromise: Promise<IFrameAPI> | null = null

function loadIframeAPI(): Promise<IFrameAPI> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<IFrameAPI>((resolve) => {
    const existing = document.querySelector('script[data-youtube-iframe-api]')
    if (!existing) {
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

const PLAYER_WIDTH = 280
const PLAYER_HEIGHT = 158

export function YouTubePlayer({
  videoId,
  autoplay = true,
  onEnded,
  onNext,
  onPrevious,
  onPlayStateChange,
}: YouTubePlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<IFramePlayer | null>(null)
  const onEndedRef = useRef(onEnded)
  const onPlayStateChangeRef = useRef(onPlayStateChange)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioOnly, setAudioOnly] = useState(false)

  onEndedRef.current = onEnded
  onPlayStateChangeRef.current = onPlayStateChange

  useEffect(() => {
    if (!hostRef.current) return
    let cancelled = false

    const mountEl = document.createElement('div')
    hostRef.current.appendChild(mountEl)

    loadIframeAPI().then((YT) => {
      if (cancelled) return
      playerRef.current = new YT.Player(mountEl, {
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        videoId: videoId ?? undefined,
        playerVars: {
          autoplay: autoplay && videoId ? 1 : 0,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (!cancelled) setIsReady(true)
          },
          onStateChange: (e) => {
            if (cancelled) return
            const playing = e.data === YT.PlayerState.PLAYING
            setIsPlaying(playing)
            onPlayStateChangeRef.current?.(playing)
            if (e.data === YT.PlayerState.ENDED) onEndedRef.current?.()
          },
        },
      })
    })

    return () => {
      cancelled = true
      try {
        playerRef.current?.destroy()
      } catch {
        // ignore
      }
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return
    if (videoId) {
      if (autoplay) player.loadVideoById(videoId)
      else player.cueVideoById(videoId)
    } else {
      try {
        player.stopVideo()
      } catch {
        // ignore
      }
    }
  }, [videoId, isReady, autoplay])

  const togglePlay = () => {
    const player = playerRef.current
    if (!player || !isReady || !videoId) return
    if (isPlaying) player.pauseVideo()
    else player.playVideo()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-xl overflow-hidden bg-black shadow-md transition-all duration-300"
        style={{
          width: audioOnly ? 0 : PLAYER_WIDTH,
          height: audioOnly ? 0 : PLAYER_HEIGHT,
          opacity: audioOnly ? 0 : 1,
        }}
        aria-hidden={audioOnly}
      >
        <div ref={hostRef} />
      </div>

      <div className="flex items-center justify-between gap-3 w-[280px]">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!onPrevious}
          aria-label="Previous track"
          className="p-2 rounded-full bg-white/70 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <SkipBack className="w-4 h-4 text-weather-cloudy-900" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={togglePlay}
          disabled={!isReady || !videoId}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="p-3 rounded-full bg-weather-cloudy-900 text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-[0.98] transition-transform"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Play className="w-5 h-5" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!onNext}
          aria-label="Next track"
          className="p-2 rounded-full bg-white/70 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <SkipForward className="w-4 h-4 text-weather-cloudy-900" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setAudioOnly((v) => !v)}
          aria-label={audioOnly ? 'Show video' : 'Hide video (audio only)'}
          className="p-2 rounded-full bg-white/70 hover:bg-white text-weather-cloudy-900 transition-colors"
        >
          {audioOnly ? (
            <Eye className="w-4 h-4" aria-hidden="true" />
          ) : (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}
