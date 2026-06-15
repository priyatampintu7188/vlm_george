import { useState, useEffect } from 'react'
import Login from './components/Login'
import DiagramPortal from './components/DiagramPortal'
import type { User } from './types'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('vlm_diagram_user')
    if (saved) setUser(JSON.parse(saved))
    setLoading(false)
  }, [])

  const handleLogin = (u: User) => {
    setUser(u)
    localStorage.setItem('vlm_diagram_user', JSON.stringify(u))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('vlm_diagram_user')
  }

  if (loading) return null

  return user ? (
    <DiagramPortal user={user} onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  )
}

export default App
