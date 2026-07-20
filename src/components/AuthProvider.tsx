"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const USERNAME = 'Patel Tiles & Ceramic'
const PASSWORD = '#Patel2025'
const AUTH_KEY = 'ptc_auth_session'

interface AuthContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checked, setChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const session = localStorage.getItem(AUTH_KEY)
    if (session === 'true') {
      setIsAuthenticated(true)
    }
    setChecked(true)
  }, [])

  useEffect(() => {
    if (!checked) return
    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login')
    }
    if (isAuthenticated && pathname === '/login') {
      router.replace('/')
    }
  }, [isAuthenticated, checked, pathname, router])

  const login = (username: string, password: string): boolean => {
    if (username === USERNAME && password === PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    setIsAuthenticated(false)
    router.replace('/login')
  }

  if (!checked) return null

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
