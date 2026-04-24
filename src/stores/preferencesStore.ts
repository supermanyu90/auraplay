import { create } from 'zustand'
import type { UserPreferences } from '../types'

const PREFS_KEY = 'auraplay:preferences'

const DEFAULTS: UserPreferences = {
  temperatureUnit: 'C',
  theme: 'auto',
}

function load(): UserPreferences {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<UserPreferences>
    return { ...DEFAULTS, ...parsed }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(prefs: UserPreferences): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

interface PreferencesStore extends UserPreferences {
  setTemperatureUnit: (unit: 'C' | 'F') => void
  setTheme: (theme: 'auto' | 'light' | 'dark') => void
  setManualLocation: (location: string | undefined) => void
  reset: () => void
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  ...load(),

  setTemperatureUnit(unit) {
    set({ temperatureUnit: unit })
    save(get())
  },
  setTheme(theme) {
    set({ theme })
    save(get())
  },
  setManualLocation(location) {
    set({ manualLocation: location })
    save(get())
  },
  reset() {
    const defaults = { ...DEFAULTS }
    set(defaults)
    save(defaults)
  },
}))
