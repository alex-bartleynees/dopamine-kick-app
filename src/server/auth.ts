import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'
import type { User } from '../types/auth'
import { BACKEND_URL, getProxyHeaders } from '../lib/proxy-utils'

interface AntiforgeryResponse {
	requestToken: string
}

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(
	async (): Promise<User | null> => {
		const request = getRequest()

		const response = await fetch(`${BACKEND_URL}/bff/user`, {
			method: 'GET',
			headers: getProxyHeaders(request),
			redirect: 'manual',
		})

		if (response.ok) {
			return (await response.json()) as User
		}

		return null
	}
)

export const logoutFn = createServerFn({ method: 'POST' }).handler(
	async (): Promise<never> => {
		const request = getRequest()

		// Fetch CSRF token server-side
		const csrfResponse = await fetch(`${BACKEND_URL}/bff/antiforgery`, {
			method: 'GET',
			headers: getProxyHeaders(request),
		})

		let csrfToken: string | null = null
		if (csrfResponse.ok) {
			const data: AntiforgeryResponse = await csrfResponse.json()
			csrfToken = data.requestToken
		}

		// Perform logout with CSRF token
		const headers = getProxyHeaders(request)
		if (csrfToken) {
			headers['X-CSRF-TOKEN'] = csrfToken
		}

		await fetch(`${BACKEND_URL}/bff/logout`, {
			method: 'POST',
			headers,
			redirect: 'manual',
		})

		throw redirect({ to: '/' })
	}
)
