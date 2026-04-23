import { NavLink } from 'react-router-dom'
import { Home as HomeIcon, Radio, Music as MusicIcon, User } from 'lucide-react'

const items = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/sense', label: 'Sense', icon: Radio },
  { to: '/music', label: 'Music', icon: MusicIcon },
  { to: '/profile', label: 'Profile', icon: User },
]

export default function MobileNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-weather-cloudy-100"
      aria-label="Mobile"
    >
      <ul className="flex justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                  isActive ? 'text-weather-rainy-700' : 'text-weather-cloudy-700'
                }`
              }
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
