import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_user')) } catch { return null }
  })
  const [token,   setToken]   = useState(() => localStorage.getItem('mb_token') || null)
  const [loading, setLoading] = useState(true)

  // Rehydrate user from server on mount
  useEffect(() => {
    const verify = async () => {
      if (token) {
        try {
          const data = await api.get('/auth/me')
          setUser(data.user)
        } catch {
          setUser(null)
          setToken(null)
          localStorage.removeItem('mb_user')
          localStorage.removeItem('mb_token')
        }
      }
      setLoading(false)
    }
    verify()
  }, []) // eslint-disable-line

  const login = useCallback((userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('mb_user', JSON.stringify(userData))
    localStorage.setItem('mb_token', authToken)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('mb_user')
    localStorage.removeItem('mb_token')
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('mb_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{
      user, token, login, logout, updateUser,
      isAuthenticated: Boolean(user && token),
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
