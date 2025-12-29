// src/auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { User, ParsedUser, parseUser } from '../types/auth'
import { getCurrentUserFn, logoutFn } from '../server/auth'
import React from 'react'

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

  const refetchUser = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const userData = await getCurrentUserFn()
      setRawUser(userData)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setRawUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = React.useCallback(() => {
    window.location.href = '/bff/login'
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await logoutFn()
    } catch (error) {
      // Redirect throws a Response, so only log actual errors
      if (!(error instanceof Response)) {
        console.error('Logout failed:', error)
      }
    }
    setRawUser(null)
  }, [])

  // Initial client-side fetch if no initial user
  useEffect(() => {
    if (!initialUser && typeof window !== 'undefined') {
      refetchUser()
    }
  }, [initialUser, refetchUser])
  
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