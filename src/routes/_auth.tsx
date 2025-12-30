import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
	beforeLoad: ({ context }) => {
		if (!context.userState?.isAuthenticated) {
			throw redirect({
				to: "/",
			});
		}
	},
});
