import { Outlet } from 'react-router-dom'
import Header from './Header'
import MobileNav from './MobileNav'
import WeatherBackground from './WeatherBackground'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <WeatherBackground />
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 pb-24 md:pb-12 relative">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
