import { createFileRoute, redirect } from "@tanstack/react-router";
import { hasSubscriptionAccess } from "@/schemas/billing";
import { getSubscriptionFn } from "@/server/billing";

export const Route = createFileRoute("/_auth")({
	beforeLoad: async ({ context }) => {
		if (!context.userState?.isAuthenticated) {
			throw redirect({
				to: "/",
			});
		}

		// Gate app entry on subscription status (not on the auth session): a
		// logged-in user with no valid membership is expected — route them to
		// pricing. `/pricing`, `/success` and `/account` sit outside this layout
		// so they stay reachable without a subscription.
		const subscription = await context.queryClient.ensureQueryData({
			queryKey: ["subscription"],
			queryFn: () => getSubscriptionFn(),
			staleTime: 30_000,
		});

		if (!hasSubscriptionAccess(subscription.status)) {
			throw redirect({
				to: "/pricing",
			});
		}
	},
});
