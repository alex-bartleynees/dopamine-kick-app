// src/auth/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { User, ParsedUser, parseUser } from '../types/auth'
import { useCsrf } from '../hooks/useCsrf'
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
  const { fetchCsrfToken, getToken, clearToken } = useCsrf()

  const user = rawUser ? parseUser(rawUser) : null
  const isAuthenticated = rawUser?.isAuthenticated || false

  const refetchUser = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/bff/user', {
        credentials: 'include',
      })

      if (response.ok) {
        const userData = await response.json()
        setRawUser(userData)
        // Fetch CSRF token when user is authenticated
        if (userData?.isAuthenticated) {
          await fetchCsrfToken()
        }
      } else {
        setRawUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      setRawUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [fetchCsrfToken])

  const login = React.useCallback(() => {
    window.location.href = '/bff/login'
  }, [])

  const logout = React.useCallback(async () => {
    const csrfToken = getToken()

    await fetch('/bff/logout', {
      method: 'POST',
      credentials: 'include',
      redirect: 'manual',
      headers: csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {},
    })

    clearToken()
    setRawUser(null)
    window.location.href = '/'
  }, [getToken, clearToken])

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