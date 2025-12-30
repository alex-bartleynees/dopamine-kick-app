import { useRouter } from "@tanstack/react-router";
import { createContext, use, type PropsWithChildren } from "react";
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

	function setTheme(value: Theme) {
		setThemeServerFn({ data: value }).then(() => router.invalidate());
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
