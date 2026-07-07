import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import {
	type Quest,
	type QuestForCreation,
	type QuestReminder,
	type QuestReminderForCreation,
	questForCreationSchema,
	questReminderForCreationSchema,
	questReminderSchema,
	questSchema,
} from "@/schemas/quest";
import { BACKEND_URL, getProxyHeaders } from "../lib/proxy-utils";

const questsResponseSchema = z.array(questSchema);

export const getQuestsFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<Quest[]> => {
		const request = getRequest();
		try {
			const response = await fetch(`${BACKEND_URL}/api/quests`, {
				method: "GET",
				headers: getProxyHeaders(request),
			});
			if (response.ok) {
				const data = await response.json();
				return questsResponseSchema.parse(data);
			}
		} catch {
			return [];
		}

		return [];
	},
);

export const getQuestFn = createServerFn({ method: "GET" })
	.inputValidator((questId: string) => z.string().parse(questId))
	.handler(async ({ data: questId }): Promise<Quest> => {
		const request = getRequest();
		const response = await fetch(`${BACKEND_URL}/api/quests/${questId}`, {
			method: "GET",
			headers: getProxyHeaders(request),
		});

		if (response.ok) {
			const data = await response.json();
			return questSchema.parse(data);
		}

		throw new Error("Failed to fetch quest");
	});

type CreateQuestInput = QuestForCreation & { csrfToken: string };

export const createQuestFn = createServerFn({ method: "POST" })
	.inputValidator((d: CreateQuestInput) =>
		questForCreationSchema.extend({ csrfToken: z.string() }).parse(d),
	)
	.handler(async ({ data }: { data: CreateQuestInput }): Promise<Quest> => {
		const request = getRequest();
		const { csrfToken, ...questData } = data;
		const response = await fetch(`${BACKEND_URL}/api/quests`, {
			method: "POST",
			headers: {
				...getProxyHeaders(request),
				"Content-Type": "application/json",
				"X-CSRF-TOKEN": csrfToken,
			},
			body: JSON.stringify(questData),
		});

		if (response.ok) {
			const result = await response.json();
			return questSchema.parse(result);
		}

		throw new Error("Failed to create quest");
	});

type UpdateQuestInput = QuestForCreation & {
	questId: string;
	csrfToken: string;
};

export const updateQuestFn = createServerFn({ method: "POST" })
	.inputValidator((d: UpdateQuestInput) =>
		questForCreationSchema
			.extend({ questId: z.string(), csrfToken: z.string() })
			.parse(d),
	)
	.handler(async ({ data }: { data: UpdateQuestInput }): Promise<Quest> => {
		const request = getRequest();
		const { csrfToken, questId, ...questData } = data;
		const response = await fetch(`${BACKEND_URL}/api/quests/${questId}`, {
			method: "PUT",
			headers: {
				...getProxyHeaders(request),
				"Content-Type": "application/json",
				"X-CSRF-TOKEN": csrfToken,
			},
			body: JSON.stringify(questData),
		});

		if (response.ok) {
			const result = await response.json();
			return questSchema.parse(result);
		}

		throw new Error("Failed to update quest");
	});

type CompleteQuestInput = { questId: string; csrfToken: string };

export const completeQuestFn = createServerFn({ method: "POST" })
	.inputValidator((d: CompleteQuestInput) =>
		z.object({ questId: z.string(), csrfToken: z.string() }).parse(d),
	)
	.handler(async ({ data }: { data: CompleteQuestInput }): Promise<Quest> => {
		const request = getRequest();
		const response = await fetch(
			`${BACKEND_URL}/api/quests/${data.questId}/complete`,
			{
				method: "POST",
				headers: {
					...getProxyHeaders(request),
					"Content-Type": "application/json",
					"X-CSRF-TOKEN": data.csrfToken,
				},
			},
		);

		if (response.ok) {
			const result = await response.json();
			return questSchema.parse(result);
		}

		throw new Error("Failed to complete quest");
	});

type DeleteQuestInput = { questId: string; csrfToken: string };

export const deleteQuestFn = createServerFn({ method: "POST" })
	.inputValidator((d: DeleteQuestInput) =>
		z.object({ questId: z.string(), csrfToken: z.string() }).parse(d),
	)
	.handler(async ({ data }: { data: DeleteQuestInput }): Promise<void> => {
		const request = getRequest();
		const response = await fetch(`${BACKEND_URL}/api/quests/${data.questId}`, {
			method: "DELETE",
			headers: {
				...getProxyHeaders(request),
				"X-CSRF-TOKEN": data.csrfToken,
			},
		});

		if (!response.ok) {
			throw new Error("Failed to delete quest");
		}
	});

type CreateQuestReminderInput = QuestReminderForCreation & {
	questId: string;
	csrfToken: string;
};

export const createQuestReminderFn = createServerFn({ method: "POST" })
	.inputValidator((d: CreateQuestReminderInput) =>
		questReminderForCreationSchema
			.extend({ questId: z.string(), csrfToken: z.string() })
			.parse(d),
	)
	.handler(
		async ({
			data,
		}: {
			data: CreateQuestReminderInput;
		}): Promise<QuestReminder> => {
			const request = getRequest();
			const { csrfToken, questId, ...reminderData } = data;
			const response = await fetch(
				`${BACKEND_URL}/api/quests/${questId}/reminders`,
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

			if (response.ok) {
				const result = await response.json();
				return questReminderSchema.parse(result);
			}

			throw new Error("Failed to create quest reminder");
		},
	);
