import { createContext, useContext, useState, useEffect } from 'react'
import { USERS } from '../data/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('pipelineiq_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('pipelineiq_user') }
    }
    setLoading(false)
  }, [])

  const login = (username, password) => {
    const APP_PASSWORD = 'PipelineIQ2025'
    const u = USERS[username.toLowerCase()]
    if (!u || password !== APP_PASSWORD) {
      throw new Error('Invalid username or password')
    }
    setUser(u)
    localStorage.setItem('pipelineiq_user', JSON.stringify(u))
    return u
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('pipelineiq_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
