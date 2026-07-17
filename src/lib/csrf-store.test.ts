import { afterEach, describe, expect, it } from "vitest";
import { clearCsrfToken, getCsrfToken, setCsrfToken } from "./csrf-store";

afterEach(() => {
	clearCsrfToken();
});

describe("csrf-store", () => {
	it("starts empty", () => {
		expect(getCsrfToken()).toBe("");
	});

	it("stores and returns a token", () => {
		setCsrfToken("abc123");
		expect(getCsrfToken()).toBe("abc123");
	});

	it("overwrites a previously stored token", () => {
		setCsrfToken("first");
		setCsrfToken("second");
		expect(getCsrfToken()).toBe("second");
	});

	it("clears the stored token", () => {
		setCsrfToken("abc123");
		clearCsrfToken();
		expect(getCsrfToken()).toBe("");
	});
});
