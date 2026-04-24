# AuraPlay

Try it here: https://auraplay-qi8d.vercel.app/music

**100% free. No subscriptions. No premium accounts.**

Weather-based music discovery. AuraPlay reads the weather where you are, maps it to an audio mood, and builds a playlist from Last.fm recommendations played back through YouTube.

Unlike other music apps, AuraPlay requires zero paid subscriptions — not even Spotify Premium.

---

## How it works

```
Weather  →  Mood Mapper  →  genre tags
                               │
                               ▼
                        ┌──────────────┐
                        │   Last.fm    │  ← Finds the RIGHT songs
                        │ tag.getTop   │     (free, no auth)
                        │   Tracks     │
                        └──────┬───────┘
                               │
                       track names + artists
                               │
                               ▼
                        ┌──────────────┐
                        │   YouTube    │  ← PLAYS the songs
                        │   Data API   │     (free, full songs)
                        │   + IFrame   │
                        └──────────────┘
```

1. **Sense** — browser geolocation + OpenWeatherMap give us real-time conditions (temperature, humidity, pressure, wind, visibility, derived UV).
2. **Map** — a deterministic `moodMapper` converts weather into a `MoodProfile` (energy, valence, tempo range, genres, gradient colors). Extreme heat (>35°C) and wind (>40 km/h) override the base mood.
3. **Discover** — Last.fm tag-based recommendations return the most-listened-to tracks for each matching genre. The top 3 mood tags are queried in parallel, deduped by `artist::title`, and sorted by playcount.
4. **Play** — YouTube searches for the top Last.fm tracks, returns the top match per song, and embeds the IFrame Player (280×158, audio-only toggle).

Two free APIs. That's the entire stack.

---

## Tech stack

| Area | Service | Plan |
| --- | --- | --- |
| Discovery | Last.fm API | Free, no user auth |
| Playback | YouTube IFrame Player | Free, 10,000 units/day |
| Weather | OpenWeatherMap | Free tier |
| Frontend | React 18 + TypeScript + Vite | — |
| Styling | Tailwind CSS (custom weather palette) | — |
| State | Zustand | — |
| Animation | Framer Motion | — |

---

## Quick start

```bash
npm install
cp .env.example .env.local
# fill in:
#   VITE_LASTFM_API_KEY
#   VITE_YOUTUBE_API_KEY
#   VITE_OPENWEATHER_API_KEY
npm run dev
```

All three keys are free:

- Last.fm: https://www.last.fm/api/account/create
- YouTube Data API v3: https://console.cloud.google.com/apis/credentials
- OpenWeatherMap: https://home.openweathermap.org/api_keys

Supabase is optional — it's only used if you want user accounts and listening history.

---

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (runs `tsc` first) |
| `npm run preview` | Preview production build |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## Architecture

```
src/
├── components/
│   ├── layout/   Header, MobileNav, Layout, WeatherBackground
│   ├── weather/  WeatherCard, SensorGauge
│   ├── music/    TrackCard, TrackList, YouTubePlayer, MiniPlayer
│   └── ui/       shared primitives
├── pages/        Home, Sense, Music, Profile
├── services/
│   ├── weather/      OpenWeatherMap
│   ├── lastfm/       recommendations (what to play)
│   ├── youtube/      playback (how to play)
│   ├── musicService  orchestrator: Last.fm → dedupe → YouTube → cache
│   └── supabase/     optional user accounts
├── stores/       Zustand — weatherStore, musicStore, preferencesStore
├── hooks/        useGeolocation
├── utils/        moodMapper, lastfmTagMapping, youtubeCleanup,
│                 cache, quotaTracker, deduplication
├── types/        shared TypeScript types
├── config/       constants.ts (flat env + endpoint exports)
└── styles/       globals.css (Tailwind + weather keyframes)
```

---

## Quota & caching

- **YouTube Data API** — we self-limit to **100 searches/day** (tracked in localStorage under `auraplay:yt-quota:{YYYY-MM-DD}`). Each `search.list` call costs 100 quota units; 100 searches × 100 = 10,000, which is the free daily ceiling. When the limit is hit, we serve cached tracks and show a banner — fresh recommendations are available the next day.
- **Track cache** — `auraplay:tracks:{condition}` stores the final Track list per weather condition with a 30-minute TTL.
- **Last.fm cache** — per-tag results cached for 30 minutes to stay under Last.fm's 5 req/sec rate limit.
- **YouTube search cache** — per `{artist}::{title}` for 1 hour so revisiting the same mood is free.

Everything flushes via the "Clear cache" button in Profile.

---

## Fallback behavior

1. **Last.fm returns no tracks** — `musicService` falls back to `searchYouTubeByKeywords(mood.genres)` so there's still a playlist.
2. **YouTube daily limit hit** — served from the tracks cache (even if expired). Banner shown. "Open in YouTube Music" links still work.
3. **Both fail** — the Music page shows a manual genre picker; each pill opens `music.youtube.com/search?q={genre}+music` directly.

---

## License

MIT — see [LICENSE](LICENSE).
