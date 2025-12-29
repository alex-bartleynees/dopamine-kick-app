import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/providers/AuthProvider"
import { useEffect } from "react"

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
})

function Dashboard() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/" })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Welcome back! Your habits are waiting.
        </p>

        <div className="grid gap-4">
          <div className="p-6 rounded-2xl border bg-card">
            <p className="text-muted-foreground">Dashboard coming soon...</p>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="mt-8 text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
