import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { BACKEND_URL, getProxyHeaders } from "../lib/proxy-utils";
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
			return (await response.json()) as AntiforgeryResponse;
		}

		throw new Error("Failed to fetch antiforgery token");
	},
);
