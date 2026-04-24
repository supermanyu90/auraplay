import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import { LoginForm } from '../components/auth/LoginForm'
import { OAuthButtons } from '../components/auth/OAuthButtons'
import { SignupForm } from '../components/auth/SignupForm'
import { useAuthStore } from '../stores/authStore'

type Mode = 'signin' | 'signup'

export default function Auth() {
  const [mode, setMode] = useState<Mode>('signin')
  const user = useAuthStore((s) => s.user)
  const enabled = useAuthStore((s) => s.enabled)
  const isReady = useAuthStore((s) => s.isReady)
  const clearError = useAuthStore((s) => s.clearError)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/profile', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    clearError()
  }, [mode, clearError])

  if (!isReady) {
    return <div className="py-16 text-center text-sm text-weather-cloudy-700">Loading…</div>
  }

  if (!enabled) {
    return (
      <div className="py-10 md:py-16 max-w-md mx-auto">
        <div className="rounded-2xl p-6 bg-weather-sunny-50/80 border border-weather-sunny-100 flex gap-3">
          <Info className="w-5 h-5 text-weather-sunny-700 flex-none mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-weather-cloudy-900">Accounts not configured</p>
            <p className="text-sm text-weather-cloudy-700 mt-1">
              Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in{' '}
              <code>.env.local</code> to enable sign-in. Everything else in AuraPlay works without
              an account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10 md:py-16 max-w-md mx-auto">
      <div className="flex gap-1 p-1 rounded-full bg-weather-cloudy-100 mb-6" role="tablist">
        <Tab selected={mode === 'signin'} onClick={() => setMode('signin')} label="Sign in" />
        <Tab selected={mode === 'signup'} onClick={() => setMode('signup')} label="Sign up" />
      </div>

      <div className="rounded-2xl p-6 md:p-7 bg-white/85 backdrop-blur border border-weather-cloudy-100 shadow-sm">
        <h1 className="text-2xl font-semibold text-weather-cloudy-900">
          {mode === 'signin' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-sm text-weather-cloudy-700 mt-1 mb-5">
          {mode === 'signin'
            ? 'Sign in to save your listening history.'
            : 'Free forever — no subscription needed.'}
        </p>

        <OAuthButtons />

        <div className="flex items-center gap-3 my-5" aria-hidden="true">
          <span className="flex-1 h-px bg-weather-cloudy-100" />
          <span className="text-xs text-weather-cloudy-700 uppercase tracking-wider">or</span>
          <span className="flex-1 h-px bg-weather-cloudy-100" />
        </div>

        {mode === 'signin' ? (
          <LoginForm onSuccess={() => navigate('/profile')} />
        ) : (
          <SignupForm onSuccess={() => navigate('/profile')} />
        )}

        <p className="text-[11px] text-weather-cloudy-700 mt-5 text-center">
          Accounts power listening history and cross-device preferences. Anonymous use is always
          allowed.
        </p>
      </div>
    </div>
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
