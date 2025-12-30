import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/choose-habits')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/choose-habits"!</div>
}
