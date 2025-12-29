import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";

export const Route = createFileRoute("/")({
	component: App,
});

function AuthRedirect({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			navigate({ to: "/dashboard" });
		}
	}, [isAuthenticated, isLoading, navigate]);

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
			</div>
		);
	}

	if (isAuthenticated) {
		return null;
	}

	return <>{children}</>;
}

function App() {
	const { login } = useAuth();
	return (
		<AuthRedirect>
			<div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
				<div className="max-w-md w-full text-center animate-fade-in-up">
					{/* Illustration */}
					<div className="mb-8 relative">
						<div className="inline-block relative animate-scale-in animation-delay-200">
							{/* Person meditating illustration */}
							<div className="w-64 h-64 mx-auto bg-linear-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center relative overflow-hidden">
								<span className="text-8xl">🧘</span>
								{/* Streak flames */}
								<span className="absolute top-8 right-12 text-5xl animate-wiggle">
									🔥
								</span>
								<span className="absolute top-16 left-12 text-4xl animate-wiggle animation-delay-500">
									🔥
								</span>
							</div>
						</div>
					</div>

					{/* Hero headline */}
					<h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
						Build habits that <span className="gradient-text">stick</span>
					</h1>

					{/* Subheading */}
					<p className="mb-8 text-gray-600 animate-fade-in-up animation-delay-500 leading-relaxed text-balance">
						Track daily habits, build streaks, and feel accomplished. Get that
						dopamine kick you deserve! 🔥
					</p>

					{/* Primary CTA */}
					<Link
						to="/signup"
						className="block w-full bg-linear-to-r from-blue-500 to-purple-500 text-white py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in-up animation-delay-600"
					>
						Get Started
					</Link>

					{/* Secondary link */}
					<button
						type="button"
						onClick={() => login()}
						className="block mt-4 text-gray-600 hover:text-gray-900 transition-colors animate-fade-in animation-delay-700 mx-auto"
					>
						Already have an account?{" "}
						<span className="text-purple-600 font-medium">Sign in</span>
					</button>
				</div>
			</div>
		</AuthRedirect>
	);
}
