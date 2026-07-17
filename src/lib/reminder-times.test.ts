import { describe, expect, it } from "vitest";
import {
	DEFAULT_REMINDER_TIMES,
	fromApiTime,
	REMINDER_TIME_OPTIONS,
	TIME_OPTIONS,
	toApiTime,
	type TimePreference,
} from "./reminder-times";

describe("toApiTime", () => {
	it("appends seconds to an HH:mm value", () => {
		expect(toApiTime("08:30")).toBe("08:30:00");
	});

	it("passes through values that already have seconds", () => {
		expect(toApiTime("08:30:45")).toBe("08:30:45");
	});

	it("defaults an omitted minutes part to zero", () => {
		expect(toApiTime("09")).toBe("09:00:00");
	});

	it("only fills genuinely-missing parts (present-but-empty stays empty)", () => {
		// "".split(":") === [""], so the hours slot is present-but-empty and the
		// `= "00"` default (which only applies to `undefined`) does not kick in.
		expect(toApiTime("")).toBe(":00:00");
	});
});

describe("fromApiTime", () => {
	it("strips seconds from an HH:mm:ss value", () => {
		expect(fromApiTime("17:00:00")).toBe("17:00");
	});

	it("passes through an already HH:mm value", () => {
		expect(fromApiTime("17:00")).toBe("17:00");
	});

	it("defaults an omitted minutes part to zero", () => {
		expect(fromApiTime("08")).toBe("08:00");
	});
});

describe("toApiTime/fromApiTime round-trip", () => {
	it("is stable across a round trip", () => {
		for (const { value } of REMINDER_TIME_OPTIONS) {
			expect(fromApiTime(toApiTime(value))).toBe(value);
		}
	});
});

describe("reminder time constants", () => {
	it("has a default time for every TIME_OPTIONS preference", () => {
		for (const option of TIME_OPTIONS) {
			expect(DEFAULT_REMINDER_TIMES[option as TimePreference]).toMatch(
				/^\d{2}:\d{2}$/,
			);
		}
	});

	it("exposes unique, well-formed reminder option values", () => {
		const values = REMINDER_TIME_OPTIONS.map((o) => o.value);
		expect(new Set(values).size).toBe(values.length);
		for (const { value } of REMINDER_TIME_OPTIONS) {
			expect(value).toMatch(/^\d{2}:\d{2}$/);
		}
	});
});
