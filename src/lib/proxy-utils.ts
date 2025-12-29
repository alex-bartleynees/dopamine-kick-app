export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5224'

export function getProxyHeaders(request: Request): Record<string, string> {
	const headers: Record<string, string> = {}

	for (const [key, value] of request.headers.entries()) {
		if (
			!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())
		) {
			headers[key] = value
		}
	}

	headers['host'] = new URL(BACKEND_URL).host
	headers['x-forwarded-host'] = request.headers.get('host') || ''
	headers['x-forwarded-proto'] = new URL(request.url).protocol.slice(0, -1)

	return headers
}
