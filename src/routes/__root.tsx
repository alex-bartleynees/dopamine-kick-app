import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles/index.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { User } from '@/types/auth'
import { AuthProvider } from '@/providers/AuthProvider'
import { getCurrentUserFn } from '@/server/auth'

interface MyRouterContext {
  queryClient: QueryClient
  initialUser?: User | null
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    const initialUser = await getCurrentUserFn()
    return { initialUser }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Dopamine Kick',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  const { initialUser } = Route.useRouteContext()
  return (
    <AuthProvider initialUser={initialUser}>
      <AuthenticatedOutlet />
    </AuthProvider>
  )
}

function AuthenticatedOutlet() {
  return (
    <main id="app">
      <Outlet />
    </main>
  )
}


function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
