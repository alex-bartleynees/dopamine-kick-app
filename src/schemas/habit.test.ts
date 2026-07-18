import { describe, expect, it } from "vitest";
import {
	aiHabitSuggestionsSchema,
	aiSuggestedHabitSchema,
	customHabitSchema,
	DEFAULT_HABITS,
	habitCompletionsSchema,
	habitReminderForCreationSchema,
	habitSchema,
	habitSearchSchema,
	habitUpdateSchema,
} from "./habit";

describe("habitSchema", () => {
	it("parses a minimal habit", () => {
		const habit = { id: "1", emoji: "🏃", name: "Run", target: "20 min" };
		expect(habitSchema.parse(habit)).toEqual(habit);
	});

	it("accepts optional streak and completion fields", () => {
		const habit = {
			id: "1",
			emoji: "🏃",
			name: "Run",
			target: "20 min",
			currentStreak: 3,
			longestStreak: 10,
			lastCompletedDate: "2026-07-14",
			isCustom: false,
		};
		expect(habitSchema.parse(habit)).toEqual(habit);
	});

	it("allows lastCompletedDate to be null", () => {
		const habit = {
			id: "1",
			emoji: "🏃",
			name: "Run",
			target: "20 min",
			lastCompletedDate: null,
		};
		expect(habitSchema.safeParse(habit).success).toBe(true);
	});

	it("rejects a habit missing required fields", () => {
		expect(habitSchema.safeParse({ id: "1", emoji: "🏃" }).success).toBe(false);
	});
});

describe("customHabitSchema", () => {
	it("requires isCustom to be the literal true", () => {
		const base = { id: "x", emoji: "🎯", name: "Custom", target: "1x" };
		expect(
			customHabitSchema.safeParse({ ...base, isCustom: true }).success,
		).toBe(true);
		expect(
			customHabitSchema.safeParse({ ...base, isCustom: false }).success,
		).toBe(false);
	});
});

describe("habitSearchSchema", () => {
	it("applies defaults when given an empty object", () => {
		expect(habitSearchSchema.parse({})).toEqual({
			selectedIds: [],
			customHabits: [],
		});
	});

	it("keeps provided values", () => {
		const input = {
			selectedIds: ["a", "b"],
			customHabits: [
				{ id: "c", emoji: "🎯", name: "Custom", target: "1x", isCustom: true },
			],
		};
		expect(habitSearchSchema.parse(input)).toEqual(input);
	});
});

describe("habitUpdateSchema", () => {
	it("accepts values within length bounds", () => {
		expect(
			habitUpdateSchema.safeParse({
				name: "Run",
				emoji: "🏃",
				target: "20 min",
			}).success,
		).toBe(true);
	});

	it("rejects empty name/emoji/target", () => {
		expect(
			habitUpdateSchema.safeParse({ name: "", emoji: "🏃", target: "20 min" })
				.success,
		).toBe(false);
	});

	it("rejects a name over 100 chars", () => {
		expect(
			habitUpdateSchema.safeParse({
				name: "a".repeat(101),
				emoji: "🏃",
				target: "20 min",
			}).success,
		).toBe(false);
	});
});

describe("aiSuggestedHabitSchema", () => {
	const valid = {
		emoji: "💧",
		name: "Drink water",
		target: "8 glasses",
		rationale: "Keeps you hydrated",
	};

	it("parses a valid suggestion", () => {
		expect(aiSuggestedHabitSchema.parse(valid)).toEqual(valid);
	});

	it("rejects an empty name", () => {
		expect(
			aiSuggestedHabitSchema.safeParse({ ...valid, name: "" }).success,
		).toBe(false);
	});

	it("rejects a rationale over 160 chars", () => {
		expect(
			aiSuggestedHabitSchema.safeParse({ ...valid, rationale: "a".repeat(161) })
				.success,
		).toBe(false);
	});
});

describe("aiHabitSuggestionsSchema", () => {
	const habit = {
		emoji: "💧",
		name: "Drink water",
		target: "8 glasses",
		rationale: "Keeps you hydrated",
	};

	it("accepts between 3 and 5 suggestions", () => {
		expect(
			aiHabitSuggestionsSchema.safeParse({ suggestions: Array(3).fill(habit) })
				.success,
		).toBe(true);
		expect(
			aiHabitSuggestionsSchema.safeParse({ suggestions: Array(5).fill(habit) })
				.success,
		).toBe(true);
	});

	it("rejects fewer than 3 or more than 5 suggestions", () => {
		expect(
			aiHabitSuggestionsSchema.safeParse({ suggestions: Array(2).fill(habit) })
				.success,
		).toBe(false);
		expect(
			aiHabitSuggestionsSchema.safeParse({ suggestions: Array(6).fill(habit) })
				.success,
		).toBe(false);
	});
});

describe("habitCompletionsSchema", () => {
	it("parses a completions record", () => {
		const input = {
			from: "2026-07-01",
			to: "2026-07-14",
			completions: {
				exercise: ["2026-07-01", "2026-07-02"],
				reading: [],
			},
		};
		expect(habitCompletionsSchema.parse(input)).toEqual(input);
	});

	it("rejects a non-array completion value", () => {
		expect(
			habitCompletionsSchema.safeParse({
				from: "a",
				to: "b",
				completions: { exercise: "2026-07-01" },
			}).success,
		).toBe(false);
	});
});

describe("habitReminderForCreationSchema", () => {
	it("parses a reminder body", () => {
		const input = {
			notificationTime: "08:00:00",
			timeZone: "Pacific/Auckland",
			preferredTime: "Morning",
			isEnabled: true,
		};
		expect(habitReminderForCreationSchema.parse(input)).toEqual(input);
	});

	it("rejects a non-boolean isEnabled", () => {
		expect(
			habitReminderForCreationSchema.safeParse({
				notificationTime: "08:00:00",
				timeZone: "Pacific/Auckland",
				preferredTime: "Morning",
				isEnabled: "yes",
			}).success,
		).toBe(false);
	});
});

describe("DEFAULT_HABITS", () => {
	it("all entries satisfy habitSchema", () => {
		for (const habit of DEFAULT_HABITS) {
			expect(habitSchema.safeParse(habit).success).toBe(true);
		}
	});

	it("has unique ids", () => {
		const ids = DEFAULT_HABITS.map((h) => h.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
