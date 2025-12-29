// src/auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { User, ParsedUser, parseUser } from '../types/auth'

interface AuthContextType {
  user: ParsedUser | null
  rawUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children, initialUser }: { 
  children: React.ReactNode
  initialUser?: User | null 
}) {
  const [rawUser, setRawUser] = useState<User | null>(initialUser || null)
  const [isLoading, setIsLoading] = useState(!initialUser)
  
  const user = rawUser ? parseUser(rawUser) : null
  const isAuthenticated = rawUser?.isAuthenticated || false
  
  const refetchUser = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/bff/user', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const userData = await response.json()
        setRawUser(userData)
      } else {
        setRawUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setRawUser(null)
    } finally {
      setIsLoading(false)
    }
  }
  
  const login = () => {
    window.location.href = '/signin-oidc'
  }
  
  const logout = async () => {
    try {
      await fetch('/bff/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      setRawUser(null)
      window.location.href = '/signin-oidc'
    }
  }
  
  // Initial client-side fetch if no initial user
  useEffect(() => {
    if (!initialUser && typeof window !== 'undefined') {
      refetchUser()
    }
  }, [initialUser])
  
  const value: AuthContextType = {
    user,
    rawUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refetchUser,
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}