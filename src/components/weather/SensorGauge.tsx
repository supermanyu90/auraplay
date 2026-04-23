import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export interface SensorGaugeProps {
  label: string
  value: number
  unit: string
  icon: LucideIcon
  max: number
  color?: string
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return Math.abs(value) < 10 ? value.toFixed(1) : Math.round(value).toString()
}

export function SensorGauge({
  label,
  value,
  unit,
  icon: Icon,
  max,
  color = '#3B82F6',
}: SensorGaugeProps) {
  const safeMax = max > 0 ? max : 1
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-2xl bg-white/90 backdrop-blur border border-weather-cloudy-100 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-weather-cloudy-700">
          <Icon className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-semibold tabular-nums text-weather-cloudy-900">
            {formatValue(value)}
          </span>
          <span className="text-xs text-weather-cloudy-700 ml-1">{unit}</span>
        </div>
      </div>
      <div
        className="h-2 rounded-full bg-weather-cloudy-100 overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ background: color }}
        />
      </div>
    </motion.div>
  )
}
