import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronLeft, Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { timezone } from "@/lib/timezone";
import type { Quest } from "@/schemas/quest";
import {
	createQuestReminderFn,
	getQuestFn,
	updateQuestFn,
} from "@/server/quests";

export const Route = createFileRoute("/_auth/quest/$questId")({
	loader: async ({ params }) => {
		const quest = await getQuestFn({ data: params.questId });
		return { quest };
	},
	component: QuestDetail,
});

// ISO-8601 string -> `datetime-local` value in the browser's local time.
function isoToLocalInput(iso: string): string {
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours(),
	)}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string {
	return new Date(value).toISOString();
}

function formatReminder(iso: string, locale: string): string {
	return new Date(iso).toLocaleString(locale, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZone: timezone,
	});
}

function QuestDetail() {
	const { quest: initialQuest } = Route.useLoaderData();
	const { questId } = Route.useParams();
	const { csrfToken } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { data: quest = initialQuest } = useQuery({
		queryKey: ["quest", questId],
		queryFn: async () => getQuestFn({ data: questId }),
		initialData: initialQuest,
	});

	const [emoji, setEmoji] = useState(quest.emoji);
	const [title, setTitle] = useState(quest.title);
	const [description, setDescription] = useState(quest.description ?? "");
	const [dueAt, setDueAt] = useState(isoToLocalInput(quest.dueAt));
	const [newReminder, setNewReminder] = useState("");
	const locale =
		typeof navigator !== "undefined" ? navigator.language : "en-US";
	const isCompleted = quest.status === "Completed";

	const refreshQuest = async () => {
		await queryClient.invalidateQueries({ queryKey: ["quest", questId] });
		await queryClient.invalidateQueries({ queryKey: ["quests"] });
	};

	const updateQuestMutation = useMutation({
		mutationFn: async () => {
			return await updateQuestFn({
				data: {
					questId,
					emoji,
					title,
					description: description.trim() ? description.trim() : null,
					dueAt: localInputToIso(dueAt),
					csrfToken,
				},
			});
		},
		onSuccess: async (updated: Quest) => {
			queryClient.setQueryData(["quest", questId], updated);
			await refreshQuest();
			navigate({ to: "/quests" });
		},
		onError: (error) => {
			console.error("Failed to update quest:", error);
		},
	});

	const addReminderMutation = useMutation({
		mutationFn: async () => {
			return await createQuestReminderFn({
				data: {
					questId,
					remindAt: localInputToIso(newReminder),
					timeZone: timezone,
					isEnabled: true,
					csrfToken,
				},
			});
		},
		onSuccess: async () => {
			setNewReminder("");
			await refreshQuest();
		},
		onError: (error) => {
			console.error("Failed to add reminder:", error);
		},
	});

	const canSave = title.trim().length > 0 && dueAt.length > 0;

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center p-6">
			<div className="max-w-2xl w-full">
				<div className="animate-fade-in-up">
					<button
						type="button"
						onClick={() => navigate({ to: "/quests" })}
						className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
					>
						<ChevronLeft className="w-5 h-5" />
						Back
					</button>

					<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 space-y-6">
						{isCompleted && (
							<div className="rounded-xl bg-purple-100 dark:bg-purple-900/40 px-4 py-3 text-sm text-purple-700 dark:text-purple-300">
								This quest is completed.
							</div>
						)}

						<div className="flex gap-4">
							<div className="w-24">
								<label
									htmlFor="quest-emoji"
									className="block text-sm mb-2 text-gray-700 dark:text-gray-300"
								>
									Emoji
								</label>
								<input
									id="quest-emoji"
									type="text"
									value={emoji}
									onChange={(e) => setEmoji(e.target.value)}
									maxLength={10}
									className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all text-center text-3xl"
								/>
							</div>
							<div className="flex-1">
								<label
									htmlFor="quest-title"
									className="block text-sm mb-2 text-gray-700 dark:text-gray-300"
								>
									Title
								</label>
								<input
									id="quest-title"
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									maxLength={100}
									className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="quest-description"
								className="block text-sm mb-2 text-gray-700 dark:text-gray-300"
							>
								Description <span className="text-gray-400">(optional)</span>
							</label>
							<textarea
								id="quest-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								maxLength={500}
								rows={3}
								className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all resize-none"
							/>
						</div>

						<div>
							<label
								htmlFor="quest-due"
								className="block text-sm mb-2 text-gray-700 dark:text-gray-300"
							>
								Due date &amp; time
							</label>
							<input
								id="quest-due"
								type="datetime-local"
								value={dueAt}
								onChange={(e) => setDueAt(e.target.value)}
								className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all text-base"
							/>
						</div>

						{/* Reminders */}
						<div className="border-t border-gray-200 dark:border-gray-700 pt-6">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
									<Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
								</div>
								<div className="font-medium">Reminders</div>
							</div>

							{quest.reminders && quest.reminders.length > 0 ? (
								<ul className="space-y-2 mb-4">
									{quest.reminders.map((reminder) => (
										<li
											key={reminder.id}
											className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm"
										>
											<span className="dark:text-gray-200">
												{formatReminder(reminder.remindAt, locale)}
											</span>
											<span
												className={`text-xs font-medium ${
													reminder.isEnabled
														? "text-purple-600 dark:text-purple-400"
														: "text-gray-400"
												}`}
											>
												{reminder.isEnabled ? "On" : "Off"}
											</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
									No reminders yet.
								</p>
							)}

							{!isCompleted && (
								<div className="flex items-center gap-2">
									<input
										type="datetime-local"
										value={newReminder}
										onChange={(e) => setNewReminder(e.target.value)}
										className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all text-base"
									/>
									<button
										type="button"
										onClick={() => addReminderMutation.mutate()}
										disabled={!newReminder || addReminderMutation.isPending}
										className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
											newReminder && !addReminderMutation.isPending
												? "bg-purple-500 text-white hover:bg-purple-600"
												: "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
										}`}
									>
										<Plus className="w-4 h-4" />
										Add
									</button>
								</div>
							)}
						</div>
					</div>

					{!isCompleted && (
						<button
							type="button"
							onClick={() => updateQuestMutation.mutate()}
							disabled={!canSave || updateQuestMutation.isPending}
							className={`w-full mt-6 py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 ${
								canSave && !updateQuestMutation.isPending
									? "bg-linear-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl hover:scale-105"
									: "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
							}`}
						>
							{updateQuestMutation.isPending ? "Saving..." : "Save Changes"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
