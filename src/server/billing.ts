import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
	billingRedirectSchema,
	NO_SUBSCRIPTION,
	type SubscriptionState,
	subscriptionStateSchema,
} from "@/schemas/billing";
import { BACKEND_URL, getProxyHeaders } from "../lib/proxy-utils";

const BILLING_BASE = `${BACKEND_URL}/api/billing`;

/**
 * Read the caller's subscription state. Always resolves — a brand-new user
 * gets `status: "none"`. On a backend/network failure we fail closed to
 * "no subscription" so the route gate sends the user to pricing rather than
 * crashing app entry.
 */
export const getSubscriptionFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<SubscriptionState> => {
		const request = getRequest();
		try {
			const response = await fetch(`${BILLING_BASE}/subscription`, {
				method: "GET",
				headers: getProxyHeaders(request),
			});
			if (response.ok) {
				const data = await response.json();
				return subscriptionStateSchema.parse(data);
			}
		} catch {
			return NO_SUBSCRIPTION;
		}

		return NO_SUBSCRIPTION;
	},
);

/**
 * Start a Stripe Checkout session and return its hosted URL. Ensures the
 * Stripe customer exists on first call. Redirect the browser to `url`.
 */
export const startCheckoutFn = createServerFn({ method: "POST" })
	.inputValidator((d: { csrfToken: string }) =>
		z.object({ csrfToken: z.string() }).parse(d),
	)
	.handler(async ({ data }): Promise<string> => {
		const request = getRequest();
		const response = await fetch(`${BILLING_BASE}/checkout`, {
			method: "POST",
			headers: {
				...getProxyHeaders(request),
				"Content-Type": "application/json",
				"X-CSRF-TOKEN": data.csrfToken,
			},
		});

		if (response.ok) {
			const result = await response.json();
			return billingRedirectSchema.parse(result).url;
		}

		throw new Error("Failed to start checkout");
	});

/**
 * Open the Stripe Billing Portal for the caller (manage / cancel / update card).
 * Returns the hosted URL, or `null` when the user has no Stripe customer yet
 * (404 `Payments.NoCustomer`) — the caller should route to pricing instead.
 */
export const openBillingPortalFn = createServerFn({ method: "POST" })
	.inputValidator((d: { csrfToken: string }) =>
		z.object({ csrfToken: z.string() }).parse(d),
	)
	.handler(async ({ data }): Promise<string | null> => {
		const request = getRequest();
		const response = await fetch(`${BILLING_BASE}/portal`, {
			method: "POST",
			headers: {
				...getProxyHeaders(request),
				"Content-Type": "application/json",
				"X-CSRF-TOKEN": data.csrfToken,
			},
		});

		if (response.ok) {
			const result = await response.json();
			return billingRedirectSchema.parse(result).url;
		}
		if (response.status === 404) {
			return null;
		}

		throw new Error("Failed to open billing portal");
	});

/**
 * Force an immediate re-sync of the caller's subscription from Stripe. Called by
 * the `/success` route before reading state, to close the webhook race.
 * Returns `false` when there is no Stripe customer (404 `Payments.NoCustomer`).
 */
export const syncSubscriptionFn = createServerFn({ method: "POST" })
	.inputValidator((d: { csrfToken: string }) =>
		z.object({ csrfToken: z.string() }).parse(d),
	)
	.handler(async ({ data }): Promise<boolean> => {
		const request = getRequest();
		const response = await fetch(`${BILLING_BASE}/sync`, {
			method: "POST",
			headers: {
				...getProxyHeaders(request),
				"Content-Type": "application/json",
				"X-CSRF-TOKEN": data.csrfToken,
			},
		});

		if (response.ok) {
			return true;
		}
		if (response.status === 404) {
			return false;
		}

		throw new Error("Failed to sync subscription");
	});
