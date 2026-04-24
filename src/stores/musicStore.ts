import { create } from 'zustand'
import { YOUTUBE_DAILY_SEARCH_LIMIT } from '../config/constants'
import { getRecommendations } from '../services/musicService'
import { getQuotaUsed } from '../utils/quotaTracker'
import type { MoodProfile, Track, WeatherCondition } from '../types'

interface MusicState {
  tracks: Track[]
  currentTrackIndex: number | null
  isPlaying: boolean

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
  clearTracks: () => void
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Could not load music right now.'
}

export const useMusicStore = create<MusicState>((set, get) => ({
  tracks: [],
  currentTrackIndex: null,
  isPlaying: false,

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
    })

    try {
      const result = await getRecommendations(mood, {
        onProgress: (msg) => set({ loadingMessage: msg }),
      })

      set({
        tracks: result.tracks,
        currentTrackIndex: result.tracks.length > 0 ? 0 : null,
        isLoading: false,
        loadingMessage: '',
        error: null,
        warnings: result.errors,
        youtubeQuotaUsed: result.quotaUsed,
        lastCondition: mood.condition,
        lastFetchedAt: Date.now(),
      })
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
    if (index >= 0 && index < tracks.length) {
      set({ currentTrackIndex: index, isPlaying: true })
    }
  },

  nextTrack() {
    const { currentTrackIndex, tracks } = get()
    if (currentTrackIndex != null && currentTrackIndex + 1 < tracks.length) {
      set({ currentTrackIndex: currentTrackIndex + 1 })
    }
  },

  previousTrack() {
    const { currentTrackIndex } = get()
    if (currentTrackIndex != null && currentTrackIndex > 0) {
      set({ currentTrackIndex: currentTrackIndex - 1 })
    }
  },

  togglePlayPause() {
    set((state) => ({ isPlaying: !state.isPlaying }))
  },

  setIsPlaying(isPlaying) {
    set({ isPlaying })
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
