import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";

export function ReloadPrompt() {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW();

	const close = () => {
		setOfflineReady(false);
		setNeedRefresh(false);
	};

	if (!offlineReady && !needRefresh) return null;

	return (
		<div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 sm:max-w-2xl sm:w-full">
			<div className="rounded-lg border border-border bg-card px-4 py-3 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
				<span className="text-sm text-card-foreground flex-1">
					{offlineReady ? "App ready to work offline" : "New content available"}
				</span>
				<div className="flex items-center gap-2 w-full sm:w-auto">
					{needRefresh && (
						<Button
							size="sm"
							onClick={() => updateServiceWorker(true)}
							className="flex-1 sm:flex-none"
						>
							Reload
						</Button>
					)}
					<Button
						size="sm"
						variant="outline"
						onClick={close}
						className="flex-1 sm:flex-none"
					>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
