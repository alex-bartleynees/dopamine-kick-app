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
import { getAntiforgeryTokenFn, getCurrentUserFn } from "@/server/auth";
import type { User } from "@/types/auth";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles/index.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	initialUser?: User | null;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		const initialUser = await getCurrentUserFn();
		const csrfToken = await getAntiforgeryTokenFn();
		return { initialUser, csrfToken: csrfToken.requestToken };
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
	const { initialUser, csrfToken } = Route.useRouteContext();
	return (
		<AuthProvider initialUser={initialUser} csrfToken={csrfToken}>
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
