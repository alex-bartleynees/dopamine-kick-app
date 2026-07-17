import { describe, expect, it } from "vitest";
import { userForCreationSchema, userSchema } from "./user";

describe("userForCreationSchema", () => {
	const valid = {
		email: "ada@example.com",
		username: "ada",
		name: "Ada Lovelace",
		password: "supersecret",
		image: "",
	};

	it("parses a valid creation payload", () => {
		expect(userForCreationSchema.parse(valid)).toEqual(valid);
	});

	it("rejects an invalid email", () => {
		expect(
			userForCreationSchema.safeParse({ ...valid, email: "not-an-email" })
				.success,
		).toBe(false);
	});

	it("rejects a password shorter than 8 chars", () => {
		expect(
			userForCreationSchema.safeParse({ ...valid, password: "short" }).success,
		).toBe(false);
	});

	it("rejects an empty username or name", () => {
		expect(
			userForCreationSchema.safeParse({ ...valid, username: "" }).success,
		).toBe(false);
		expect(userForCreationSchema.safeParse({ ...valid, name: "" }).success).toBe(
			false,
		);
	});
});

describe("userSchema", () => {
	it("parses a user with an optional id", () => {
		const user = {
			image: "",
			name: "Ada",
			username: "ada",
			createdAt: "2026-07-14T00:00:00Z",
		};
		expect(userSchema.parse(user)).toEqual(user);
		expect(userSchema.safeParse({ ...user, id: "u1" }).success).toBe(true);
	});

	it("rejects a user missing createdAt", () => {
		expect(
			userSchema.safeParse({ image: "", name: "Ada", username: "ada" }).success,
		).toBe(false);
	});
});
