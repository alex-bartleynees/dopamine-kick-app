import { createFileRoute, redirect } from "@tanstack/react-router";
import { LandingScreen } from "@/components/landing";

export const Route = createFileRoute("/login")({
	component: Login,
	beforeLoad: async ({ context }) => {
		if (
			context?.userState?.isAuthenticated &&
			context.userState.currentUser?.id
		) {
			throw redirect({ to: "/dashboard" });
		}
	},
});

function Login() {
	return <LandingScreen mode="login" />;
}
