import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CreditCard } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { getLocaleFn } from "@/lib/locale";
import {
	hasSubscriptionAccess,
	needsPaymentAttention,
} from "@/schemas/billing";
import { getSubscriptionFn, openBillingPortalFn } from "@/server/billing";

export const Route = createFileRoute("/account")({
	beforeLoad: ({ context }) => {
		if (!context.userState?.isAuthenticated) {
			throw redirect({ to: "/" });
		}
	},
	loader: async ({ context }) => {
		// Re-read fresh: the user may land here returning from the Stripe portal,
		// where they just cancelled / resumed / changed card.
		const [subscription, locale] = await Promise.all([
			getSubscriptionFn(),
			getLocaleFn(),
		]);
		context.queryClient.setQueryData(["subscription"], subscription);
		return { subscription, locale };
	},
	component: Account,
});

const STATUS_LABELS: Record<string, string> = {
	trialing: "Free trial",
	active: "Active",
	past_due: "Payment past due",
	canceled: "Canceled",
	incomplete: "Incomplete",
	incomplete_expired: "Expired",
	unpaid: "Unpaid",
	paused: "Paused",
	none: "No membership",
};

function formatDate(value: string | null | undefined, locale: string): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString(locale, {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function Account() {
	const { subscription, locale } = Route.useLoaderData();
	const { csrfToken } = useAuth();
	const navigate = useNavigate();
	const { toast } = useToast();

	const hasAccess = hasSubscriptionAccess(subscription.status);

	const portalMutation = useMutation({
		mutationFn: async () => openBillingPortalFn({ data: { csrfToken } }),
		onSuccess: (url) => {
			if (url) {
				window.location.href = url;
			} else {
				// No Stripe customer yet — nothing to manage.
				navigate({ to: "/pricing" });
			}
		},
		onError: () => {
			toast("Couldn't open the billing portal. Please try again.", "error");
		},
	});

	return (
		<PageShell>
			<header className="bg-card shadow-sm">
				<div className="max-w-2xl mx-auto px-6 py-6">
					<BackButton
						onClick={() => navigate({ to: "/dashboard" })}
						className="mb-4"
					/>
					<h1 className="mb-1 text-card-foreground">Membership</h1>
					<p className="text-muted-foreground">
						Manage your subscription and payment method
					</p>
				</div>
			</header>

			<section className="max-w-2xl mx-auto px-6 py-8 space-y-6">
				{needsPaymentAttention(subscription.status) && (
					<div className="flex items-start gap-3 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-4">
						<AlertTriangle className="w-5 h-5 flex-none text-amber-600 dark:text-amber-400 mt-0.5" />
						<div className="text-sm">
							<p className="font-semibold text-amber-800 dark:text-amber-200">
								Update your payment method
							</p>
							<p className="text-amber-700 dark:text-amber-300">
								Your last payment didn't go through. Update your card to keep
								your membership active.
							</p>
						</div>
					</div>
				)}

				<div className="rounded-2xl bg-card border border-border p-6 space-y-4">
					<SummaryRow
						label="Status"
						value={STATUS_LABELS[subscription.status] ?? subscription.status}
					/>
					{subscription.cancelAtPeriodEnd ? (
						<SummaryRow
							label="Access until"
							value={formatDate(subscription.currentPeriodEnd, locale)}
							hint="Your subscription is set to cancel at the end of this period."
						/>
					) : (
						hasAccess && (
							<SummaryRow
								label="Renews on"
								value={formatDate(subscription.currentPeriodEnd, locale)}
							/>
						)
					)}
					<SummaryRow
						label="Payment method"
						value={
							subscription.paymentMethodLast4
								? `${subscription.paymentMethodBrand ?? "Card"} ···· ${subscription.paymentMethodLast4}`
								: "None on file"
						}
					/>
				</div>

				{hasAccess ? (
					<Button
						variant="outline"
						size="xl"
						onClick={() => portalMutation.mutate()}
						disabled={portalMutation.isPending}
						className="w-full"
					>
						<CreditCard className="size-5" />
						{portalMutation.isPending ? "Opening…" : "Manage subscription"}
					</Button>
				) : (
					<Button
						variant="gradient"
						size="xl"
						onClick={() => navigate({ to: "/pricing" })}
						className="w-full"
					>
						{subscription.status === "canceled"
							? "Reactivate membership"
							: "Subscribe"}
					</Button>
				)}
			</section>
		</PageShell>
	);
}

function SummaryRow({
	label,
	value,
	hint,
}: {
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<div className="flex items-start justify-between gap-4">
			<span className="text-muted-foreground">{label}</span>
			<span className="text-right text-card-foreground font-medium">
				{value}
				{hint && (
					<span className="block text-sm font-normal text-muted-foreground mt-1">
						{hint}
					</span>
				)}
			</span>
		</div>
	);
}
