import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { AuthProvider } from "@/providers/AuthProvider";
import { getAuthenticatedStateFn } from "@/server/auth";
import type { UserState } from "@/types/user";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles/index.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	userState?: UserState | null;
	csrfToken?: string;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		const authState = await getAuthenticatedStateFn();
		return authState ?? {};
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Dopamine Kick",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootComponent() {
	const { userState, csrfToken } = Route.useRouteContext();
	return (
		<AuthProvider userState={userState} csrfToken={csrfToken}>
			<AuthenticatedOutlet />
		</AuthProvider>
	);
}

function AuthenticatedOutlet() {
	return (
		<main id="app">
			<Outlet />
		</main>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
