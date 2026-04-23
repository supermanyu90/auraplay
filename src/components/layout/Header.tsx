import { Link, NavLink } from 'react-router-dom'
import { CloudSun } from 'lucide-react'

const links = [
  { to: '/', label: 'Home' },
  { to: '/sense', label: 'Sense' },
  { to: '/music', label: 'Music' },
  { to: '/profile', label: 'Profile' },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-weather-cloudy-100">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <CloudSun className="w-6 h-6 text-weather-sunny-500" />
          <span>AuraPlay</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `text-sm transition-colors ${
                  isActive
                    ? 'text-weather-rainy-700 font-medium'
                    : 'text-weather-cloudy-700 hover:text-weather-cloudy-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
