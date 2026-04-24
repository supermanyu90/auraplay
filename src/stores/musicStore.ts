import { create } from 'zustand'
import { YOUTUBE_DAILY_SEARCH_LIMIT } from '../config/constants'
import { loadVideo, pause, play } from '../hooks/useYouTubePlayer'
import { getRecommendations } from '../services/musicService'
import { getQuotaUsed } from '../utils/quotaTracker'
import type { MoodProfile, Track, WeatherCondition } from '../types'

export type RepeatMode = 'off' | 'all' | 'one'

interface MusicState {
  tracks: Track[]
  currentTrackIndex: number | null
  isPlaying: boolean

  shuffle: boolean
  repeat: RepeatMode

  isLoading: boolean
  loadingMessage: string

  error: string | null
  warnings: string[]

  youtubeQuotaUsed: number
  youtubeQuotaLimit: number

  lastCondition: WeatherCondition | null
  lastFetchedAt: number | null

  fetchRecommendations: (mood: MoodProfile) => Promise<void>
  playTrack: (index: number) => void
  nextTrack: () => void
  previousTrack: () => void
  togglePlayPause: () => void
  setIsPlaying: (isPlaying: boolean) => void
  setShuffle: (value: boolean) => void
  cycleRepeat: () => void
  appendTrack: (track: Track) => void
  setTrackDuration: (videoId: string, duration: number) => void
  clearTracks: () => void
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Could not load music right now.'
}

function pickShuffledIndex(current: number, total: number): number {
  if (total <= 1) return 0
  let next = Math.floor(Math.random() * total)
  if (next === current) next = (next + 1) % total
  return next
}

export const useMusicStore = create<MusicState>((set, get) => ({
  tracks: [],
  currentTrackIndex: null,
  isPlaying: false,

  shuffle: false,
  repeat: 'off',

  isLoading: false,
  loadingMessage: '',

  error: null,
  warnings: [],

  youtubeQuotaUsed: getQuotaUsed(),
  youtubeQuotaLimit: YOUTUBE_DAILY_SEARCH_LIMIT,

  lastCondition: null,
  lastFetchedAt: null,

  async fetchRecommendations(mood) {
    const state = get()
    if (state.isLoading) return

    set({
      isLoading: true,
      loadingMessage: 'Reading the weather...',
      error: null,
      warnings: [],
      tracks: [],
      currentTrackIndex: null,
    })

    try {
      const result = await getRecommendations(mood, {
        onProgress: (msg) => set({ loadingMessage: msg }),
        onTrackFound: (track) => {
          set((s) => ({
            tracks: [...s.tracks, track],
            currentTrackIndex: s.currentTrackIndex == null ? 0 : s.currentTrackIndex,
          }))
        },
      })

      set((s) => ({
        tracks: result.tracks.length > 0 ? result.tracks : s.tracks,
        currentTrackIndex:
          (result.tracks.length > 0 ? result.tracks : s.tracks).length > 0 ? 0 : null,
        isLoading: false,
        loadingMessage: '',
        error: null,
        warnings: result.errors,
        youtubeQuotaUsed: result.quotaUsed,
        lastCondition: mood.condition,
        lastFetchedAt: Date.now(),
      }))
    } catch (err) {
      set({
        error: toMessage(err),
        isLoading: false,
        loadingMessage: '',
        youtubeQuotaUsed: getQuotaUsed(),
      })
    }
  },

  playTrack(index) {
    const { tracks } = get()
    if (index < 0 || index >= tracks.length) return
    const track = tracks[index]
    set({ currentTrackIndex: index, isPlaying: true })
    loadVideo(track.id)
    play()
  },

  nextTrack() {
    const { currentTrackIndex, tracks, shuffle, repeat } = get()
    if (currentTrackIndex == null || tracks.length === 0) return

    if (repeat === 'one') {
      set({ currentTrackIndex })
      return
    }

    if (shuffle) {
      set({ currentTrackIndex: pickShuffledIndex(currentTrackIndex, tracks.length) })
      return
    }

    if (currentTrackIndex + 1 < tracks.length) {
      set({ currentTrackIndex: currentTrackIndex + 1 })
    } else if (repeat === 'all') {
      set({ currentTrackIndex: 0 })
    } else {
      set({ isPlaying: false })
    }
  },

  previousTrack() {
    const { currentTrackIndex, tracks, shuffle } = get()
    if (currentTrackIndex == null || tracks.length === 0) return
    if (shuffle) {
      set({ currentTrackIndex: pickShuffledIndex(currentTrackIndex, tracks.length) })
      return
    }
    if (currentTrackIndex > 0) {
      set({ currentTrackIndex: currentTrackIndex - 1 })
    }
  },

  togglePlayPause() {
    const { isPlaying } = get()
    if (isPlaying) pause()
    else play()
  },

  setIsPlaying(isPlaying) {
    set({ isPlaying })
  },

  setShuffle(value) {
    set({ shuffle: value })
  },

  cycleRepeat() {
    set((state) => ({
      repeat: state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off',
    }))
  },

  appendTrack(track) {
    set((state) => ({
      tracks: [...state.tracks, track],
      currentTrackIndex: state.currentTrackIndex == null ? 0 : state.currentTrackIndex,
    }))
  },

  setTrackDuration(videoId, duration) {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === videoId ? { ...t, duration } : t)),
    }))
  },

  clearTracks() {
    set({
      tracks: [],
      currentTrackIndex: null,
      isPlaying: false,
      error: null,
      warnings: [],
      lastCondition: null,
      lastFetchedAt: null,
    })
  },
}))
