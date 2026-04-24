interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs }
    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // storage unavailable or quota exceeded — ignore
  }
}

export function cacheGet<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (!entry || typeof entry.expiresAt !== 'number') return null
    if (entry.expiresAt < Date.now()) {
      window.localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function cacheGetStale<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    return entry?.data ?? null
  } catch {
    return null
  }
}

export function cacheClear(prefix?: string): void {
  try {
    if (!prefix) {
      window.localStorage.clear()
      return
    }
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith(prefix)) keys.push(key)
    }
    for (const key of keys) window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
