import { z } from "zod";

export const questStatusSchema = z.enum(["Pending", "Completed"]);

export const questReminderSchema = z.object({
	id: z.string(),
	questId: z.string(),
	remindAt: z.string(), // absolute one-off ISO-8601 with offset
	timeZone: z.string(), // IANA id
	isEnabled: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const questSchema = z.object({
	id: z.string(),
	userId: z.string(),
	emoji: z.string(),
	title: z.string(),
	description: z.string().nullish(),
	dueAt: z.string(),
	status: questStatusSchema,
	completedAt: z.string().nullish(),
	createdAt: z.string(),
	updatedAt: z.string(),
	reminders: z.array(questReminderSchema).optional(),
});

export const questForCreationSchema = z.object({
	emoji: z.string().min(1).max(10),
	title: z.string().min(1).max(100),
	description: z.string().max(500).nullish(),
	dueAt: z.string(),
});

export const questReminderForCreationSchema = z.object({
	remindAt: z.string(),
	timeZone: z.string(),
	isEnabled: z.boolean(),
});

export type QuestStatus = z.infer<typeof questStatusSchema>;
export type QuestReminder = z.infer<typeof questReminderSchema>;
export type Quest = z.infer<typeof questSchema>;
export type QuestForCreation = z.infer<typeof questForCreationSchema>;
export type QuestReminderForCreation = z.infer<
	typeof questReminderForCreationSchema
>;
