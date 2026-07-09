import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
	type BulkHabitReminderItem,
	bulkHabitReminderItemSchema,
	type Habit,
	type HabitForCreation,
	type HabitReminder,
	type HabitReminderForCreation,
	type HabitCompletions,
	type HabitReminderForUpdate,
	type HabitUpdate,
	habitCompletionsSchema,
	habitReminderForCreationSchema,
	habitReminderForUpdateSchema,
	habitReminderSchema,
	habitSchema,
	habitUpdateSchema,
} from "@/schemas/habit";
import { BACKEND_URL, getProxyHeaders } from "../lib/proxy-utils";

const habitsResponseSchema = z.array(habitSchema);
const habitRemindersResponseSchema = z.array(habitReminderSchema);

const bulkCreateInputSchema = z.object({
	habits: z.array(
		z.object({
			name: z.string(),
			emoji: z.string(),
			target: z.string(),
		}),
	),
	csrfToken: z.string(),
});

export const getHabitsFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<Habit[]> => {
		const request = getRequest();
		try {
			const response = await fetch(`${BACKEND_URL}/api/habits`, {
				method: "GET",
				headers: getProxyHeaders(request),
			});
			if (response.ok) {
				const data = await response.json();
				return habitsResponseSchema.parse(data);
			}
		} catch {
			return [];
		}

		return [];
	},
);

const habitCompletionsInputSchema = z.object({
	days: z.number().int().min(1).max(90),
	timezone: z.string(),
});

// Returns null on failure so callers can fall back to streak-derived history.
export const getHabitCompletionsFn = createServerFn({ method: "GET" })
	.inputValidator((d: { days: number; timezone: string }) =>
		habitCompletionsInputSchema.parse(d),
	)
	.handler(async ({ data }): Promise<HabitCompletions | null> => {
		const request = getRequest();
		const params = new URLSearchParams({
			days: String(data.days),
			timezone: data.timezone,
		});
		try {
			const response = await fetch(
				`${BACKEND_URL}/api/habits/completions?${params}`,
				{
					method: "GET",
					headers: getProxyHeaders(request),
				},
			);
			if (response.ok) {
				const result = await response.json();
				return habitCompletionsSchema.parse(result);
			}
		} catch {
			return null;
		}

		return null;
	});

export const getHabitFn = createServerFn({ method: "GET" })
	.inputValidator((habitId: string) => z.string().parse(habitId))
	.handler(async ({ data: habitId }): Promise<Habit> => {
		const request = getRequest();
		const response = await fetch(`${BACKEND_URL}/api/habits/${habitId}`, {
			method: "GET",
			headers: getProxyHeaders(request),
		});

		if (response.ok) {
			const data = await response.json();
			return habitSchema.parse(data);
		}

		throw new Error("Failed to fetch habit");
	});

export const getHabitRemindersFn = createServerFn({ method: "GET" })
	.inputValidator((habitId: string) => z.string().parse(habitId))
	.handler(async ({ data: habitId }): Promise<HabitReminder[]> => {
		const request = getRequest();
		const response = await fetch(
			`${BACKEND_URL}/api/habits/${habitId}/reminders`,
			{
				method: "GET",
				headers: getProxyHeaders(request),
			},
		);

		if (response.ok) {
			const data = await response.json();
			return habitRemindersResponseSchema.parse(data);
		}

		throw new Error("Failed to fetch habit reminders");
	});

type BulkCreateInput = { habits: HabitForCreation[]; csrfToken: string };

export const bulkCreateHabitsFn = createServerFn({ method: "POST" })
	.inputValidator((d: BulkCreateInput) => bulkCreateInputSchema.parse(d))
	.handler(async ({ data }: { data: BulkCreateInput }): Promise<Habit[]> => {
		const request = getRequest();
		const response = await fetch(`${BACKEND_URL}/api/habits/bulk`, {
			method: "POST",
			headers: {
				...getProxyHeaders(request),
				"Content-Type": "application/json",
				"X-CSRF-TOKEN": data.csrfToken,
			},
			body: JSON.stringify({ habits: data.habits }),
		});

		if (response.ok) {
			const result = await response.json();
			return habitsResponseSchema.parse(result);
		}

		throw new Error("Failed to create habits");
	});

type UpdateHabitInput = HabitUpdate & { habitId: string; csrfToken: string };

export const updateHabitFn = createServerFn({ method: "POST" })
	.inputValidator((d: UpdateHabitInput) =>
		habitUpdateSchema
			.extend({ habitId: z.string(), csrfToken: z.string() })
			.parse(d),
	)
	.handler(async ({ data }: { data: UpdateHabitInput }): Promise<Habit> => {
		const request = getRequest();
		const { csrfToken, habitId, ...habitData } = data;
		const response = await fetch(`${BACKEND_URL}/api/habits/${habitId}`, {
			method: "PUT",
			headers: {
				...getProxyHeaders(request),
				"Content-Type": "application/json",
				"X-CSRF-TOKEN": csrfToken,
			},
			body: JSON.stringify(habitData),
		});

		if (response.ok) {
			const result = await response.json();
			return habitSchema.parse(result);
		}

		throw new Error("Failed to update habit");
	});

type DeleteHabitInput = { habitId: string; csrfToken: string };

export const deleteHabitFn = createServerFn({ method: "POST" })
	.inputValidator((d: DeleteHabitInput) =>
		z.object({ habitId: z.string(), csrfToken: z.string() }).parse(d),
	)
	.handler(async ({ data }: { data: DeleteHabitInput }): Promise<void> => {
		const request = getRequest();
		const response = await fetch(`${BACKEND_URL}/api/habits/${data.habitId}`, {
			method: "DELETE",
			headers: {
				...getProxyHeaders(request),
				"X-CSRF-TOKEN": data.csrfToken,
			},
		});

		if (!response.ok) {
			throw new Error("Failed to delete habit");
		}
	});

export const setHabitCompletionFn = createServerFn({ method: "POST" })
	.inputValidator(
		(d: { habitId: string; csrfToken: string; timezone: string }) =>
			z
				.object({
					habitId: z.string(),
					csrfToken: z.string(),
					timezone: z.string(),
				})
				.parse(d),
	)
	.handler(
		async ({
			data,
		}: {
			data: { habitId: string; csrfToken: string; timezone: string };
		}): Promise<Habit> => {
			const request = getRequest();
			const response = await fetch(
				`${BACKEND_URL}/api/habits/${data.habitId}/completions`,
				{
					method: "POST",
					headers: {
						...getProxyHeaders(request),
						"Content-Type": "application/json",
						"X-CSRF-TOKEN": data.csrfToken,
					},
					body: JSON.stringify({
						habitId: data.habitId,
						timezone: data.timezone,
					}),
				},
			);

			if (response.ok) {
				const result = await response.json();
				return habitSchema.parse(result.habit);
			}

			throw new Error("Failed to set habit completion");
		},
	);

type CreateHabitReminderInput = HabitReminderForCreation & {
	habitId: string;
	csrfToken: string;
};

export const createHabitReminderFn = createServerFn({ method: "POST" })
	.inputValidator((d: CreateHabitReminderInput) =>
		habitReminderForCreationSchema
			.extend({ habitId: z.string(), csrfToken: z.string() })
			.parse(d),
	)
	.handler(
		async ({ data }: { data: CreateHabitReminderInput }): Promise<void> => {
			const request = getRequest();
			const { csrfToken, habitId, ...reminderData } = data;
			const response = await fetch(
				`${BACKEND_URL}/api/habits/${habitId}/reminders`,
				{
					method: "POST",
					headers: {
						...getProxyHeaders(request),
						"Content-Type": "application/json",
						"X-CSRF-TOKEN": csrfToken,
					},
					body: JSON.stringify(reminderData),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to create habit reminder");
			}
		},
	);

type UpdateHabitReminderInput = HabitReminderForUpdate & {
	habitId: string;
	reminderId: string;
	csrfToken: string;
};

export const updateHabitReminderFn = createServerFn({ method: "POST" })
	.inputValidator((d: UpdateHabitReminderInput) =>
		habitReminderForUpdateSchema
			.extend({
				habitId: z.string(),
				reminderId: z.string(),
				csrfToken: z.string(),
			})
			.parse(d),
	)
	.handler(
		async ({ data }: { data: UpdateHabitReminderInput }): Promise<void> => {
			const request = getRequest();
			const { csrfToken, habitId, reminderId, ...reminderData } = data;
			const response = await fetch(
				`${BACKEND_URL}/api/habits/${habitId}/reminders/${reminderId}`,
				{
					method: "PUT",
					headers: {
						...getProxyHeaders(request),
						"Content-Type": "application/json",
						"X-CSRF-TOKEN": csrfToken,
					},
					body: JSON.stringify(reminderData),
				},
			);

			if (!response.ok) {
				throw new Error("Failed to update habit reminder");
			}
		},
	);

type DeleteHabitReminderInput = {
	habitId: string;
	reminderId: string;
	csrfToken: string;
};

export const deleteHabitReminderFn = createServerFn({ method: "POST" })
	.inputValidator((d: DeleteHabitReminderInput) =>
		z
			.object({
				habitId: z.string(),
				reminderId: z.string(),
				csrfToken: z.string(),
			})
			.parse(d),
	)
	.handler(
		async ({ data }: { data: DeleteHabitReminderInput }): Promise<void> => {
			const request = getRequest();
			const response = await fetch(
				`${BACKEND_URL}/api/habits/${data.habitId}/reminders/${data.reminderId}`,
				{
					method: "DELETE",
					headers: {
						...getProxyHeaders(request),
						"X-CSRF-TOKEN": data.csrfToken,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to delete habit reminder");
			}
		},
	);

const bulkCreateRemindersInputSchema = z.object({
	reminders: z.array(bulkHabitReminderItemSchema),
	csrfToken: z.string(),
});

type BulkCreateRemindersInput = {
	reminders: BulkHabitReminderItem[];
	csrfToken: string;
};

export const bulkCreateHabitRemindersFn = createServerFn({ method: "POST" })
	.inputValidator((d: BulkCreateRemindersInput) =>
		bulkCreateRemindersInputSchema.parse(d),
	)
	.handler(
		async ({ data }: { data: BulkCreateRemindersInput }): Promise<void> => {
			const request = getRequest();
			const response = await fetch(`${BACKEND_URL}/api/habits/reminders/bulk`, {
				method: "POST",
				headers: {
					...getProxyHeaders(request),
					"Content-Type": "application/json",
					"X-CSRF-TOKEN": data.csrfToken,
				},
				body: JSON.stringify({ reminders: data.reminders }),
			});

			if (!response.ok) {
				throw new Error("Failed to create habit reminders");
			}
		},
	);
