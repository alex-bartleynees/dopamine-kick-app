const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5224'

interface ServerContext {
  request: Request
}

export async function proxyHandler({ request }: ServerContext) {
  const url = new URL(request.url)
  const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: getProxyHeaders(request),
    body: request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.arrayBuffer()
      : undefined,
    redirect: 'manual',
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

export async function oidcProxyHandler({ request }: ServerContext) {
  return proxyHandler({ request })
}

function getProxyHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {}

  for (const [key, value] of request.headers.entries()) {
    if (!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
      headers[key] = value
    }
  }

  headers['host'] = new URL(BACKEND_URL).host
  headers['x-forwarded-host'] = request.headers.get('host') || ''
  headers['x-forwarded-proto'] = new URL(request.url).protocol.slice(0, -1)

  return headers
}
