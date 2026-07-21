import { z } from "zod";

/**
 * Stripe subscription status, mirrored from the backend read model.
 * `none` is our own value for a user who has never created a subscription.
 * Any unrecognised value falls back to `none` (fail-closed → no access).
 */
export const subscriptionStatusSchema = z
	.enum([
		"none",
		"trialing",
		"active",
		"past_due",
		"canceled",
		"incomplete",
		"incomplete_expired",
		"unpaid",
		"paused",
	])
	.catch("none");

/** The read model backing the account/pricing pages. `GET /api/billing/subscription`. */
export const subscriptionStateSchema = z.object({
	status: subscriptionStatusSchema,
	priceId: z.string().nullish(),
	currentPeriodEnd: z.string().nullish(), // ISO-8601 with offset
	cancelAtPeriodEnd: z.boolean().default(false),
	paymentMethodBrand: z.string().nullish(),
	paymentMethodLast4: z.string().nullish(),
});

/** `{ url }` responses from checkout / portal. */
export const billingRedirectSchema = z.object({
	url: z.string(),
});

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type SubscriptionState = z.infer<typeof subscriptionStateSchema>;
export type BillingRedirect = z.infer<typeof billingRedirectSchema>;

/**
 * Statuses that grant premium access. Mirror of the backend rule:
 * grant access for `trialing`, `active`, or `past_due` (soft-grace).
 * A `cancelAtPeriodEnd: true` sub still reports `active`, so it needs no
 * special-casing — access follows `status`.
 */
const ACCESS_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
	"trialing",
	"active",
	"past_due",
]);

export function hasSubscriptionAccess(status: SubscriptionStatus): boolean {
	return ACCESS_STATUSES.has(status);
}

/** `past_due` keeps access but should surface an "update payment" banner. */
export function needsPaymentAttention(status: SubscriptionStatus): boolean {
	return status === "past_due" || status === "incomplete";
}

/** A safe "no subscription" default, used when the backend read is unavailable. */
export const NO_SUBSCRIPTION: SubscriptionState = {
	status: "none",
	priceId: null,
	currentPeriodEnd: null,
	cancelAtPeriodEnd: false,
	paymentMethodBrand: null,
	paymentMethodLast4: null,
};
