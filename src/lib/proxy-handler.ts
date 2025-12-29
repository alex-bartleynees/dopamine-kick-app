import { BACKEND_URL, getProxyHeaders } from './proxy-utils'

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
