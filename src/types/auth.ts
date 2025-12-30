export interface BffClaim {
	type: string;
	value: string;
}

export interface BffUserResponse {
	isAuthenticated: boolean;
	claims: BffClaim[];
}

export function getClaimValue(
	user: BffUserResponse,
	claimType: string,
): string | null {
	const claim = user.claims.find((c) => c.type === claimType);
	return claim ? claim.value : null;
}
