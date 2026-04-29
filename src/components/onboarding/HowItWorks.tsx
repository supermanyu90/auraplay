import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Cloud,
  Compass,
  Music,
  Play,
  Radio,
  type LucideIcon,
} from 'lucide-react'

interface Step {
  number: string
  icon: LucideIcon
  title: string
  description: string
  detail: string
  accent: string
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Radio,
    title: 'Sense',
    description: 'We auto-detect the weather around you, or you pick a mood by hand.',
    detail:
      'Geolocation + OpenWeatherMap fetch temperature, humidity, pressure, wind, visibility and a derived UV index. Permission is asked once; coordinates never leave your browser.',
    accent: 'from-weather-sunny-100 to-weather-sunny-300',
  },
  {
    number: '02',
    icon: Compass,
    title: 'Map',
    description: 'Weather becomes an audio mood — energy, valence, tempo, genre tags.',
    detail:
      'A deterministic rules-based mapper turns your conditions into one of 8 mood profiles (Sunny Uplift, Rainy Reverie, Storm Front, Heatwave…). Extreme heat or wind override the base mood.',
    accent: 'from-weather-cloudy-100 to-weather-cloudy-300',
  },
  {
    number: '03',
    icon: Music,
    title: 'Discover',
    description: "Last.fm's tag charts find the songs that fit the mood.",
    detail:
      'Top three mood tags run in parallel, deduped by artist + title, sorted by playcount. Pick Indian / Mixed / Global in Profile to skew the catalog. Recently-played tracks are filtered out so each mood feels fresh.',
    accent: 'from-weather-rainy-100 to-weather-rainy-300',
  },
  {
    number: '04',
    icon: Play,
    title: 'Play',
    description: 'YouTube + Jamendo + Audius stream the music. No subscription.',
    detail:
      'Auto mode shuffles all three sources; pick one in Profile to lock to it. Volume + share + auto-advance are built in. Caches everything to keep daily quotas cheap.',
    accent: 'from-weather-windy-100 to-weather-windy-300',
  },
]

export function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <section className="py-10 md:py-14" aria-labelledby="how-it-works-heading">
      <header className="mb-6 md:mb-8 flex items-end justify-between gap-3">
        <div>
          <h2
            id="how-it-works-heading"
            className="text-2xl md:text-3xl font-semibold text-weather-cloudy-900"
          >
            How AuraPlay works
          </h2>
          <p className="text-sm text-weather-cloudy-700 mt-1">
            Tap any step to expand the detail.
          </p>
        </div>
        <Cloud
          className="hidden md:block w-10 h-10 text-weather-cloudy-300"
          aria-hidden="true"
        />
      </header>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {STEPS.map((step, i) => {
          const isOpen = activeIndex === i
          const Icon = step.icon
          return (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className={`group w-full text-left rounded-2xl p-4 md:p-5 border transition-all hover:-translate-y-0.5 ${
                  isOpen
                    ? 'bg-white border-weather-cloudy-300 shadow-md'
                    : 'bg-white/70 hover:bg-white/90 border-weather-cloudy-100 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-weather-cloudy-700">
                    {step.number}
                  </span>
                  <span
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center`}
                    aria-hidden="true"
                  >
                    <Icon className="w-5 h-5 text-weather-cloudy-900" />
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-semibold text-weather-cloudy-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-weather-cloudy-700">{step.description}</p>
                <motion.div
                  initial={false}
                  animate={{
                    height: isOpen ? 'auto' : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <p className="mt-3 pt-3 border-t border-weather-cloudy-100 text-xs text-weather-cloudy-700 leading-relaxed">
                    {step.detail}
                  </p>
                </motion.div>
                <p className="mt-3 text-[11px] text-weather-cloudy-700/80 group-hover:text-weather-cloudy-900 transition-colors">
                  {isOpen ? 'Tap to collapse' : 'Tap for detail →'}
                </p>
              </button>
            </motion.li>
          )
        })}
      </ol>
    </section>
  )
}
