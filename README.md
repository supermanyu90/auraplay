# AuraPlay

Weather-based music discovery. AuraPlay reads the weather where you are, maps it to an audio mood, and builds a playlist from **Last.fm** + **YouTube Music**.

---

## How it works

1. **Sense** — browser geolocation + OpenWeatherMap give us real-time conditions (temperature, humidity, pressure, wind, visibility, derived UV).
2. **Map** — a deterministic `moodMapper` converts weather into a `MoodProfile` (energy, valence, tempo range, genres, gradient colors). Extreme heat (>35°C) and wind (>40 km/h) override the base mood.
3. **Discover** — Last.fm tag-based recommendations return the tracks most-listened-to for each matching genre. The top 3 mood tags are queried in parallel, deduped by `artist::title`, and sorted by playcount.
4. **Play** — YouTube Music handles playback. We search YouTube for the top Last.fm results and embed the IFrame Player (280×158, with an audio-only toggle).

---

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS with a custom weather palette (sunny / cloudy / rainy / stormy / snowy / foggy / windy / scorching)
- Zustand (weather + music stores)
- React Router v6
- Framer Motion (particle layers, cross-fading backgrounds, animated transitions)
- Axios (all API calls)
- Lucide React (icons)

---

## Services

### Active — free, anonymous, ships in the app
| Service | Role | Why |
| --- | --- | --- |
| **OpenWeatherMap** | Current weather by coordinates or city | Free tier covers the use case; returns everything the mood mapper needs in one call |
| **Last.fm** | Primary recommendation source — _what to play_ | Free API key, no user auth, excellent genre-tag data |
| **YouTube Data API** | Primary playback layer — _how to play_ | Free tier (10,000 units/day), embeddable IFrame Player, near-universal track coverage |

### Premium tier (roadmap — **not implemented**)

These integrations are reserved for a future subscription tier. They'd give paying users higher-fidelity streams, richer metadata, and full-song playback without YouTube's embed limitations.

#### Spotify
- **Auth**: OAuth 2.0 PKCE in-browser (no client secret needed)
- **Read**: Catalog search, audio features (energy, valence, tempo — a direct match for `MoodProfile`), deep recommendation endpoints
- **Playback**: Web Playback SDK — full-song streaming in the browser for Premium accounts
- **Preview**: 30-second previews are available without user auth
- **Why premium**: Best-in-class metadata and the only option that gives us tempo/energy/valence directly from the source, instead of inferring them

#### Apple Music
- **Auth**: Developer token (server-signed JWT) for catalog access; MusicKit JS for user playback
- **Read**: Catalog search, charts, editorial playlists
- **Playback**: MusicKit JS — full-song streaming for Apple Music subscribers
- **Why premium**: Deep catalog, high-quality audio, native-app-style playback UX

Both service folders exist as scaffolding (`src/services/spotify/`, `src/services/apple/`) but contain no code. They land together with the subscription flow.

---

## Getting started

```bash
npm install
cp .env.example .env.local
# fill in the three keys:
#   VITE_OPENWEATHER_API_KEY
#   VITE_LASTFM_API_KEY
#   VITE_YOUTUBE_API_KEY
npm run dev
```

Where to get each key:
- OpenWeatherMap: https://home.openweathermap.org/api_keys
- Last.fm: https://www.last.fm/api/account/create
- YouTube Data API: https://console.cloud.google.com/apis/credentials (enable the YouTube Data API v3)

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
│   ├── music/    TrackCard, TrackList, YouTubePlayer
│   ├── ui/       shared primitives
│   └── auth/     (premium-tier, not implemented)
├── pages/        Home, Sense, Music, Profile
├── services/
│   ├── weather/  OpenWeatherMap
│   ├── lastfm/   recommendations (primary)
│   ├── youtube/  playback (primary)
│   ├── spotify/  premium — not implemented
│   ├── apple/    premium — not implemented
│   └── supabase/ (planned: user accounts, listening history)
├── stores/       Zustand — weatherStore, musicStore
├── hooks/        useGeolocation
├── utils/        moodMapper, lastfmTagMapping, youtubeCleanup
├── types/        shared TypeScript types
├── config/       API endpoints + env accessor
└── styles/       global CSS (Tailwind + weather keyframes)
```

---

## API quota notes

- **YouTube Data API** — 10,000 units/day on the free tier; each `search.list` call costs 100 units. To stay within budget, `searchBatch` caps at 20 searches per mood load and caches results for 1 hour in `localStorage`. Usage is tracked per day under `auraplay:youtube:quota`.
- **Last.fm** — 5 requests/sec per key. The recommendation engine staggers the three parallel tag fetches by 220 ms each and caches per-tag results for 30 minutes.

---

## License

TBD
