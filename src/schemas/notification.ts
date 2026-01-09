import { z } from "zod";

export const pushSubscriptionKeysSchema = z.object({
	p256dh: z.string(),
	auth: z.string(),
});

export const pushSubscriptionSchema = z.object({
	endpoint: z.url(),
	expirationTime: z.number().nullable().optional(),
	keys: pushSubscriptionKeysSchema,
});

export const createPushSubscriptionSchema = z.object({
	endpoint: z.url(),
	p256dh: z.string(),
	auth: z.string(),
	expirationTime: z.number().nullable().optional(),
});

export const vapidPublicKeyResponseSchema = z.object({
	publicKey: z.string(),
});

export type PushSubscriptionKeys = z.infer<typeof pushSubscriptionKeysSchema>;
export type PushSubscription = z.infer<typeof pushSubscriptionSchema>;
export type CreatePushSubscriptionDto = z.infer<
	typeof createPushSubscriptionSchema
>;
export type VapidPublicKeyResponse = z.infer<
	typeof vapidPublicKeyResponseSchema
>;
