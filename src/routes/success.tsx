import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Clock, PartyPopper } from "lucide-react";
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
		// Authoritative re-sync from Stripe before we read state — closes the race
		// where the browser returns before Stripe's webhook does.
		await syncSubscriptionFn({ data: { csrfToken: context.csrfToken ?? "" } });
		const subscription = await getSubscriptionFn();
		// Seed the cache the `_auth` gate reads, so navigating into the app after
		// a successful checkout doesn't bounce back to pricing.
		context.queryClient.setQueryData(["subscription"], subscription);
		return { status: subscription.status };
	},
	component: Success,
});

function Success() {
	const { status } = Route.useLoaderData();
	const { csrfToken } = useAuth();
	const navigate = useNavigate();
	const { toast } = useToast();

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
