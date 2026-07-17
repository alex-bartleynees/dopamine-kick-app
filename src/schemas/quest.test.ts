import { describe, expect, it } from "vitest";
import {
	questForCreationSchema,
	questSchema,
	questStatusSchema,
} from "./quest";

describe("questStatusSchema", () => {
	it("accepts the known statuses", () => {
		expect(questStatusSchema.parse("Pending")).toBe("Pending");
		expect(questStatusSchema.parse("Completed")).toBe("Completed");
	});

	it("rejects unknown statuses", () => {
		expect(questStatusSchema.safeParse("Archived").success).toBe(false);
	});
});

describe("questSchema", () => {
	const base = {
		id: "q1",
		userId: "u1",
		emoji: "⚔️",
		title: "Slay the backlog",
		dueAt: "2026-07-20T00:00:00Z",
		status: "Pending" as const,
		createdAt: "2026-07-14T00:00:00Z",
		updatedAt: "2026-07-14T00:00:00Z",
	};

	it("parses a minimal quest", () => {
		expect(questSchema.parse(base)).toMatchObject(base);
	});

	it("accepts nullish description and completedAt", () => {
		expect(
			questSchema.safeParse({ ...base, description: null, completedAt: null })
				.success,
		).toBe(true);
	});

	it("accepts an array of reminders", () => {
		const withReminders = {
			...base,
			reminders: [
				{
					id: "r1",
					questId: "q1",
					remindAt: "2026-07-19T09:00:00+12:00",
					timeZone: "Pacific/Auckland",
					isEnabled: true,
					createdAt: "2026-07-14T00:00:00Z",
					updatedAt: "2026-07-14T00:00:00Z",
				},
			],
		};
		expect(questSchema.safeParse(withReminders).success).toBe(true);
	});

	it("rejects a quest missing required fields", () => {
		expect(questSchema.safeParse({ id: "q1" }).success).toBe(false);
	});
});

describe("questForCreationSchema", () => {
	it("parses a valid creation body", () => {
		const input = {
			emoji: "⚔️",
			title: "Slay the backlog",
			dueAt: "2026-07-20T00:00:00Z",
		};
		expect(questForCreationSchema.parse(input)).toMatchObject(input);
	});

	it("rejects an empty title", () => {
		expect(
			questForCreationSchema.safeParse({
				emoji: "⚔️",
				title: "",
				dueAt: "2026-07-20T00:00:00Z",
			}).success,
		).toBe(false);
	});

	it("rejects a title over 100 chars", () => {
		expect(
			questForCreationSchema.safeParse({
				emoji: "⚔️",
				title: "a".repeat(101),
				dueAt: "2026-07-20T00:00:00Z",
			}).success,
		).toBe(false);
	});

	it("rejects a description over 500 chars", () => {
		expect(
			questForCreationSchema.safeParse({
				emoji: "⚔️",
				title: "Quest",
				description: "a".repeat(501),
				dueAt: "2026-07-20T00:00:00Z",
			}).success,
		).toBe(false);
	});
});
