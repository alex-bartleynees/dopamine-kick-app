import { z } from "zod";

export const habitSchema = z.object({
	id: z.string(),
	emoji: z.string(),
	name: z.string(),
	target: z.string(),
	currentStreak: z.number().optional(),
	longestStreak: z.number().optional(),
	lastCompletedDate: z.string().nullish(),
	isCustom: z.boolean().optional(),
});

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

export const habitForCreationSchema = z.object({
	name: z.string(),
	emoji: z.string(),
	target: z.string(),
});

export const bulkHabitsForCreationSchema = z.object({
	habits: z.array(habitForCreationSchema),
});

export const habitReminderForCreationSchema = z.object({
	habitId: z.string(),
	notificationTime: z.string(), // TimeOnly as HH:mm string
	timezone: z.string(),
	preferredTime: z.string(),
	isEnabled: z.boolean(),
});

export type Habit = z.infer<typeof habitSchema>;
export type HabitForCreation = z.infer<typeof habitForCreationSchema>;
export type CustomHabit = z.infer<typeof customHabitSchema>;
export type HabitSearchParams = z.infer<typeof habitSearchSchema>;
export type HabitReminderForCreation = z.infer<typeof habitReminderForCreationSchema>;

export const DEFAULT_HABITS: Habit[] = [
	{ id: "exercise", emoji: "🏃", name: "Exercise", target: "20 min" },
	{ id: "meditation", emoji: "🧘", name: "Meditation", target: "10 min" },
	{ id: "hydration", emoji: "💧", name: "Hydration", target: "8 glasses" },
	{ id: "reading", emoji: "📖", name: "Reading", target: "15 min" },
	{ id: "sleep", emoji: "😴", name: "Sleep Early", target: "Before 11pm" },
	{ id: "journaling", emoji: "✍️", name: "Journaling", target: "5 min" },
	{
		id: "healthy-eating",
		emoji: "🥗",
		name: "Healthy Eating",
		target: "3 meals",
	},
	{ id: "stretching", emoji: "🤸", name: "Stretching", target: "10 min" },
];
