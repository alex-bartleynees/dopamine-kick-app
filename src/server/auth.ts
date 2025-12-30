import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import {
	BACKEND_URL,
	forwardResponseCookies,
	getProxyHeaders,
} from "../lib/proxy-utils";
import type { User } from "../types/auth";

interface AntiforgeryResponse {
	requestToken: string;
}

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<User | null> => {
		const request = getRequest();

		const response = await fetch(`${BACKEND_URL}/bff/user`, {
			method: "GET",
			headers: getProxyHeaders(request),
			redirect: "manual",
		});

		if (response.ok) {
			return (await response.json()) as User;
		}

		return null;
	},
);

export const getAntiforgeryTokenFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<AntiforgeryResponse> => {
		const request = getRequest();

		const response = await fetch(`${BACKEND_URL}/bff/antiforgery`, {
			method: "GET",
			headers: getProxyHeaders(request),
		});

		if (response.ok) {
			forwardResponseCookies(response);
			return (await response.json()) as AntiforgeryResponse;
		}

		throw new Error("Failed to fetch antiforgery token");
	},
);

export const logoutFn = createServerFn({ method: "POST" })
	.inputValidator((d: string) => d)
	.handler(async ({ data: csrfToken }): Promise<void> => {
		const request = getRequest();

		const response = await fetch(`${BACKEND_URL}/bff/logout`, {
			method: "POST",
			headers: {
				...getProxyHeaders(request),
				"X-CSRF-TOKEN": csrfToken,
			},
		});

		if (response.ok) {
			forwardResponseCookies(response);
			return;
		}

		throw new Error("Failed to logout");
	});
