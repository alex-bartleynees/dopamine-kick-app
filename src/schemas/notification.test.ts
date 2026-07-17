import { describe, expect, it } from "vitest";
import {
	createPushSubscriptionSchema,
	pushSubscriptionSchema,
	vapidPublicKeyResponseSchema,
} from "./notification";

describe("pushSubscriptionSchema", () => {
	const valid = {
		endpoint: "https://push.example.com/abc",
		keys: { p256dh: "key", auth: "secret" },
	};

	it("parses a valid subscription", () => {
		expect(pushSubscriptionSchema.parse(valid)).toMatchObject(valid);
	});

	it("accepts a nullable expirationTime", () => {
		expect(
			pushSubscriptionSchema.safeParse({ ...valid, expirationTime: null })
				.success,
		).toBe(true);
		expect(
			pushSubscriptionSchema.safeParse({ ...valid, expirationTime: 123456 })
				.success,
		).toBe(true);
	});

	it("rejects a non-URL endpoint", () => {
		expect(
			pushSubscriptionSchema.safeParse({ ...valid, endpoint: "not-a-url" })
				.success,
		).toBe(false);
	});

	it("rejects a subscription missing keys", () => {
		expect(
			pushSubscriptionSchema.safeParse({ endpoint: valid.endpoint }).success,
		).toBe(false);
	});
});

describe("createPushSubscriptionSchema", () => {
	it("parses a flattened creation DTO", () => {
		const input = {
			endpoint: "https://push.example.com/abc",
			p256dh: "key",
			auth: "secret",
		};
		expect(createPushSubscriptionSchema.parse(input)).toMatchObject(input);
	});

	it("rejects a missing auth key", () => {
		expect(
			createPushSubscriptionSchema.safeParse({
				endpoint: "https://push.example.com/abc",
				p256dh: "key",
			}).success,
		).toBe(false);
	});
});

describe("vapidPublicKeyResponseSchema", () => {
	it("parses a public key response", () => {
		expect(vapidPublicKeyResponseSchema.parse({ publicKey: "pk" })).toEqual({
			publicKey: "pk",
		});
	});

	it("rejects a missing public key", () => {
		expect(vapidPublicKeyResponseSchema.safeParse({}).success).toBe(false);
	});
});
