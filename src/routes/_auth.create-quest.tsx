import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronLeft, Plus, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { timezone } from "@/lib/timezone";
import { createQuestFn, createQuestReminderFn } from "@/server/quests";

export const Route = createFileRoute("/_auth/create-quest")({
	component: CreateQuest,
});

interface ReminderRow {
	id: number;
	remindAt: string; // datetime-local value
	isEnabled: boolean;
}

// Convert a `datetime-local` value (local time) to an ISO-8601 string with offset.
function localInputToIso(value: string): string {
	return new Date(value).toISOString();
}

function CreateQuest() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { csrfToken } = useAuth();
	const { requestPermission, subscribe, isSupported, permission } =
		usePushNotifications();

	const [emoji, setEmoji] = useState("🎯");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [dueAt, setDueAt] = useState("");
	const [reminders, setReminders] = useState<ReminderRow[]>([]);

	const addReminder = () => {
		setReminders((prev) => [
			...prev,
			{ id: Date.now(), remindAt: dueAt, isEnabled: true },
		]);
	};

	const updateReminder = (id: number, update: Partial<ReminderRow>) => {
		setReminders((prev) =>
			prev.map((r) => (r.id === id ? { ...r, ...update } : r)),
		);
	};

	const removeReminder = (id: number) => {
		setReminders((prev) => prev.filter((r) => r.id !== id));
	};

	const setupPushNotificationsIfNeeded = async () => {
		const hasAnyRemindersEnabled = reminders.some(
			(r) => r.isEnabled && r.remindAt,
		);

		if (!hasAnyRemindersEnabled || !isSupported) {
			return;
		}

		if (permission === "granted") {
			await subscribe();
			return;
		}

		const granted = await requestPermission();
		if (granted) {
			await subscribe();
		}
	};

	const createQuestMutation = useMutation({
		mutationFn: async () => {
			await setupPushNotificationsIfNeeded();

			const quest = await createQuestFn({
				data: {
					emoji,
					title,
					description: description.trim() ? description.trim() : null,
					dueAt: localInputToIso(dueAt),
					csrfToken,
				},
			});

			// Contract has no bulk reminder endpoint — add one at a time.
			for (const reminder of reminders) {
				if (!reminder.remindAt) continue;
				await createQuestReminderFn({
					data: {
						questId: quest.id,
						remindAt: localInputToIso(reminder.remindAt),
						timeZone: timezone,
						isEnabled: reminder.isEnabled,
						csrfToken,
					},
				});
			}

			return quest;
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["quests"] });
			navigate({ to: "/quests" });
		},
		onError: (error) => {
			console.error("Failed to create quest:", error);
		},
	});

	const canSubmit = title.trim().length > 0 && dueAt.length > 0;

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center p-6">
			<div className="max-w-2xl w-full">
				<div className="animate-fade-in-up">
					{/* Back Button */}
					<button
						type="button"
						onClick={() => navigate({ to: "/quests" })}
						className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
					>
						<ChevronLeft className="w-5 h-5" />
						Back
					</button>

					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="mb-3">Create a Quest</h1>
						<p className="text-gray-600 dark:text-gray-300">
							A one-off task to complete by a certain time.
						</p>
					</div>

					{/* Form */}
					<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 space-y-6">
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
									placeholder="e.g., Submit tax return"
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
								placeholder="Add any details..."
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
								<div>
									<div className="font-medium">Reminders</div>
									<div className="text-sm text-gray-500 dark:text-gray-400">
										Get a push notification before it's due
									</div>
								</div>
							</div>

							<div className="space-y-3">
								{reminders.map((reminder) => (
									<div key={reminder.id} className="flex items-center gap-2">
										<input
											type="datetime-local"
											value={reminder.remindAt}
											onChange={(e) =>
												updateReminder(reminder.id, {
													remindAt: e.target.value,
												})
											}
											className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all text-base"
										/>
										<button
											type="button"
											onClick={() =>
												updateReminder(reminder.id, {
													isEnabled: !reminder.isEnabled,
												})
											}
											aria-label={
												reminder.isEnabled
													? "Disable reminder"
													: "Enable reminder"
											}
											className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 ${
												reminder.isEnabled
													? "bg-linear-to-r from-blue-500 to-purple-500"
													: "bg-gray-300 dark:bg-gray-600"
											}`}
										>
											<div
												className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
													reminder.isEnabled ? "translate-x-6" : "translate-x-1"
												}`}
											/>
										</button>
										<button
											type="button"
											onClick={() => removeReminder(reminder.id)}
											aria-label="Remove reminder"
											className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
										>
											<X className="w-5 h-5" />
										</button>
									</div>
								))}
							</div>

							<button
								type="button"
								onClick={addReminder}
								className="mt-3 flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
							>
								<Plus className="w-4 h-4" />
								Add reminder
							</button>
						</div>
					</div>

					{/* Submit Button */}
					<button
						type="button"
						onClick={() => createQuestMutation.mutate()}
						disabled={!canSubmit || createQuestMutation.isPending}
						className={`w-full mt-6 py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 ${
							canSubmit && !createQuestMutation.isPending
								? "bg-linear-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl hover:scale-105"
								: "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
						}`}
					>
						{createQuestMutation.isPending ? "Creating..." : "Create Quest"}
					</button>
				</div>
			</div>
		</div>
	);
}
