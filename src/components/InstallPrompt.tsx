import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isIOS, setIsIOS] = useState(false);
	const [isStandalone, setIsStandalone] = useState(false);
	const [isDismissed, setIsDismissed] = useState(false);

	useEffect(() => {
		// Check if app is already installed
		setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

		// Check if iOS device
		setIsIOS(
			/iPad|iPhone|iPod/.test(navigator.userAgent) &&
				!(window as unknown as { MSStream?: unknown }).MSStream,
		);

		// Check if user has dismissed the prompt before
		const dismissed = localStorage.getItem("pwa-install-dismissed");
		if (dismissed === "true") {
			setIsDismissed(true);
		}

		// Listen for beforeinstallprompt event (Android/Chrome)
		const handleBeforeInstallPrompt = (e: Event) => {
			// Prevent the mini-infobar from appearing on mobile
			e.preventDefault();
			// Store the event so it can be triggered later
			setDeferredPrompt(e as BeforeInstallPromptEvent);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
		};
	}, []);

	const handleInstall = async () => {
		if (!deferredPrompt) return;

		// Show the install prompt
		await deferredPrompt.prompt();

		// Wait for the user to respond to the prompt
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			console.log("User accepted the install prompt");
		} else {
			console.log("User dismissed the install prompt");
		}

		// Clear the deferredPrompt so it can only be used once
		setDeferredPrompt(null);
	};

	const handleDismiss = () => {
		localStorage.setItem("pwa-install-dismissed", "true");
		setIsDismissed(true);
	};

	// Don't show if app is already installed, user dismissed it, or neither condition applies
	if (isStandalone || isDismissed) return null;

	// Don't show if neither iOS nor Android install is available
	if (!isIOS && !deferredPrompt) return null;

	return (
		<div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 sm:max-w-2xl sm:w-full animate-slide-up">
			<div className="rounded-lg border border-border bg-card px-4 py-3 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
				<div className="flex-1">
					{isIOS ? (
						<p className="text-sm text-card-foreground">
							To install, tap{" "}
							<span role="img" aria-label="share icon">
								⎋
							</span>{" "}
							then "Add to Home Screen"{" "}
							<span role="img" aria-label="plus icon">
								➕
							</span>
						</p>
					) : (
						<p className="text-sm text-card-foreground">
							Install this app for quick access and offline use
						</p>
					)}
				</div>
				<div className="flex items-center gap-2 w-full sm:w-auto">
					{deferredPrompt && (
						<Button
							size="sm"
							onClick={handleInstall}
							className="flex-1 sm:flex-none"
						>
							Install
						</Button>
					)}
					<Button
						size="sm"
						variant="outline"
						onClick={handleDismiss}
						className="flex-1 sm:flex-none"
					>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
