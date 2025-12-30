import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_auth/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { logout } = useAuth();

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
					type="button"
					onClick={() => logout()}
					className="mt-8 text-muted-foreground hover:text-foreground transition-colors"
				>
					Sign out
				</button>
			</div>
		</div>
	);
}
