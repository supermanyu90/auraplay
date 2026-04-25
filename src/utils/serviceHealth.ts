import axios from 'axios'
import {
  AUDIUS_HOST_DISCOVERY_URL,
  JAMENDO_BASE_URL,
  JAMENDO_CLIENT_ID,
  LASTFM_API_KEY,
  LASTFM_BASE_URL,
  YOUTUBE_API_KEY,
  YOUTUBE_BASE_URL,
} from '../config/constants'

export type ServiceStatus = 'ok' | 'down' | 'not-configured' | 'checking'

export interface HealthResult {
  status: ServiceStatus
  message?: string
  responseTimeMs?: number
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const start = performance.now()
  const value = await fn()
  return { value, ms: Math.round(performance.now() - start) }
}

function downFromError(err: unknown, fallback = 'unreachable'): HealthResult {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 403) {
      return { status: 'down', message: 'Quota exhausted or key invalid' }
    }
    if (err.response?.status === 401) {
      return { status: 'down', message: 'Invalid API key' }
    }
    if (err.code === 'ECONNABORTED') {
      return { status: 'down', message: 'Timed out' }
    }
    if (err.response?.status) {
      return { status: 'down', message: `HTTP ${err.response.status}` }
    }
  }
  const msg = err instanceof Error ? err.message : fallback
  return { status: 'down', message: msg }
}

export async function checkLastfm(): Promise<HealthResult> {
  if (!LASTFM_API_KEY) return { status: 'not-configured' }
  try {
    const { ms } = await timed(() =>
      axios.get(LASTFM_BASE_URL, {
        params: {
          method: 'tag.getInfo',
          tag: 'rock',
          api_key: LASTFM_API_KEY,
          format: 'json',
        },
        timeout: 5000,
      }),
    )
    return { status: 'ok', responseTimeMs: ms }
  } catch (err) {
    return downFromError(err)
  }
}

export async function checkYouTube(): Promise<HealthResult> {
  if (!YOUTUBE_API_KEY) return { status: 'not-configured' }
  try {
    // videos.list with a known stable ID costs 1 quota unit (vs 100 for search.list).
    const { ms } = await timed(() =>
      axios.get(`${YOUTUBE_BASE_URL}/videos`, {
        params: {
          part: 'id',
          id: 'dQw4w9WgXcQ',
          key: YOUTUBE_API_KEY,
        },
        timeout: 5000,
      }),
    )
    return { status: 'ok', responseTimeMs: ms }
  } catch (err) {
    return downFromError(err)
  }
}

export async function checkJamendo(): Promise<HealthResult> {
  if (!JAMENDO_CLIENT_ID) return { status: 'not-configured' }
  try {
    const { ms } = await timed(() =>
      axios.get(`${JAMENDO_BASE_URL}/tracks/`, {
        params: {
          client_id: JAMENDO_CLIENT_ID,
          format: 'json',
          limit: 1,
        },
        timeout: 5000,
      }),
    )
    return { status: 'ok', responseTimeMs: ms }
  } catch (err) {
    return downFromError(err)
  }
}

export async function checkAudius(): Promise<HealthResult> {
  try {
    const { ms, value } = await timed(() =>
      axios.get<{ data?: string[] }>(AUDIUS_HOST_DISCOVERY_URL, { timeout: 5000 }),
    )
    const nodes = value.data?.data ?? []
    if (nodes.length === 0) {
      return { status: 'down', message: 'No discovery nodes returned' }
    }
    return { status: 'ok', responseTimeMs: ms, message: `${nodes.length} nodes` }
  } catch (err) {
    return downFromError(err)
  }
}
