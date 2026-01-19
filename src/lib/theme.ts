import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import * as z from "zod";

const themeValidator = z.union([z.literal("light"), z.literal("dark")]);
export type Theme = z.infer<typeof themeValidator>;

const THEME_COOKIE_KEY = "_preferred-theme";
const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60; // 31536000 seconds

const THEME_COOKIE_OPTIONS = {
	maxAge: ONE_YEAR_IN_SECONDS,
	path: "/",
	sameSite: "lax" as const,
};

export const getThemeServerFn = createServerFn().handler(async () => {
	const existingTheme = getCookie(THEME_COOKIE_KEY) as Theme | undefined;
	if (existingTheme) {
		// Refresh cookie expiration on read (sliding window)
		setCookie(THEME_COOKIE_KEY, existingTheme, THEME_COOKIE_OPTIONS);
		return existingTheme;
	}
	return "light";
});

export const setThemeServerFn = createServerFn({ method: "POST" })
	.inputValidator(themeValidator)
	.handler(async ({ data }) =>
		setCookie(THEME_COOKIE_KEY, data, THEME_COOKIE_OPTIONS),
	);
