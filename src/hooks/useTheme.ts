import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

export function useTheme() {
	const [theme, setTheme] = useState<Theme>("light");

	useEffect(() => {
		const saved = localStorage.getItem("theme") as Theme | null;
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;

		const initialTheme = saved ?? (prefersDark ? "dark" : "light");
		setTheme(initialTheme);
		document.documentElement.classList.toggle("dark", initialTheme === "dark");
	}, []);

	const toggleTheme = useCallback(() => {
		setTheme((prev) => {
			const next = prev === "light" ? "dark" : "light";
			localStorage.setItem("theme", next);
			document.documentElement.classList.toggle("dark", next === "dark");
			return next;
		});
	}, []);

	return { theme, toggleTheme };
}
