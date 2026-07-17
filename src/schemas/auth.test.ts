import { describe, expect, it } from "vitest";
import {
	antiforgeryResponseSchema,
	type BffUserResponse,
	bffUserResponseSchema,
	getClaimValue,
} from "./auth";

const user: BffUserResponse = {
	isAuthenticated: true,
	claims: [
		{ type: "sub", value: "user-123" },
		{ type: "name", value: "Ada" },
		{ type: "role", value: "admin" },
	],
};

describe("getClaimValue", () => {
	it("returns the value of a matching claim", () => {
		expect(getClaimValue(user, "sub")).toBe("user-123");
		expect(getClaimValue(user, "name")).toBe("Ada");
	});

	it("returns null when the claim type is absent", () => {
		expect(getClaimValue(user, "email")).toBeNull();
	});

	it("returns null when there are no claims", () => {
		expect(getClaimValue({ isAuthenticated: false, claims: [] }, "sub")).toBeNull();
	});

	it("returns the first matching claim when duplicated", () => {
		const dup: BffUserResponse = {
			isAuthenticated: true,
			claims: [
				{ type: "role", value: "first" },
				{ type: "role", value: "second" },
			],
		};
		expect(getClaimValue(dup, "role")).toBe("first");
	});
});

describe("bffUserResponseSchema", () => {
	it("parses a valid response", () => {
		expect(bffUserResponseSchema.parse(user)).toEqual(user);
	});

	it("rejects a response missing isAuthenticated", () => {
		expect(bffUserResponseSchema.safeParse({ claims: [] }).success).toBe(false);
	});

	it("rejects claims with the wrong shape", () => {
		const result = bffUserResponseSchema.safeParse({
			isAuthenticated: true,
			claims: [{ type: "sub" }],
		});
		expect(result.success).toBe(false);
	});
});

describe("antiforgeryResponseSchema", () => {
	it("parses a request token", () => {
		expect(antiforgeryResponseSchema.parse({ requestToken: "tok" })).toEqual({
			requestToken: "tok",
		});
	});

	it("rejects a missing request token", () => {
		expect(antiforgeryResponseSchema.safeParse({}).success).toBe(false);
	});
});
