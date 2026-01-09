import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
	type CreatePushSubscriptionDto,
	createPushSubscriptionSchema,
	type VapidPublicKeyResponse,
	vapidPublicKeyResponseSchema,
} from "@/schemas/notification";
import { BACKEND_URL, getProxyHeaders } from "../lib/proxy-utils";

// Get VAPID public key (anonymous, no auth required)
export const getVapidPublicKeyFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<VapidPublicKeyResponse> => {
		const request = getRequest();
		const response = await fetch(
			`${BACKEND_URL}/api/notifications/vapid-public-key`,
			{
				method: "GET",
				headers: getProxyHeaders(request),
			},
		);

		if (response.ok) {
			const data = await response.json();
			return vapidPublicKeyResponseSchema.parse(data);
		}

		throw new Error("Failed to fetch VAPID public key");
	},
);

// Create push subscription (requires auth)
type CreatePushSubscriptionInput = CreatePushSubscriptionDto & {
	csrfToken: string;
};

export const createPushSubscriptionFn = createServerFn({ method: "POST" })
	.inputValidator((d: CreatePushSubscriptionInput) =>
		createPushSubscriptionSchema.extend({ csrfToken: z.string() }).parse(d),
	)
	.handler(
		async ({ data }: { data: CreatePushSubscriptionInput }): Promise<void> => {
			const request = getRequest();
			const { csrfToken, ...subscriptionData } = data;

			const response = await fetch(
				`${BACKEND_URL}/api/notifications/subscriptions`,
				{
					method: "POST",
					headers: {
						...getProxyHeaders(request),
						"Content-Type": "application/json",
						"X-CSRF-TOKEN": csrfToken,
					},
					body: JSON.stringify(subscriptionData),
				},
			);

			if (response.ok) {
				return;
			}

			if (response.status === 409) {
				// Subscription already exists, treat as success
				return;
			}

			throw new Error("Failed to create push subscription");
		},
	);
