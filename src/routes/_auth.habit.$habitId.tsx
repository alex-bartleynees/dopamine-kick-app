import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
	DEFAULT_REMINDER_TIMES,
	fromApiTime,
	REMINDER_TIME_OPTIONS,
	TIME_OPTIONS,
	toApiTime,
} from "@/lib/reminder-times";
import { timezone } from "@/lib/timezone";
import type { Habit, HabitReminder } from "@/schemas/habit";
import {
	createHabitReminderFn,
	deleteHabitFn,
	deleteHabitReminderFn,
	getHabitFn,
	getHabitRemindersFn,
	updateHabitFn,
	updateHabitReminderFn,
} from "@/server/habits";

export const Route = createFileRoute("/_auth/habit/$habitId")({
	loader: async ({ params }) => {
		const [habit, reminders] = await Promise.all([
			getHabitFn({ data: params.habitId }),
			getHabitRemindersFn({ data: params.habitId }),
		]);
		return { habit, reminders };
	},
	component: HabitDetail,
});

function HabitDetail() {
	const { habit: initialHabit, reminders: initialReminders } =
		Route.useLoaderData();
	const { habitId } = Route.useParams();
	const { csrfToken } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { requestPermission, subscribe, isSupported, permission } =
		usePushNotifications();

	const { data: habit = initialHabit } = useQuery({
		queryKey: ["habit", habitId],
		queryFn: async () => getHabitFn({ data: habitId }),
		initialData: initialHabit,
	});

	const { data: reminders = initialReminders } = useQuery({
		queryKey: ["habit-reminders", habitId],
		queryFn: async () => getHabitRemindersFn({ data: habitId }),
		initialData: initialReminders,
	});

	const emojiId = useId();
	const nameId = useId();
	const targetId = useId();
	const [emoji, setEmoji] = useState(habit.emoji);
	const [name, setName] = useState(habit.name);
	const [target, setTarget] = useState(habit.target);
	const [newTime, setNewTime] = useState(DEFAULT_REMINDER_TIMES.Morning);
	const [newPreferred, setNewPreferred] = useState<string>("Morning");
	const [hasPromptedForNotifications, setHasPromptedForNotifications] =
		useState(false);

	const ensurePushSubscription = async () => {
		if (!isSupported) return;
		if (permission === "granted") {
			await subscribe();
			return;
		}
		if (!hasPromptedForNotifications) {
			setHasPromptedForNotifications(true);
			const granted = await requestPermission();
			if (granted) {
				await subscribe();
			}
		}
	};

	const refreshReminders = async () => {
		await queryClient.invalidateQueries({
			queryKey: ["habit-reminders", habitId],
		});
	};

	const updateHabitMutation = useMutation({
		mutationFn: async () => {
			return await updateHabitFn({
				data: {
					habitId,
					name: name.trim(),
					emoji: emoji.trim(),
					target: target.trim(),
					csrfToken,
				},
			});
		},
		onSuccess: async (updated: Habit) => {
			queryClient.setQueryData(["habit", habitId], updated);
			await queryClient.invalidateQueries({ queryKey: ["habit", habitId] });
			await queryClient.invalidateQueries({ queryKey: ["habits"] });
			navigate({ to: "/dashboard" });
		},
		onError: (error) => {
			console.error("Failed to update habit:", error);
		},
	});

	const deleteHabitMutation = useMutation({
		mutationFn: async () => {
			return await deleteHabitFn({ data: { habitId, csrfToken } });
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["habits"] });
			navigate({ to: "/dashboard" });
		},
		onError: (error) => {
			console.error("Failed to delete habit:", error);
		},
	});

	const updateReminderMutation = useMutation({
		mutationFn: async (data: {
			reminder: HabitReminder;
			patch: Partial<HabitReminder>;
		}) => {
			const merged = { ...data.reminder, ...data.patch };
			if (merged.isEnabled) {
				await ensurePushSubscription();
			}
			return await updateHabitReminderFn({
				data: {
					habitId,
					reminderId: merged.id,
					notificationTime: merged.notificationTime,
					timeZone: merged.timeZone,
					preferredTime: merged.preferredTime,
					isEnabled: merged.isEnabled,
					csrfToken,
				},
			});
		},
		onSuccess: refreshReminders,
		onError: (error) => {
			console.error("Failed to update reminder:", error);
		},
	});

	const deleteReminderMutation = useMutation({
		mutationFn: async (reminderId: string) => {
			return await deleteHabitReminderFn({
				data: { habitId, reminderId, csrfToken },
			});
		},
		onSuccess: refreshReminders,
		onError: (error) => {
			console.error("Failed to delete reminder:", error);
		},
	});

	const addReminderMutation = useMutation({
		mutationFn: async () => {
			await ensurePushSubscription();
			return await createHabitReminderFn({
				data: {
					habitId,
					notificationTime: toApiTime(newTime),
					timeZone: timezone,
					preferredTime: newPreferred,
					isEnabled: true,
					csrfToken,
				},
			});
		},
		onSuccess: async () => {
			setNewTime(DEFAULT_REMINDER_TIMES.Morning);
			setNewPreferred("Morning");
			await refreshReminders();
		},
		onError: (error) => {
			console.error("Failed to add reminder:", error);
		},
	});

	const canSave =
		name.trim().length > 0 &&
		emoji.trim().length > 0 &&
		target.trim().length > 0;

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center p-6">
			<div className="max-w-2xl w-full">
				<div className="animate-fade-in-up">
					<button
						type="button"
						onClick={() => navigate({ to: "/dashboard" })}
						className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
					>
						<ChevronLeft className="w-5 h-5" />
						Back
					</button>

					<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 space-y-6">
						<div className="flex gap-4">
							<div className="w-24">
								<label
									htmlFor={emojiId}
									className="block text-sm mb-2 text-gray-700 dark:text-gray-300"
								>
									Emoji
								</label>
								<input
									id={emojiId}
									type="text"
									value={emoji}
									onChange={(e) => setEmoji(e.target.value)}
									maxLength={10}
									className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all text-center text-3xl"
								/>
							</div>
							<div className="flex-1">
								<label
									htmlFor={nameId}
									className="block text-sm mb-2 text-gray-700 dark:text-gray-300"
								>
									Name
								</label>
								<input
									id={nameId}
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									maxLength={100}
									className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor={targetId}
								className="block text-sm mb-2 text-gray-700 dark:text-gray-300"
							>
								Target
							</label>
							<input
								id={targetId}
								type="text"
								value={target}
								onChange={(e) => setTarget(e.target.value)}
								maxLength={200}
								className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all"
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

							{reminders.length > 0 ? (
								<ul className="space-y-3 mb-6">
									{reminders.map((reminder) => (
										<li
											key={reminder.id}
											className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 space-y-3"
										>
											<div className="flex items-center gap-2">
												<input
													type="time"
													value={fromApiTime(reminder.notificationTime)}
													onChange={(e) =>
														updateReminderMutation.mutate({
															reminder,
															patch: {
																notificationTime: toApiTime(e.target.value),
															},
														})
													}
													className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all text-base"
												/>
												<button
													type="button"
													onClick={() =>
														updateReminderMutation.mutate({
															reminder,
															patch: { isEnabled: !reminder.isEnabled },
														})
													}
													aria-label={
														reminder.isEnabled
															? "Disable reminder"
															: "Enable reminder"
													}
													className={`relative w-14 h-8 shrink-0 rounded-full transition-colors duration-300 ${
														reminder.isEnabled
															? "bg-linear-to-r from-blue-500 to-purple-500"
															: "bg-gray-300 dark:bg-gray-600"
													}`}
												>
													<div
														className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${
															reminder.isEnabled
																? "translate-x-6.5"
																: "translate-x-0.5"
														}`}
													/>
												</button>
												<button
													type="button"
													onClick={() =>
														deleteReminderMutation.mutate(reminder.id)
													}
													aria-label="Delete reminder"
													className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
												>
													<Trash2 className="w-5 h-5" />
												</button>
											</div>
											<div className="flex flex-wrap gap-2">
												{TIME_OPTIONS.map((option) => (
													<button
														type="button"
														key={option}
														onClick={() =>
															updateReminderMutation.mutate({
																reminder,
																patch: { preferredTime: option },
															})
														}
														className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
															reminder.preferredTime === option
																? "bg-purple-500 text-white shadow-md"
																: "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500"
														}`}
													>
														{option}
													</button>
												))}
											</div>
										</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
									No reminders yet.
								</p>
							)}

							{/* Add reminder */}
							<div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 space-y-3">
								<p className="text-sm text-gray-700 dark:text-gray-300">
									Add a reminder
								</p>
								<div className="flex items-center gap-2">
									<input
										type="time"
										value={newTime}
										onChange={(e) => setNewTime(e.target.value)}
										className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 outline-none transition-all text-base"
									/>
									<button
										type="button"
										onClick={() => addReminderMutation.mutate()}
										disabled={addReminderMutation.isPending}
										className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
											addReminderMutation.isPending
												? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
												: "bg-purple-500 text-white hover:bg-purple-600"
										}`}
									>
										<Plus className="w-4 h-4" />
										Add
									</button>
								</div>
								<div className="flex flex-wrap gap-2">
									{REMINDER_TIME_OPTIONS.map((option) => (
										<button
											type="button"
											key={option.value}
											onClick={() => setNewTime(option.value)}
											className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
												newTime === option.value
													? "bg-purple-500 text-white shadow-md"
													: "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500"
											}`}
										>
											{option.label}
										</button>
									))}
								</div>
								<div className="flex flex-wrap gap-2">
									{TIME_OPTIONS.map((option) => (
										<button
											type="button"
											key={option}
											onClick={() => {
												setNewPreferred(option);
												setNewTime(DEFAULT_REMINDER_TIMES[option]);
											}}
											className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
												newPreferred === option
													? "bg-blue-500 text-white shadow-md"
													: "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500"
											}`}
										>
											{option}
										</button>
									))}
								</div>
							</div>
						</div>
					</div>

					<button
						type="button"
						onClick={() => updateHabitMutation.mutate()}
						disabled={!canSave || updateHabitMutation.isPending}
						className={`w-full mt-6 py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 ${
							canSave && !updateHabitMutation.isPending
								? "bg-linear-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl hover:scale-105"
								: "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
						}`}
					>
						{updateHabitMutation.isPending ? "Saving..." : "Save Changes"}
					</button>

					<button
						type="button"
						onClick={() => {
							if (
								window.confirm(
									`Delete "${habit.name}"? This also removes its reminders.`,
								)
							) {
								deleteHabitMutation.mutate();
							}
						}}
						disabled={deleteHabitMutation.isPending}
						className="w-full mt-3 py-3 px-8 rounded-2xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
					>
						<Trash2 className="w-5 h-5" />
						{deleteHabitMutation.isPending ? "Deleting..." : "Delete Habit"}
					</button>
				</div>
			</div>
		</div>
	);
}
