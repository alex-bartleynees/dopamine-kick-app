import { useState, useCallback } from 'react'

interface AntiforgeryResponse {
  requestToken: string
}

let csrfToken: string | null = null

export function useCsrf() {
  const [isLoading, setIsLoading] = useState(false)

  const fetchCsrfToken = useCallback(async (): Promise<string | null> => {
    try {
      setIsLoading(true)
      const response = await fetch('/bff/antiforgery', {
        credentials: 'include',
      })

      if (response.ok) {
        const data: AntiforgeryResponse = await response.json()
        csrfToken = data.requestToken
        return csrfToken
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error)
    } finally {
      setIsLoading(false)
    }
    return null
  }, [])

  const getToken = useCallback((): string | null => {
    return csrfToken
  }, [])

  const clearToken = useCallback((): void => {
    csrfToken = null
  }, [])

  return {
    fetchCsrfToken,
    getToken,
    clearToken,
    isLoading,
  }
}
