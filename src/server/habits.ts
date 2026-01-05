import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
	type Habit,
	type HabitForCreation,
	habitSchema,
} from "@/schemas/habit";
import { BACKEND_URL, getProxyHeaders } from "../lib/proxy-utils";

const habitsResponseSchema = z.array(habitSchema);

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

export const setHabitCompletionFn = createServerFn({ method: "POST" })
	.inputValidator((d: { habitId: string; csrfToken: string; timezone: string }) =>
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
				return habitSchema.parse(result);
			}

			throw new Error("Failed to set habit completion");
		},
	);
