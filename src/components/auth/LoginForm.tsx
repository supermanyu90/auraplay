import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const signIn = useAuthStore((s) => s.signIn)
  const isLoading = useAuthStore((s) => s.isLoading)
  const error = useAuthStore((s) => s.error)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await signIn(email.trim(), password)
    if (ok) onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        required
        minLength={6}
      />
      {error ? (
        <p className="text-sm text-weather-stormy-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-weather-cloudy-900 text-white font-medium disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] transition-transform"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
        Sign in
      </button>
    </form>
  )
}

interface FieldProps {
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  required?: boolean
  minLength?: number
}

function Field({ label, type, value, onChange, autoComplete, required, minLength }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-weather-cloudy-700 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full px-3 py-2 rounded-lg bg-white border border-weather-cloudy-100 text-sm focus:outline-none focus:ring-2 focus:ring-weather-cloudy-300"
      />
    </label>
  )
}
