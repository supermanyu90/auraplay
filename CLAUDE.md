# AuraPlay — Weather-Based Music Discovery

## Project Overview
AuraPlay is an open-source web application that recommends music based on real-time ambient environmental conditions (temperature, humidity, pressure, wind, weather). It fuses weather API data with browser sensor APIs to create a "mood profile," uses Last.fm to discover matching tracks, and plays them via YouTube. The entire pipeline is free — no user subscriptions required.

## Tech Stack
- **Framework**: React 18+ with TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS 3.x
- **State management**: Zustand
- **Routing**: React Router v6
- **HTTP client**: Axios
- **Auth (optional)**: Supabase Auth (`@supabase/supabase-js`)
- **Audio playback**: YouTube IFrame Player API
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## Project Structure
```
src/
├── components/              # Reusable UI components
│   ├── ui/                  # Base UI primitives (Button, Card, Badge, etc.)
│   ├── layout/              # Header, Footer, Sidebar, MobileNav, WeatherBackground
│   ├── weather/             # WeatherCard, SensorGauge, WeatherPicker
│   ├── music/               # TrackCard, TrackList, YouTubePlayer, MiniPlayer
│   └── auth/                # (optional) LoginForm, SignupForm
├── pages/                   # Route-level page components
│   ├── Home.tsx
│   ├── Sense.tsx
│   ├── Music.tsx
│   └── Profile.tsx
├── services/                # External API integrations
│   ├── weather/             # OpenWeatherMap API client
│   ├── lastfm/              # Last.fm API client (discovery)
│   ├── youtube/             # YouTube Data API client (playback)
│   ├── musicService.ts      # Orchestrator: Last.fm → dedupe → YouTube → cache
│   └── supabase/            # (optional) Supabase client, auth helpers
├── hooks/                   # Custom React hooks
│   └── useGeolocation.ts
├── stores/                  # Zustand stores
│   ├── weatherStore.ts
│   ├── musicStore.ts
│   └── preferencesStore.ts
├── utils/                   # Helper functions
│   ├── moodMapper.ts        # Weather → mood profile algorithm
│   ├── lastfmTagMapping.ts  # Mood genres → Last.fm tag names
│   ├── youtubeCleanup.ts    # YouTube title/artist parsing, duration formatting
│   ├── cache.ts             # LocalStorage cache with TTL
│   ├── quotaTracker.ts      # Daily YouTube quota counter
│   └── deduplication.ts     # Track dedupe by normalized artist/title
├── types/                   # TypeScript type definitions
│   └── index.ts             # Track, WeatherData, MoodProfile, MusicResult, etc.
├── config/                  # Configuration and constants
│   └── constants.ts         # API keys, endpoints, quota/cache constants
├── styles/                  # Global styles
│   └── globals.css
├── App.tsx
└── main.tsx
```

## Architecture Decisions

### Mood Mapping Algorithm
Weather conditions map to audio parameters:
- `energy` (0-1): How energetic/intense the music should be
- `valence` (0-1): How positive/happy the music should be
- `tempoMin/tempoMax`: BPM range
- `genres`: Array of genre strings matching the mood

The mapping is deterministic (rules-based) with overrides for extreme temperature (>35°C → `scorching`) and wind (>40km/h → `windy`).

### Last.fm + YouTube Music Resolution
Last.fm is the recommendation engine. It takes genre tags from the mood mapper and returns popular tracks. These track names are then searched on YouTube to find playable versions. The YouTube IFrame Player provides full-song playback embedded in the app. The entire pipeline is free with no user subscriptions required.

The first three mood tags are fetched from Last.fm in parallel (`tag.getTopTracks`), deduped by normalized artist+title, sorted by playcount, and capped at 25 tracks. Each surviving track is then searched on YouTube sequentially with a 200ms stagger. Durations are batched into a single `videos.list` call to save round-trips.

### Caching
- Track recommendations per weather condition: 30 minutes (`auraplay:tracks:{condition}`)
- Last.fm per-tag results: 30 minutes (`auraplay:lastfm:tag:…`)
- YouTube per-song lookups: 1 hour (`auraplay:youtube:search:…`)
- YouTube daily quota counter keyed by UTC date

### Fallback Behavior
- Last.fm empty/down → `searchYouTubeByKeywords(mood.genres)` to build a genre-based playlist
- YouTube quota exceeded → serve stale cache with a visible banner
- Both fail → Music page renders a manual genre picker that links to `music.youtube.com/search?q=…`

### Authentication Flow
Supabase handles user auth (optional). Last.fm and YouTube use API keys only — no user-facing OAuth flow needed. Users never need to "connect" a music service.

### Background Gradient
The entire app background changes based on detected weather. Gradient colors are defined per weather condition in the mood mapper and applied via Framer Motion cross-fades over 1.5s. Rainy/snowy/stormy conditions also render particle layers.

## Code Style
- Functional components only, no class components
- Named exports for components, default export for pages
- Custom hooks prefixed with `use`
- Services are pure functions or classes, NOT React hooks
- All API calls go through service files, never directly from components
- Use TypeScript strict mode
- Prefer `const` over `let`, never use `var`
- Destructure props and state
- Use early returns for guard clauses
- Error boundaries around route-level components

## Environment Variables
Required (all free):
```
VITE_LASTFM_API_KEY=
VITE_YOUTUBE_API_KEY=
VITE_OPENWEATHER_API_KEY=
```

Optional:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Access via `import.meta.env.VITE_*` in code (exported via `src/config/constants.ts`).

## Key Commands
- `npm run dev` — Start dev server (Vite)
- `npm run build` — Production build
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint
- `npm run test` — Run Vitest
- `npm run format` — Run Prettier

## Development Guidelines
1. Always handle loading, error, and empty states for every data-fetching component
2. Every API call should have a try/catch with user-friendly error messages
3. Cache aggressively: weather data (10 min TTL), track results (30 min TTL)
4. Respect the self-imposed YouTube limit of 100 searches/day; degrade gracefully when hit
5. The app must work gracefully when Last.fm is unavailable (fall back to YouTube genre search)
6. All text content should support future i18n (no hardcoded user-facing strings in logic files)
7. Mobile-first responsive design: test at 375px, 768px, and 1440px
8. Use semantic HTML and ARIA attributes for accessibility
9. Never commit API keys or tokens to git
10. Write a meaningful commit message for every change

## Git Workflow
- `main` branch: production-ready code only
- Feature branches: `feature/lastfm-recommendations`, `feature/mood-mapper`, etc.
- Commit message format: `type(scope): description`
  - Types: feat, fix, refactor, style, docs, test, chore
  - Example: `feat(music): unified Last.fm + YouTube pipeline`
