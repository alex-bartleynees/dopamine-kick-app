import { Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

export function NotFoundComponent() {
	return (
		<PageShell center>
			<div className="max-w-md w-full text-center animate-fade-in-up">
				{/* 404 illustration */}
				<div className="mb-8 relative">
					<div className="inline-block relative animate-scale-in animation-delay-200">
						<div className="w-48 h-48 mx-auto bg-linear-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center relative overflow-hidden shadow-lg">
							<span className="text-7xl">🔍</span>
						</div>
					</div>
				</div>

				{/* 404 headline */}
				<h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
					Page <span className="gradient-text">not found</span>
				</h1>

				{/* Message */}
				<p className="mb-8 text-muted-foreground animate-fade-in-up animation-delay-500 leading-relaxed text-balance">
					The page you're looking for doesn't exist or has been moved.
				</p>

				{/* Action button */}
				<Button
					asChild
					variant="gradient"
					className="h-auto py-3 px-6 rounded-xl animate-fade-in-up animation-delay-700"
				>
					<Link to="/">Go Home</Link>
				</Button>
			</div>
		</PageShell>
	);
}
