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

export const habitUpdateSchema = z.object({
	name: z.string().min(1).max(100),
	emoji: z.string().min(1).max(10),
	target: z.string().min(1).max(200),
});

export const bulkHabitsForCreationSchema = z.object({
	habits: z.array(habitForCreationSchema),
});

// Read shape returned by GET /api/habits/completions (bulk history)
export const habitCompletionsSchema = z.object({
	from: z.string(),
	to: z.string(),
	completions: z.record(z.string(), z.array(z.string())),
});

// Read shape returned by GET /api/habits/{habitId}/reminders
export const habitReminderSchema = z.object({
	id: z.string(),
	habitId: z.string(),
	userId: z.string(),
	notificationTime: z.string(), // TimeOnly as "HH:mm:ss"
	timeZone: z.string(), // IANA id
	preferredTime: z.string(),
	isEnabled: z.boolean(),
});

// Body for POST /api/habits/{habitId}/reminders (habitId is a route param)
export const habitReminderForCreationSchema = z.object({
	notificationTime: z.string(), // TimeOnly as "HH:mm:ss"
	timeZone: z.string(),
	preferredTime: z.string(),
	isEnabled: z.boolean(),
});

// Item for POST /api/habits/reminders/bulk (no per-habit route, so habitId stays)
export const bulkHabitReminderItemSchema = z.object({
	habitId: z.string(),
	notificationTime: z.string(),
	timeZone: z.string(),
	preferredTime: z.string(),
	isEnabled: z.boolean(),
});

// Body for PUT /api/habits/{habitId}/reminders/{reminderId}
export const habitReminderForUpdateSchema = z.object({
	notificationTime: z.string(),
	timeZone: z.string(),
	preferredTime: z.string(),
	isEnabled: z.boolean(),
});

export type Habit = z.infer<typeof habitSchema>;
export type HabitCompletions = z.infer<typeof habitCompletionsSchema>;
export type HabitForCreation = z.infer<typeof habitForCreationSchema>;
export type HabitUpdate = z.infer<typeof habitUpdateSchema>;
export type CustomHabit = z.infer<typeof customHabitSchema>;
export type HabitSearchParams = z.infer<typeof habitSearchSchema>;
export type HabitReminder = z.infer<typeof habitReminderSchema>;
export type HabitReminderForCreation = z.infer<
	typeof habitReminderForCreationSchema
>;
export type BulkHabitReminderItem = z.infer<typeof bulkHabitReminderItemSchema>;
export type HabitReminderForUpdate = z.infer<
	typeof habitReminderForUpdateSchema
>;

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
