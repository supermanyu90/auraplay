# AuraPlay — Weather-Based Music Discovery

## Project Overview
AuraPlay is an open-source web application that recommends music from Spotify, Apple Music, and YouTube Music based on real-time ambient environmental conditions (temperature, humidity, pressure, wind, weather). It fuses weather API data with browser sensor APIs to create a "mood profile" and fetches matching tracks from multiple music services.

## Tech Stack
- **Framework**: React 18+ with TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS 3.x
- **State management**: Zustand
- **Routing**: React Router v6
- **HTTP client**: Axios
- **Auth**: Supabase Auth (@supabase/supabase-js)
- **Audio playback**: Howler.js
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI primitives (Button, Card, Badge, etc.)
│   ├── layout/          # Header, Footer, Sidebar, MobileNav
│   ├── weather/         # WeatherCard, SensorGauge, WeatherPicker
│   ├── music/           # TrackCard, TrackList, NowPlaying, MiniPlayer
│   └── auth/            # LoginForm, SignupForm, OAuthButtons
├── pages/               # Route-level page components
│   ├── Home.tsx
│   ├── Sense.tsx
│   ├── Music.tsx
│   ├── Profile.tsx
│   └── Auth.tsx
├── services/            # External API integrations
│   ├── weather/         # OpenWeatherMap API client
│   ├── spotify/         # Spotify Web API + OAuth PKCE
│   ├── apple/           # Apple Music API client
│   ├── youtube/         # YouTube Data API v3 client
│   ├── supabase/        # Supabase client, auth helpers, DB queries
│   └── musicService.ts  # Unified music service orchestrator
├── hooks/               # Custom React hooks
│   ├── useWeather.ts
│   ├── useAudioPlayer.ts
│   ├── useMoodMapper.ts
│   ├── useGeolocation.ts
│   └── useSensors.ts
├── stores/              # Zustand stores
│   ├── weatherStore.ts
│   ├── musicStore.ts
│   ├── authStore.ts
│   └── playerStore.ts
├── utils/               # Helper functions
│   ├── moodMapper.ts    # Weather → mood profile algorithm
│   ├── genreMapping.ts  # Mood genres → Spotify/Apple/YT genre seeds
│   ├── youtubeCleanup.ts # YouTube title/artist parsing
│   ├── cache.ts         # LocalStorage caching with TTL
│   └── formatters.ts    # Duration, temperature formatters
├── types/               # TypeScript type definitions
│   └── index.ts         # Track, WeatherData, MoodProfile, etc.
├── config/              # Configuration and constants
│   └── constants.ts     # API keys, endpoints, feature flags
├── styles/              # Global styles
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

The mapping is deterministic (rules-based) with overrides for extreme temperature (>35°C) and wind (>40km/h).

### Multi-Service Music Resolution
All three music services are queried IN PARALLEL via Promise.allSettled. Results are normalized to a shared Track interface, interleaved (not grouped by service), and cached for 30 minutes per weather condition.

### Authentication Flow
- Supabase handles user auth (email/password + Google OAuth)
- Spotify uses OAuth 2.0 with PKCE (no client secret needed in browser)
- Apple Music uses a developer token (JWT) for catalog search (no user auth needed)
- YouTube Data API uses an API key (no user auth needed)

### Background Gradient
The entire app background changes based on detected weather. Gradient colors are defined per weather condition in the mood mapper and applied via CSS custom properties for smooth transitions.

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
All sensitive keys go in `.env.local` (gitignored):
```
VITE_SPOTIFY_CLIENT_ID=
VITE_OPENWEATHER_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_APPLE_MUSIC_TOKEN=
VITE_YOUTUBE_API_KEY=
```

Access via `import.meta.env.VITE_*` in code.

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
3. Cache aggressively: weather data (10 min TTL), music recommendations (30 min TTL)
4. Spotify token refresh must happen automatically before expiry
5. The app must work gracefully when any single music service is unavailable
6. All text content should support future i18n (no hardcoded user-facing strings in logic files)
7. Mobile-first responsive design: test at 375px, 768px, and 1440px
8. Use semantic HTML and ARIA attributes for accessibility
9. Never commit API keys or tokens to git
10. Write a meaningful commit message for every change

## Git Workflow
- `main` branch: production-ready code only
- Feature branches: `feature/spotify-auth`, `feature/mood-mapper`, etc.
- Commit message format: `type(scope): description`
  - Types: feat, fix, refactor, style, docs, test, chore
  - Example: `feat(spotify): add OAuth PKCE authentication flow`
