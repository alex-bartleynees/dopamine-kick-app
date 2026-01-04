import { z } from "zod";

export const bffClaimSchema = z.object({
	type: z.string(),
	value: z.string(),
});

export const bffUserResponseSchema = z.object({
	isAuthenticated: z.boolean(),
	claims: z.array(bffClaimSchema),
});

export const antiforgeryResponseSchema = z.object({
	requestToken: z.string(),
});

export type BffClaim = z.infer<typeof bffClaimSchema>;
export type BffUserResponse = z.infer<typeof bffUserResponseSchema>;
export type AntiforgeryResponse = z.infer<typeof antiforgeryResponseSchema>;

export function getClaimValue(
	user: BffUserResponse,
	claimType: string,
): string | null {
	const claim = user.claims.find((c) => c.type === claimType);
	return claim ? claim.value : null;
}
