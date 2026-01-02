import { z } from "zod";
import type { Habit } from "@/types/habit";

export const customHabitSchema = z.object({
	id: z.string(),
	emoji: z.string(),
	name: z.string(),
	target: z.string(),
	isCustom: z.literal(true),
});

export const habitSearchSchema = z.object({
	selectedIds: z.array(z.string()).default([]),
	customHabits: z.array(customHabitSchema).default([]),
});

export type HabitSearchParams = z.infer<typeof habitSearchSchema>;

export const DEFAULT_HABITS: Habit[] = [
	{ id: "exercise", emoji: "🏃", name: "Exercise", target: "20 min" },
	{ id: "meditation", emoji: "🧘", name: "Meditation", target: "10 min" },
	{ id: "hydration", emoji: "💧", name: "Hydration", target: "8 glasses" },
	{ id: "reading", emoji: "📖", name: "Reading", target: "15 min" },
	{ id: "sleep", emoji: "😴", name: "Sleep Early", target: "Before 11pm" },
	{ id: "journaling", emoji: "✍️", name: "Journaling", target: "5 min" },
	{ id: "healthy-eating", emoji: "🥗", name: "Healthy Eating", target: "3 meals" },
	{ id: "stretching", emoji: "🤸", name: "Stretching", target: "10 min" },
];
