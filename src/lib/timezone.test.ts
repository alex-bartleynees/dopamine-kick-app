import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTodayDate, isToday } from "./timezone";

describe("getTodayDate", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns today's date in YYYY-MM-DD format", () => {
		// Noon UTC keeps the date the same across common timezones.
		vi.setSystemTime(new Date("2026-07-14T12:00:00Z"));
		expect(getTodayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(getTodayDate()).toBe("2026-07-14");
	});

	it("reflects the mocked clock changing", () => {
		vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
		expect(getTodayDate()).toBe("2026-01-01");
		vi.setSystemTime(new Date("2026-12-25T12:00:00Z"));
		expect(getTodayDate()).toBe("2026-12-25");
	});
});

describe("isToday", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-14T12:00:00Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns true for today's date", () => {
		expect(isToday(getTodayDate())).toBe(true);
	});

	it("returns false for a different date", () => {
		expect(isToday("2020-01-01")).toBe(false);
	});

	it("returns false for null, undefined, or empty string", () => {
		expect(isToday(null)).toBe(false);
		expect(isToday(undefined)).toBe(false);
		expect(isToday("")).toBe(false);
	});
});
