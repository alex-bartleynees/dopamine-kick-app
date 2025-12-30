import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import * as z from "zod";

const themeValidator = z.union([z.literal("light"), z.literal("dark")]);
export type Theme = z.infer<typeof themeValidator>;

const THEME_COOKIE_KEY = "_preferred-theme";

export const getThemeServerFn = createServerFn().handler(
	async () => (getCookie(THEME_COOKIE_KEY) || "light") as Theme,
);

export const setThemeServerFn = createServerFn({ method: "POST" })
	.inputValidator(themeValidator)
	.handler(async ({ data }) => setCookie(THEME_COOKIE_KEY, data));
