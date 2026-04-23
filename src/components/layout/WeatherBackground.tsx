import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWeatherStore } from '../../stores/weatherStore'

const DEFAULT_GRADIENT: [string, string] = ['#FFF9E6', '#FBBF24']
const DEFAULT_KEY = 'default'

export default function WeatherBackground() {
  const moodProfile = useWeatherStore((s) => s.moodProfile)
  const gradient = moodProfile?.gradientColors ?? DEFAULT_GRADIENT
  const condition = moodProfile?.condition
  const key = condition ?? DEFAULT_KEY

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <AnimatePresence>
        <motion.div
          key={`bg-${key}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          style={{ background: `linear-gradient(160deg, ${gradient[0]} 0%, ${gradient[1]} 100%)` }}
        />
      </AnimatePresence>

      <AnimatePresence mode="sync">
        {condition === 'rainy' ? <RainLayer key="rain" /> : null}
        {condition === 'snowy' ? <SnowLayer key="snow" /> : null}
        {condition === 'stormy' ? <LightningLayer key="lightning" /> : null}
      </AnimatePresence>
    </div>
  )
}

interface Drop {
  id: number
  left: number
  duration: number
  delay: number
  height: number
}

interface Flake {
  id: number
  left: number
  duration: number
  delay: number
  size: number
}

function RainLayer() {
  const drops = useMemo<Drop[]>(
    () =>
      Array.from({ length: 45 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: 0.6 + Math.random() * 0.8,
        delay: Math.random() * 2,
        height: 18 + Math.random() * 30,
      })),
    [],
  )

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {drops.map((d) => (
        <span
          key={d.id}
          className="absolute top-0 w-px bg-gradient-to-b from-transparent via-white/70 to-white/30"
          style={{
            left: `${d.left}%`,
            height: `${d.height}px`,
            animation: `rainFall ${d.duration}s linear infinite`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </motion.div>
  )
}

function SnowLayer() {
  const flakes = useMemo<Flake[]>(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: 6 + Math.random() * 7,
        delay: Math.random() * 6,
        size: 3 + Math.random() * 5,
      })),
    [],
  )

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute top-0 rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: 0.85,
            animation: `snowDrift ${f.duration}s linear infinite`,
            animationDelay: `${f.delay}s`,
          }}
        />
      ))}
    </motion.div>
  )
}

function LightningLayer() {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div
        className="absolute inset-0 bg-white"
        style={{ animation: 'lightningFlash 8s ease-in-out infinite' }}
      />
    </motion.div>
  )
}
