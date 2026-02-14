'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { User } from '@/types/api'
import * as api from '@/lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return !payload.exp || payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      if (isTokenExpired(token)) {
        localStorage.removeItem('token')
        setIsLoading(false)
        return
      }
      api.getProfile()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  // Periodically check token expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token')
      if (token && isTokenExpired(token)) {
        logout()
      }
    }, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [logout])

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password)
    localStorage.setItem('token', res.token)
    setUser(res.user)
  }

  const register = async (email: string, password: string, name: string, phone?: string) => {
    const res = await api.register(email, password, name, phone)
    localStorage.setItem('token', res.token)
    setUser(res.user)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
