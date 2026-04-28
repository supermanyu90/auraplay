import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Link2, Share2 } from 'lucide-react'
import type { MoodProfile, Track } from '../../types'

const APP_URL = 'https://auraplay-qi8d.vercel.app'

export interface ShareControlProps {
  track: Track
  mood?: MoodProfile | null
}

function buildShareText(track: Track, mood?: MoodProfile | null): string {
  const moodPart = mood ? ` · ${mood.icon} ${mood.label}` : ''
  return `🎵 Now playing "${track.title}" by ${track.artist}${moodPart} — discovered with AuraPlay (weather-based music)`
}

export function ShareControl({ track, mood }: ShareControlProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const text = buildShareText(track, mood ?? null)
  const url = APP_URL
  const fullText = `${text} ${url}`

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleNative = async () => {
    if (!canNativeShare) return
    try {
      await navigator.share({ title: track.title, text, url })
      setOpen(false)
    } catch {
      // user cancelled or denied — leave the popover open so they can pick another option
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const t = encodeURIComponent(text)
  const u = encodeURIComponent(url)
  const tu = encodeURIComponent(fullText)

  const links: Array<{ name: string; href: string }> = [
    { name: 'X (Twitter)', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { name: 'WhatsApp', href: `https://wa.me/?text=${tu}` },
    { name: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}` },
    { name: 'Reddit', href: `https://www.reddit.com/submit?url=${u}&title=${t}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ]

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Share this track"
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-weather-cloudy-100 text-weather-cloudy-900 text-sm font-medium hover:bg-weather-cloudy-200 transition-colors"
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
        Share
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full mb-2 right-0 w-60 p-2 rounded-2xl bg-white border border-weather-cloudy-100 shadow-xl z-40"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[11px] uppercase tracking-wider text-weather-cloudy-700 px-2 pt-1 pb-2">
            Share with
          </p>
          <ul className="space-y-0.5">
            {canNativeShare ? (
              <li>
                <button
                  type="button"
                  onClick={handleNative}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-weather-cloudy-100 text-sm font-medium flex items-center gap-2"
                  role="menuitem"
                >
                  <Share2 className="w-4 h-4 text-weather-cloudy-700" aria-hidden="true" />
                  System share menu…
                </button>
              </li>
            ) : null}
            {links.map((l) => (
              <li key={l.name}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg hover:bg-weather-cloudy-100 text-sm font-medium text-weather-cloudy-900"
                  role="menuitem"
                >
                  {l.name}
                </a>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={handleCopy}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-weather-cloudy-100 text-sm font-medium flex items-center gap-2"
                role="menuitem"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-weather-windy-700" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4 text-weather-cloudy-700" aria-hidden="true" />
                )}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </li>
            <li>
              <a
                href={track.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg hover:bg-weather-cloudy-100 text-xs text-weather-cloudy-700 flex items-center gap-2"
                role="menuitem"
              >
                <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                Source page on {track.service}
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
