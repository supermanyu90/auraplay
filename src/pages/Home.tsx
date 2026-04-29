import { useNavigate } from 'react-router-dom'
import { Radio } from 'lucide-react'
import { HowItWorks } from '../components/onboarding/HowItWorks'
import { useWeatherStore } from '../stores/weatherStore'
import { MOOD_ORDER, getMoodForCondition } from '../utils/moodMapper'
import type { WeatherCondition } from '../types'

export default function Home() {
  const navigate = useNavigate()
  const setMoodManually = useWeatherStore((s) => s.setMoodManually)

  const handlePickMood = (condition: WeatherCondition) => {
    setMoodManually(condition)
    navigate('/music')
  }

  return (
    <div className="py-10 md:py-16">
      <section className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-weather-cloudy-900">
          AuraPlay
        </h1>
        <p className="mt-4 text-lg md:text-xl text-weather-cloudy-700">
          Music that matches the sky above you. We read the weather, your sensors, and build the
          soundtrack for right now.
        </p>

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/sense')}
            className="relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-weather-cloudy-900 text-white font-medium shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-transform"
          >
            <span
              className="absolute inset-0 rounded-full bg-weather-cloudy-900/60 animate-ping"
              aria-hidden="true"
            />
            <Radio className="w-5 h-5 relative" aria-hidden="true" />
            <span className="relative">Sense My Environment</span>
          </button>
        </div>
      </section>

      <section className="mt-16 md:mt-20">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-weather-cloudy-900">
              Or pick a mood
            </h2>
            <p className="text-sm text-weather-cloudy-700">
              Skip the scan and tap a weather vibe to start listening.
            </p>
          </div>
        </div>

        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
          aria-label="Weather moods"
        >
          {MOOD_ORDER.map((condition) => {
            const mood = getMoodForCondition(condition)
            return (
              <li key={condition}>
                <button
                  type="button"
                  onClick={() => handlePickMood(condition)}
                  className="group w-full text-left rounded-2xl p-4 md:p-5 bg-white/70 hover:bg-white/90 backdrop-blur border border-weather-cloudy-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl md:text-4xl" aria-hidden="true">
                      {mood.icon}
                    </span>
                    <span
                      className="w-8 h-8 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `linear-gradient(135deg, ${mood.gradientColors[0]}, ${mood.gradientColors[1]})`,
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-4 font-semibold text-weather-cloudy-900">{mood.label}</h3>
                  <p className="mt-1 text-xs text-weather-cloudy-700 line-clamp-2">
                    {mood.genres.slice(0, 3).join(' · ')}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <HowItWorks />
    </div>
  )
}
