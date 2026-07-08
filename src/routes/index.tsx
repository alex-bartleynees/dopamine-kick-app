import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
	component: App,
	beforeLoad: async ({ context }) => {
		if (
			context?.userState?.isAuthenticated &&
			context.userState.currentUser?.id
		) {
			throw redirect({ to: "/dashboard" });
		}
	},
});

function App() {
	const { login } = useAuth();
	return (
		<PageShell center>
			<div className="max-w-md w-full text-center animate-fade-in-up">
				{/* Logo */}
				<div className="flex items-center justify-center gap-2 mb-10 animate-fade-in">
					<div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
						<Flame className="w-5 h-5 text-white" />
					</div>
					<span className="text-xl font-bold gradient-text">Dopamine Kick</span>
				</div>

				{/* Illustration */}
				<div className="mb-8 relative">
					<div className="inline-block relative animate-scale-in animation-delay-200">
						{/* Soft glow behind the illustration */}
						<div className="absolute -inset-6 bg-linear-to-br from-blue-400/40 to-purple-400/40 rounded-full blur-2xl" />
						{/* Person meditating illustration */}
						<div className="relative w-64 h-64 mx-auto bg-linear-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center overflow-hidden ring-8 ring-white/60 dark:ring-white/10 shadow-2xl">
							<div className="absolute inset-0 bg-linear-to-t from-purple-500/30 to-transparent" />
							<span className="relative text-8xl">🧘</span>
							{/* Streak flames */}
							<span className="absolute top-8 right-12 text-5xl animate-wiggle">
								🔥
							</span>
							<span className="absolute top-16 left-12 text-4xl animate-wiggle animation-delay-500">
								🔥
							</span>
						</div>
						{/* Floating accents */}
						<span className="absolute -top-2 -left-4 text-3xl animate-wiggle animation-delay-700">
							✨
						</span>
						<span className="absolute -bottom-1 -right-3 text-3xl animate-wiggle animation-delay-400">
							⭐
						</span>
					</div>
				</div>

				{/* Hero headline */}
				<h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
					Build habits that <span className="gradient-text">stick</span>
				</h1>

				{/* Subheading */}
				<p className="mb-8 text-muted-foreground animate-fade-in-up animation-delay-500 leading-relaxed text-balance">
					Track daily habits, build streaks, and feel accomplished. Get that
					dopamine kick you deserve! 🔥
				</p>

				{/* Primary CTA */}
				<Button
					variant="gradient"
					size="xl"
					asChild
					className="w-full animate-fade-in-up animation-delay-600"
				>
					<Link to="/signup">Get Started</Link>
				</Button>

				{/* Secondary link */}
				<button
					type="button"
					onClick={() => login()}
					className="block mt-4 text-muted-foreground hover:text-foreground transition-colors animate-fade-in animation-delay-700 mx-auto"
				>
					Already have an account?{" "}
					<span className="text-purple-600 dark:text-purple-400 font-medium">
						Sign in
					</span>
				</button>
			</div>
		</PageShell>
	);
}
