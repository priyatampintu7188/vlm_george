import { useState, useEffect } from 'react'
import Login from './components/Login'
import ChatInterface from './components/ChatInterface'
import type { User } from './types'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('vlm_chatbot_user')
    if (saved) {
      setUser(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser)
    localStorage.setItem('vlm_chatbot_user', JSON.stringify(authenticatedUser))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('vlm_chatbot_user')
  }

  if (loading) return null

  return (
    <>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <ChatInterface user={user} onLogout={handleLogout} />
      )}
    </>
  )
}

export default App
