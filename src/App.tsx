import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Layout from './components/layout/Layout'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Music from './pages/Music'
import Profile from './pages/Profile'
import Sense from './pages/Sense'
import { useAuthStore } from './stores/authStore'

function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    void init()
  }, [init])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/sense" element={<Sense />} />
          <Route path="/music" element={<Music />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth />} />
        </Route>
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}

export default App
