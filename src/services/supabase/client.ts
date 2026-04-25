import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../../config/constants'

const url = SUPABASE_URL.trim()
const key = SUPABASE_ANON_KEY.trim()

function isValidHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export const supabaseEnabled = Boolean(url) && Boolean(key) && isValidHttpsUrl(url)

if ((url || key) && !supabaseEnabled) {
  console.warn(
    'Supabase env vars are present but invalid (check VITE_SUPABASE_URL is a full https URL with no whitespace).',
  )
}

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'auraplay-auth',
      },
    })
  : null
