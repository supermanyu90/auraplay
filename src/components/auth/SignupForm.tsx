import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export interface SignupFormProps {
  onSuccess?: () => void
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState(false)
  const signUp = useAuthStore((s) => s.signUp)
  const isLoading = useAuthStore((s) => s.isLoading)
  const error = useAuthStore((s) => s.error)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const outcome = await signUp(email.trim(), password)
    if (outcome === 'signed-in') {
      onSuccess?.()
    } else if (outcome === 'email-confirmation-required') {
      setConfirmation(true)
    }
  }

  if (confirmation) {
    return (
      <div className="flex flex-col items-center text-center py-4">
        <CheckCircle2 className="w-8 h-8 text-weather-windy-500 mb-2" aria-hidden="true" />
        <p className="font-medium text-weather-cloudy-900">Almost there</p>
        <p className="text-sm text-weather-cloudy-700 mt-1">
          Check <span className="font-medium">{email}</span> for a confirmation link to activate
          your account.
        </p>
      </div>
    )
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
        autoComplete="new-password"
        required
        minLength={6}
      />
      <p className="text-[11px] text-weather-cloudy-700">At least 6 characters.</p>
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
        Create account
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
