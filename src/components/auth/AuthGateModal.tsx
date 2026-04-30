import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Music, X } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useMusicStore } from '../../stores/musicStore'
import { LoginForm } from './LoginForm'
import { OAuthButtons } from './OAuthButtons'
import { SignupForm } from './SignupForm'

type Mode = 'signin' | 'signup'

export function AuthGateModal() {
  const open = useMusicStore((s) => s.authGateOpen)
  const close = useMusicStore((s) => s.closeAuthGate)
  const enabled = useAuthStore((s) => s.enabled)
  const isReady = useAuthStore((s) => s.isReady)
  const clearError = useAuthStore((s) => s.clearError)
  const [mode, setMode] = useState<Mode>('signup')

  useEffect(() => {
    clearError()
  }, [mode, clearError])

  if (!open) return null
  if (!enabled || !isReady) return null

  return (
    <motion.div
      key="auth-gate-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-md flex items-stretch md:items-center md:justify-center overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="w-full md:max-w-md md:rounded-3xl bg-white p-6 md:p-7 shadow-2xl min-h-full md:min-h-0 md:my-auto"
      >
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-10 h-10 rounded-2xl bg-weather-rainy-100 text-weather-rainy-700 flex items-center justify-center flex-none"
              aria-hidden="true"
            >
              <Music className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-weather-cloudy-900">Sign in to play</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-weather-windy-500 text-white">
                  Free
                </span>
              </div>
              <p className="text-xs text-weather-cloudy-700">
                AuraPlay is 100% free — no payment, no premium tier.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-weather-cloudy-100 text-weather-cloudy-900 flex items-center justify-center hover:bg-weather-cloudy-200 flex-none"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5 text-[11px] text-weather-cloudy-700">
          <li className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-weather-windy-700 flex-none" aria-hidden="true" />
            Free forever
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-weather-windy-700 flex-none" aria-hidden="true" />
            No credit card
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-weather-windy-700 flex-none" aria-hidden="true" />
            Saves your history
          </li>
        </ul>

        <div className="flex gap-1 p-1 rounded-full bg-weather-cloudy-100 mb-5" role="tablist">
          <Tab selected={mode === 'signin'} onClick={() => setMode('signin')} label="Sign in" />
          <Tab selected={mode === 'signup'} onClick={() => setMode('signup')} label="Sign up" />
        </div>

        <OAuthButtons />

        <div className="flex items-center gap-3 my-4" aria-hidden="true">
          <span className="flex-1 h-px bg-weather-cloudy-100" />
          <span className="text-xs text-weather-cloudy-700 uppercase tracking-wider">or</span>
          <span className="flex-1 h-px bg-weather-cloudy-100" />
        </div>

        {mode === 'signin' ? <LoginForm /> : <SignupForm />}

        <p className="text-[11px] text-weather-cloudy-700/80 mt-4 text-center">
          No tracking, no ads, no subscription. Powered by Supabase.
        </p>
      </motion.div>
    </motion.div>
  )
}

interface TabProps {
  selected: boolean
  onClick: () => void
  label: string
}

function Tab({ selected, onClick, label }: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={`flex-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        selected
          ? 'bg-white text-weather-cloudy-900 shadow-sm'
          : 'text-weather-cloudy-700 hover:text-weather-cloudy-900'
      }`}
    >
      {label}
    </button>
  )
}
