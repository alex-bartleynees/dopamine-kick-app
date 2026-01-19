import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, use, useEffect, type PropsWithChildren } from "react";
import { setThemeServerFn, type Theme } from "@/lib/theme";

type ThemeContextValue = {
	theme: Theme;
	setTheme: (value: Theme) => void;
	toggleTheme: () => void;
};

type ThemeProviderProps = PropsWithChildren<{ theme: Theme }>;

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
	const router = useRouter();
	const queryClient = useQueryClient();

	useEffect(() => {
		const hasCookie = document.cookie.includes("_preferred-theme=");
		if (hasCookie) return;

		// Sync React state with DOM if inline script applied system preference
		const isDarkClass = document.documentElement.classList.contains("dark");
		const detectedTheme = isDarkClass ? "dark" : "light";

		// Persist system preference to cookie
		setThemeServerFn({ data: detectedTheme }).then(() => {
			if (isDarkClass && theme === "light") {
				queryClient.setQueryData(["theme"], "dark");
				router.invalidate();
			}
		});
	}, [queryClient, router, theme]);

	function setTheme(value: Theme) {
		queryClient.setQueryData(["theme"], value);
		setThemeServerFn({ data: value }).then(() => {
			router.invalidate();
		});
	}

	function toggleTheme() {
		setTheme(theme === "light" ? "dark" : "light");
	}

	return (
		<ThemeContext value={{ theme, setTheme, toggleTheme }}>
			{children}
		</ThemeContext>
	);
}

export function useTheme() {
	const value = use(ThemeContext);
	if (!value) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return value;
}
