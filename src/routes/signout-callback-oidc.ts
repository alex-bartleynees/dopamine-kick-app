import { createFileRoute } from '@tanstack/react-router'
import { oidcProxyHandler } from '../lib/proxy-handler'

export const Route = createFileRoute('/signout-callback-oidc')({
  server: {
    handlers: {
      GET: oidcProxyHandler,
      POST: oidcProxyHandler,
    },
  },
})