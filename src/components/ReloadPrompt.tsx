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
		<div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
			<span className="text-sm text-card-foreground">
				{offlineReady ? "App ready to work offline" : "New content available"}
			</span>
			<div className="flex items-center gap-2">
				{needRefresh && (
					<Button size="sm" onClick={() => updateServiceWorker(true)}>
						Reload
					</Button>
				)}
				<Button size="sm" variant="outline" onClick={close}>
					Close
				</Button>
			</div>
		</div>
	);
}
