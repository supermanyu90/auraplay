import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../../config/constants'

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'auraplay-auth',
      },
    })
  : null
