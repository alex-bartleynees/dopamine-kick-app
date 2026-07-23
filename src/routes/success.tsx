import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Clock, Loader2, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import {
	hasSubscriptionAccess,
	type SubscriptionStatus,
} from "@/schemas/billing";
import {
	getSubscriptionFn,
	openBillingPortalFn,
	syncSubscriptionFn,
} from "@/server/billing";

export const Route = createFileRoute("/success")({
	beforeLoad: ({ context }) => {
		if (!context.userState?.isAuthenticated) {
			throw redirect({ to: "/" });
		}
	},
	loader: async ({ context }) => {
		const subscription = await getSubscriptionFn();
		// Seed the cache the `_auth` gate reads, so navigating into the app after
		// a successful checkout doesn't bounce back to pricing.
		context.queryClient.setQueryData(["subscription"], subscription);
		return { status: subscription.status };
	},
	component: Success,
});

function Success() {
	const { status: loadedStatus } = Route.useLoaderData();
	const { csrfToken } = useAuth();
	const navigate = useNavigate();
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [status, setStatus] = useState(loadedStatus);
	const [isSyncing, setIsSyncing] = useState(true);

	// biome-ignore lint/correctness/useExhaustiveDependencies: should only run once on mount, not on every status change
	useEffect(() => {
		let cancelled = false;

		// Authoritative re-sync from Stripe, closing the race where the browser
		// returns before Stripe's webhook does. Runs client-side (not in the route
		// loader) because the antiforgery cookie the BFF needs may have only just
		// been minted on this very page load's response — a server-rendered POST
		// in the same pass would race it. Firing from an effect guarantees the
		// browser has already round-tripped and stored that cookie first.
		(async () => {
			try {
				await syncSubscriptionFn({ data: { csrfToken } });
				const subscription = await getSubscriptionFn();
				if (cancelled) {
					return;
				}
				queryClient.setQueryData(["subscription"], subscription);
				setStatus(subscription.status);
			} catch {
				// Leave the pre-sync status in place; the portal/back-to-pricing
				// actions below still give the user a way forward.
			} finally {
				if (!cancelled) {
					setIsSyncing(false);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	const portalMutation = useMutation({
		mutationFn: async () => openBillingPortalFn({ data: { csrfToken } }),
		onSuccess: (url) => {
			if (url) {
				window.location.href = url;
			} else {
				navigate({ to: "/pricing" });
			}
		},
		onError: () => {
			toast("Couldn't open the billing portal. Please try again.", "error");
		},
	});

	// Don't flash "Almost there" while the authoritative Stripe re-sync above
	// is still in flight — the pre-sync loader status is frequently stale
	// (webhook hasn't landed yet) and flips to active a moment later.
	if (isSyncing && !hasSubscriptionAccess(status)) {
		return (
			<PageShell center className="px-6 py-12">
				<div className="max-w-md w-full text-center animate-fade-in-up">
					<div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-linear-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-2xl animate-scale-in">
						<Loader2 className="w-10 h-10 text-white animate-spin" />
					</div>
					<h1 className="text-2xl font-bold mb-3">Confirming your payment</h1>
					<p className="text-muted-foreground text-balance">
						Just a moment while we finish setting things up.
					</p>
				</div>
			</PageShell>
		);
	}

	if (hasSubscriptionAccess(status)) {
		return (
			<PageShell center className="px-6 py-12">
				<div className="max-w-md w-full text-center animate-fade-in-up">
					<div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-linear-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-2xl animate-scale-in">
						<PartyPopper className="w-10 h-10 text-white" />
					</div>
					<h1 className="text-3xl font-bold mb-3">You're in! 🎉</h1>
					<p className="mb-8 text-muted-foreground text-balance">
						Your membership is active. Let's build some streaks.
					</p>
					<Button
						variant="gradient"
						size="xl"
						onClick={() => navigate({ to: "/dashboard" })}
						className="w-full"
					>
						Go to your dashboard
					</Button>
				</div>
			</PageShell>
		);
	}

	// Payment may still be processing (async methods) or need SCA/3DS — a
	// non-active landing here is legitimate. Don't assume success.
	return (
		<PageShell center className="px-6 py-12">
			<div className="max-w-md w-full text-center animate-fade-in-up">
				<div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center animate-scale-in">
					<Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
				</div>
				<h1 className="text-2xl font-bold mb-3">Almost there</h1>
				<p className="mb-8 text-muted-foreground text-balance">
					{isPending(status)
						? "Your payment is still processing. This can take a moment — check back shortly, or finish any required steps."
						: "We couldn't confirm your membership yet. If a payment step is outstanding, you can complete it now."}
				</p>
				<div className="space-y-3">
					<Button
						variant="gradient"
						size="xl"
						onClick={() => portalMutation.mutate()}
						disabled={portalMutation.isPending}
						className="w-full"
					>
						{portalMutation.isPending ? "Opening…" : "Complete payment"}
					</Button>
					<Button
						variant="outline"
						size="xl"
						onClick={() => navigate({ to: "/pricing" })}
						className="w-full"
					>
						Back to pricing
					</Button>
				</div>
			</div>
		</PageShell>
	);
}

function isPending(status: SubscriptionStatus): boolean {
	return status === "incomplete" || status === "past_due";
}
