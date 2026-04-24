import { YOUTUBE_DAILY_SEARCH_LIMIT } from '../config/constants'

const QUOTA_KEY_PREFIX = 'auraplay:yt-quota:'

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function storageKey(): string {
  return `${QUOTA_KEY_PREFIX}${todayKey()}`
}

export function getQuotaUsed(): number {
  try {
    const raw = window.localStorage.getItem(storageKey())
    if (!raw) return 0
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

export function addQuotaUsage(units = 1): void {
  try {
    const current = getQuotaUsed()
    window.localStorage.setItem(storageKey(), String(current + units))
  } catch {
    // ignore
  }
}

export function getQuotaRemaining(): number {
  return Math.max(0, YOUTUBE_DAILY_SEARCH_LIMIT - getQuotaUsed())
}

export function isQuotaExceeded(): boolean {
  return getQuotaRemaining() <= 0
}
