import { create } from 'zustand'
import { getRecommendationsForMood } from '../services/lastfm/lastfmApi'
import { searchBatch } from '../services/youtube/youtubeMusicApi'
import type { MoodProfile, Track, WeatherCondition } from '../types'

interface MusicStore {
  tracks: Track[]
  currentIndex: number
  isLoading: boolean
  error: string | null
  loadedFor: WeatherCondition | null
  loadRecommendations: (mood: MoodProfile) => Promise<void>
  playTrack: (index: number) => void
  nextTrack: () => void
  previousTrack: () => void
  clear: () => void
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Could not load music right now.'
}

export const useMusicStore = create<MusicStore>((set, get) => ({
  tracks: [],
  currentIndex: 0,
  isLoading: false,
  error: null,
  loadedFor: null,

  async loadRecommendations(mood) {
    const { loadedFor, tracks, isLoading } = get()
    if (isLoading) return
    if (loadedFor === mood.condition && tracks.length > 0) return

    set({ isLoading: true, error: null, tracks: [], currentIndex: 0 })

    try {
      const lastfmTracks = await getRecommendationsForMood(mood, 30)
      if (lastfmTracks.length === 0) {
        set({
          isLoading: false,
          error: 'Last.fm returned no tracks for this mood. Try a different one.',
          loadedFor: mood.condition,
        })
        return
      }

      const youtubeTracks = await searchBatch(lastfmTracks, 20)
      if (youtubeTracks.length === 0) {
        set({
          isLoading: false,
          error: 'Could not find playable versions on YouTube.',
          loadedFor: mood.condition,
        })
        return
      }

      set({
        tracks: youtubeTracks,
        currentIndex: 0,
        isLoading: false,
        error: null,
        loadedFor: mood.condition,
      })
    } catch (err) {
      set({ error: toMessage(err), isLoading: false })
    }
  },

  playTrack(index) {
    const { tracks } = get()
    if (index >= 0 && index < tracks.length) {
      set({ currentIndex: index })
    }
  },

  nextTrack() {
    const { currentIndex, tracks } = get()
    if (currentIndex + 1 < tracks.length) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  previousTrack() {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  clear() {
    set({ tracks: [], currentIndex: 0, error: null, isLoading: false, loadedFor: null })
  },
}))
