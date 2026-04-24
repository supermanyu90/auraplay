import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseEnabled } from '../services/supabase/client'

export type SignUpOutcome = 'signed-in' | 'email-confirmation-required' | 'failed'

interface AuthStore {
  user: User | null
  session: Session | null
  isReady: boolean
  isLoading: boolean
  error: string | null
  enabled: boolean

  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string) => Promise<SignUpOutcome>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

let authListenerRegistered = false
let initialized = false

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Authentication failed.'
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isReady: false,
  isLoading: false,
  error: null,
  enabled: supabaseEnabled,

  async init() {
    if (initialized) return
    initialized = true

    if (!supabase) {
      set({ isReady: true, enabled: false })
      return
    }

    try {
      const { data } = await supabase.auth.getSession()
      set({
        session: data.session,
        user: data.session?.user ?? null,
        isReady: true,
        enabled: true,
      })

      if (!authListenerRegistered) {
        authListenerRegistered = true
        supabase.auth.onAuthStateChange((_event, session) => {
          set({ session, user: session?.user ?? null })
        })
      }
    } catch (err) {
      set({ error: toMessage(err), isReady: true })
    }
  },

  async signIn(email, password) {
    if (!supabase) {
      set({ error: 'Accounts are not configured. Set Supabase env vars to enable.' })
      return false
    }
    set({ isLoading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ isLoading: false, error: error.message })
      return false
    }
    set({ isLoading: false, session: data.session, user: data.user })
    return true
  },

  async signUp(email, password) {
    if (!supabase) {
      set({ error: 'Accounts are not configured. Set Supabase env vars to enable.' })
      return 'failed'
    }
    set({ isLoading: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    })
    if (error) {
      set({ isLoading: false, error: error.message })
      return 'failed'
    }
    set({
      isLoading: false,
      session: data.session,
      user: data.user,
    })
    return data.session ? 'signed-in' : 'email-confirmation-required'
  },

  async signInWithGoogle() {
    if (!supabase) {
      set({ error: 'Accounts are not configured. Set Supabase env vars to enable.' })
      return
    }
    set({ isLoading: true, error: null })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth` },
    })
    if (error) {
      set({ isLoading: false, error: error.message })
    }
  },

  async signOut() {
    if (!supabase) return
    set({ isLoading: true })
    const { error } = await supabase.auth.signOut()
    if (error) {
      set({ isLoading: false, error: error.message })
      return
    }
    set({ isLoading: false, session: null, user: null })
  },

  clearError() {
    set({ error: null })
  },
}))
