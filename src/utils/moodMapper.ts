import type {
  MoodProfile,
  RegionalPreference,
  WeatherCondition,
  WeatherData,
} from '../types'

const INDIAN_GENRES: Record<WeatherCondition, string[]> = {
  sunny: ['bollywood', 'punjabi pop', 'filmi', 'hindi pop'],
  cloudy: ['hindi indie', 'indian indie', 'hindi acoustic'],
  rainy: ['ghazal', 'sufi', 'hindi acoustic'],
  stormy: ['hindi rock', 'punjabi rap', 'indian metal'],
  snowy: ['indian classical', 'hindustani classical', 'carnatic'],
  foggy: ['sufi', 'qawwali', 'indian ambient'],
  windy: ['bhangra', 'punjabi folk', 'folk india'],
  scorching: ['bhangra', 'bollywood dance', 'punjabi'],
}

export function applyRegionalPreference(
  mood: MoodProfile,
  preference: RegionalPreference,
): MoodProfile {
  if (preference === 'global') return mood
  const indian = INDIAN_GENRES[mood.condition] ?? []
  if (indian.length === 0) return mood
  if (preference === 'indian') {
    return { ...mood, genres: [...indian] }
  }
  // 'mixed' — interleave so the first 3 tags yield 2 Indian + 1 Western.
  const mixed: string[] = []
  const max = Math.max(indian.length, mood.genres.length)
  for (let i = 0; i < max; i++) {
    if (indian[i]) mixed.push(indian[i])
    if (mood.genres[i]) mixed.push(mood.genres[i])
  }
  return { ...mood, genres: mixed }
}

const MOODS: Record<WeatherCondition, Omit<MoodProfile, 'condition'>> = {
  sunny: {
    icon: '☀️',
    label: 'Sunny Uplift',
    energy: 0.78,
    valence: 0.85,
    tempoMin: 110,
    tempoMax: 140,
    genres: ['indie pop', 'tropical house', 'funk', 'summer pop'],
    description: 'Bright skies call for upbeat, sun-drenched tunes.',
    gradientColors: ['#FFF9E6', '#FBBF24'],
  },
  cloudy: {
    icon: '☁️',
    label: 'Overcast Chill',
    energy: 0.45,
    valence: 0.5,
    tempoMin: 80,
    tempoMax: 110,
    genres: ['indie folk', 'alt rock', 'dream pop', 'chillhop'],
    description: 'Soft cloud cover invites mellow, thoughtful listening.',
    gradientColors: ['#F4F6F8', '#94A3B8'],
  },
  rainy: {
    icon: '🌧️',
    label: 'Rainy Day Reverie',
    energy: 0.35,
    valence: 0.4,
    tempoMin: 60,
    tempoMax: 95,
    genres: ['lofi', 'acoustic', 'bedroom pop', 'jazz'],
    description: 'Steady rain pairs best with warm, introspective sounds.',
    gradientColors: ['#EFF6FF', '#3B82F6'],
  },
  stormy: {
    icon: '⛈️',
    label: 'Storm Front',
    energy: 0.85,
    valence: 0.25,
    tempoMin: 130,
    tempoMax: 170,
    genres: ['post-rock', 'industrial', 'metal', 'dark electronic'],
    description: 'Heavy skies charge the air — match them with intensity.',
    gradientColors: ['#D1D5DB', '#1F2937'],
  },
  snowy: {
    icon: '❄️',
    label: 'Snowfall Stillness',
    energy: 0.3,
    valence: 0.55,
    tempoMin: 50,
    tempoMax: 85,
    genres: ['ambient', 'classical', 'neoclassical', 'post-classical'],
    description: 'Falling snow invites quiet, spacious compositions.',
    gradientColors: ['#F8FAFC', '#94A3B8'],
  },
  foggy: {
    icon: '🌫️',
    label: 'Fog Drift',
    energy: 0.38,
    valence: 0.45,
    tempoMin: 65,
    tempoMax: 95,
    genres: ['shoegaze', 'dream pop', 'ambient', 'downtempo'],
    description: 'Misted air blurs edges — let the sound do the same.',
    gradientColors: ['#F9FAFB', '#9CA3AF'],
  },
  windy: {
    icon: '🌬️',
    label: 'Wind Rush',
    energy: 0.72,
    valence: 0.62,
    tempoMin: 100,
    tempoMax: 135,
    genres: ['folk rock', 'alt country', 'cinematic', 'world'],
    description: 'Kinetic winds match music that keeps moving.',
    gradientColors: ['#ECFDF5', '#10B981'],
  },
  scorching: {
    icon: '🔥',
    label: 'Heatwave',
    energy: 0.9,
    valence: 0.8,
    tempoMin: 115,
    tempoMax: 150,
    genres: ['reggaeton', 'afrobeats', 'dancehall', 'tropical'],
    description: 'Extreme heat demands something bold and rhythmic.',
    gradientColors: ['#FEF3C7', '#F97316'],
  },
}

export const MOOD_ORDER: WeatherCondition[] = [
  'sunny',
  'cloudy',
  'rainy',
  'stormy',
  'snowy',
  'foggy',
  'windy',
  'scorching',
]

export function getMoodForCondition(condition: WeatherCondition): MoodProfile {
  return { condition, ...MOODS[condition] }
}

export function mapWeatherToMood(weather: WeatherData): MoodProfile {
  let condition: WeatherCondition = weather.condition

  if (weather.temperature > 35) {
    condition = 'scorching'
  } else if (weather.windSpeed > 40 && condition !== 'stormy') {
    condition = 'windy'
  }

  return getMoodForCondition(condition)
}
