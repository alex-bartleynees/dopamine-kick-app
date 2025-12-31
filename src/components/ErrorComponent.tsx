import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

interface ErrorComponentProps {
	error?: Error;
	message?: string;
	reset?: () => void;
}

export function ErrorComponent({ error, message, reset }: ErrorComponentProps) {
	const router = useRouter();

	const displayMessage =
		message || error?.message || "An unexpected error occurred. Please try again.";

	const handleReset = () => {
		if (reset) {
			reset();
		}
		router.invalidate();
	};

	const handleGoBack = () => {
		window.history.back();
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center p-6">
			<div className="max-w-md w-full text-center animate-fade-in-up">
				{/* Error illustration */}
				<div className="mb-8 relative">
					<div className="inline-block relative animate-scale-in animation-delay-200">
						<div className="w-48 h-48 mx-auto bg-linear-to-br from-red-400 to-orange-400 rounded-full flex items-center justify-center relative overflow-hidden shadow-lg">
							<span className="text-7xl">😵</span>
						</div>
					</div>
				</div>

				{/* Error headline */}
				<h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
					Oops! Something went{" "}
					<span className="gradient-text">wrong</span>
				</h1>

				{/* Error message */}
				<p className="mb-6 text-gray-600 dark:text-gray-300 animate-fade-in-up animation-delay-500 leading-relaxed text-balance">
					{displayMessage}
				</p>

				{/* Error details (collapsible in dev) */}
				{process.env.NODE_ENV === "development" && error?.stack && (
					<details className="mb-6 text-left bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-sm animate-fade-in-up animation-delay-600">
						<summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
							Error Details
						</summary>
						<pre className="mt-2 overflow-auto text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
							{error.stack}
						</pre>
					</details>
				)}

				{/* Action buttons */}
				<div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up animation-delay-700">
					<Button
						onClick={reset ? handleReset : handleGoBack}
						className="bg-linear-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
					>
						{reset ? "Try Again" : "Go Back"}
					</Button>
					<Button variant="outline" asChild className="py-3 px-6 rounded-xl">
						<Link to="/">Go Home</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
