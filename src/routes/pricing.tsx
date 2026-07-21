import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Check, Flame } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { hasSubscriptionAccess } from "@/schemas/billing";
import { getSubscriptionFn, startCheckoutFn } from "@/server/billing";

export const Route = createFileRoute("/pricing")({
	beforeLoad: ({ context }) => {
		if (!context.userState?.isAuthenticated) {
			throw redirect({ to: "/" });
		}
	},
	loader: async () => {
		const subscription = await getSubscriptionFn();
		return { hasAccess: hasSubscriptionAccess(subscription.status) };
	},
	component: Pricing,
});

const PERKS = [
	"Unlimited habits and streaks",
	"One-off quests with reminders",
	"Push notifications that keep you on track",
	"Every future feature, included",
];

function Pricing() {
	const { hasAccess } = Route.useLoaderData();
	const { csrfToken } = useAuth();
	const navigate = useNavigate();
	const { toast } = useToast();

	const checkoutMutation = useMutation({
		mutationFn: async () => startCheckoutFn({ data: { csrfToken } }),
		onSuccess: (url) => {
			// Hand the browser to Stripe's hosted checkout.
			window.location.href = url;
		},
		onError: () => {
			toast("Couldn't start checkout. Please try again.", "error");
		},
	});

	return (
		<PageShell center className="px-6 py-12">
			<div className="max-w-md w-full text-center animate-fade-in-up">
				<div className="flex items-center justify-center gap-2 mb-8 animate-fade-in">
					<div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
						<Flame className="w-5 h-5 text-white" />
					</div>
					<span className="text-xl font-bold gradient-text">Dopamine Kick</span>
				</div>

				{hasAccess ? (
					<>
						<h1 className="text-3xl font-bold mb-3">You're all set 🎉</h1>
						<p className="mb-8 text-muted-foreground">
							Your membership is active. Jump back in and keep the streak going.
						</p>
						<Button
							variant="gradient"
							size="xl"
							onClick={() => navigate({ to: "/dashboard" })}
							className="w-full"
						>
							Go to your dashboard
						</Button>
					</>
				) : (
					<>
						<h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
							Unlock <span className="gradient-text">Dopamine Kick</span>
						</h1>
						<p className="mb-8 text-muted-foreground text-balance">
							Start your free trial and build habits that actually stick. Cancel
							anytime.
						</p>

						<ul className="text-left space-y-3 mb-8 max-w-sm mx-auto">
							{PERKS.map((perk) => (
								<li key={perk} className="flex items-start gap-3">
									<span className="mt-0.5 flex-none w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
										<Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
									</span>
									<span className="text-card-foreground">{perk}</span>
								</li>
							))}
						</ul>

						<Button
							variant="gradient"
							size="xl"
							onClick={() => checkoutMutation.mutate()}
							disabled={checkoutMutation.isPending}
							className="w-full"
						>
							{checkoutMutation.isPending
								? "Starting checkout…"
								: "Start free trial"}
						</Button>
						<p className="mt-4 text-sm text-muted-foreground">
							You'll be redirected to Stripe to complete signup securely.
						</p>
					</>
				)}
			</div>
		</PageShell>
	);
}
