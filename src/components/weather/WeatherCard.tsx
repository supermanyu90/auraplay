import { motion } from 'framer-motion'
import { useWeatherStore } from '../../stores/weatherStore'

export function WeatherCard() {
  const weatherData = useWeatherStore((s) => s.weatherData)
  const moodProfile = useWeatherStore((s) => s.moodProfile)

  if (!moodProfile) return null

  const [from, to] = moodProfile.gradientColors

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="rounded-3xl p-6 md:p-8 shadow-md overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs md:text-sm uppercase tracking-widest text-weather-cloudy-900/70">
            {weatherData?.location ?? (weatherData ? 'Your location' : 'Mood preview')}
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-weather-cloudy-900 mt-1 truncate">
            {moodProfile.label}
          </h2>
          <p className="text-weather-cloudy-900/80 mt-2 max-w-md">{moodProfile.description}</p>
          {weatherData?.description ? (
            <p className="text-weather-cloudy-900/60 text-sm mt-1 capitalize">
              {weatherData.description} · {Math.round(weatherData.temperature)}°C
            </p>
          ) : null}
        </div>
        <motion.span
          className="text-5xl md:text-6xl leading-none select-none"
          initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14 }}
          aria-hidden="true"
        >
          {moodProfile.icon}
        </motion.span>
      </div>
      <ul className="flex flex-wrap gap-2 mt-5" aria-label="Matching genres">
        {moodProfile.genres.map((genre) => (
          <li
            key={genre}
            className="text-xs font-medium px-3 py-1 rounded-full bg-white/60 text-weather-cloudy-900 backdrop-blur"
          >
            {genre}
          </li>
        ))}
      </ul>
    </motion.article>
  )
}
