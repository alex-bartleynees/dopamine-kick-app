import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { type BffUserResponse, getClaimValue } from "@/types/auth";
import type { UserState } from "@/types/user";
import {
	BACKEND_URL,
	forwardResponseCookies,
	getProxyHeaders,
} from "../lib/proxy-utils";
import { getCurrentUserFn } from "./users";

const bffClaimSchema = z.object({
	type: z.string(),
	value: z.string(),
});

const bffUserResponseSchema = z.object({
	isAuthenticated: z.boolean(),
	claims: z.array(bffClaimSchema),
});

const antiforgeryResponseSchema = z.object({
	requestToken: z.string(),
});

export const getUserInfoFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<BffUserResponse | null> => {
		const request = getRequest();
		try {
			const response = await fetch(`${BACKEND_URL}/bff/user`, {
				method: "GET",
				headers: getProxyHeaders(request),
				redirect: "manual",
			});
			if (response.ok) {
				const data = await response.json();
				return bffUserResponseSchema.parse(data);
			}
		} catch {
			return null;
		}

		return null;
	},
);

export type AntiforgeryResponse = z.infer<typeof antiforgeryResponseSchema>;

export const getAntiforgeryTokenFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<AntiforgeryResponse> => {
		const request = getRequest();
		try {
			const response = await fetch(`${BACKEND_URL}/bff/antiforgery`, {
				method: "GET",
				headers: getProxyHeaders(request),
			});
			if (response.ok) {
				forwardResponseCookies(response);
				const data = await response.json();
				return antiforgeryResponseSchema.parse(data);
			}
		} catch {
			return { requestToken: "" };
		}

		return { requestToken: "" };
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
			redirect: "manual",
		});

		// BFF logout returns a redirect (302/303) on success
		if (response.ok || response.status === 302 || response.status === 303) {
			forwardResponseCookies(response);
			return;
		}

		throw new Error("Failed to logout");
	});

export interface AuthenticatedState {
	userState: UserState;
	csrfToken: string;
}

export const getAuthenticatedStateFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<AuthenticatedState | null> => {
	const userInfo = await getUserInfoFn();
	if (userInfo?.isAuthenticated) {
		const sub = getClaimValue(userInfo, "sub");
		if (!sub) {
			throw new Error("User is missing 'sub' claim");
		}
		const currentUser = await getCurrentUserFn({ data: sub });
		const csrfToken = await getAntiforgeryTokenFn();
		return {
			userState: { isAuthenticated: true, currentUser },
			csrfToken: csrfToken.requestToken,
		};
	}
	return null;
});
