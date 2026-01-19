import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	ScriptOnce,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ReloadPrompt } from "@/components/ReloadPrompt";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getThemeServerFn } from "@/lib/theme";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import type { UserState } from "@/schemas/user";
import { getAuthenticatedStateFn } from "@/server/auth";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles/index.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	userState?: UserState | null;
	csrfToken?: string;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async ({ context: { queryClient } }) =>
		queryClient.ensureQueryData({
			queryKey: ["authState"],
			queryFn: async () => {
				const authState = await getAuthenticatedStateFn();
				if (!authState) {
					return { userState: null, csrfToken: "" };
				}
				return authState;
			},
			staleTime: Number.POSITIVE_INFINITY, // Never refetch automatically
		}),
	loader: async ({ context: { queryClient } }) =>
		queryClient.ensureQueryData({
			queryKey: ["theme"],
			queryFn: () => getThemeServerFn(),
			staleTime: Number.POSITIVE_INFINITY, // Never refetch automatically
		}),
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
			{
				rel: "manifest",
				href: "/manifest.webmanifest",
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
			<ThemeToggle />
			<Outlet />
		</main>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	const theme = Route.useLoaderData();
	return (
		<html lang="en" className={theme === "dark" ? "dark" : ""}>
			<head>
				<HeadContent />
				<ScriptOnce>
					{`if (!document.cookie.includes('_preferred-theme=') &&
						window.matchMedia('(prefers-color-scheme: dark)').matches) {
						document.documentElement.classList.add('dark');
					}`}
				</ScriptOnce>
			</head>
			<body>
				<ThemeProvider theme={theme}>{children}</ThemeProvider>
				<ReloadPrompt />
				<InstallPrompt />
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
