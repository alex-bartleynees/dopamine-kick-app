import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
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

const fieldClasses = "h-auto px-4 py-3 rounded-xl";

function HabitDetail() {
	const { habit: initialHabit, reminders: initialReminders } =
		Route.useLoaderData();
	const { habitId } = Route.useParams();
	const { csrfToken } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { toast } = useToast();
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
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
		onError: () => {
			toast("Couldn't save your changes. Please try again.", "error");
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
		onError: () => {
			toast("Couldn't delete the habit. Please try again.", "error");
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
		onError: () => {
			toast("Couldn't update the reminder. Please try again.", "error");
		},
	});

	const deleteReminderMutation = useMutation({
		mutationFn: async (reminderId: string) => {
			return await deleteHabitReminderFn({
				data: { habitId, reminderId, csrfToken },
			});
		},
		onSuccess: refreshReminders,
		onError: () => {
			toast("Couldn't delete the reminder. Please try again.", "error");
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
		onError: () => {
			toast("Couldn't add the reminder. Please try again.", "error");
		},
	});

	const canSave =
		name.trim().length > 0 &&
		emoji.trim().length > 0 &&
		target.trim().length > 0;

	return (
		<PageShell center>
			<div className="max-w-2xl w-full">
				<div className="animate-fade-in-up">
					<BackButton onClick={() => navigate({ to: "/dashboard" })} />

					<div className="bg-card rounded-3xl shadow-xl p-8 space-y-6">
						<div className="flex gap-4">
							<div className="w-24">
								<label
									htmlFor={emojiId}
									className="block text-sm mb-2 text-muted-foreground"
								>
									Emoji
								</label>
								<Input
									id={emojiId}
									type="text"
									value={emoji}
									onChange={(e) => setEmoji(e.target.value)}
									maxLength={10}
									className={`${fieldClasses} text-center text-3xl`}
								/>
							</div>
							<div className="flex-1">
								<label
									htmlFor={nameId}
									className="block text-sm mb-2 text-muted-foreground"
								>
									Name
								</label>
								<Input
									id={nameId}
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									maxLength={100}
									className={fieldClasses}
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor={targetId}
								className="block text-sm mb-2 text-muted-foreground"
							>
								Target
							</label>
							<Input
								id={targetId}
								type="text"
								value={target}
								onChange={(e) => setTarget(e.target.value)}
								maxLength={200}
								className={fieldClasses}
							/>
						</div>

						{/* Reminders */}
						<div className="border-t border-border pt-6">
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
												<Input
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
													className="flex-1 h-auto px-4 py-2.5 rounded-xl"
													aria-label="Reminder time"
												/>
												<Switch
													checked={reminder.isEnabled}
													onCheckedChange={(isEnabled) =>
														updateReminderMutation.mutate({
															reminder,
															patch: { isEnabled },
														})
													}
													aria-label={
														reminder.isEnabled
															? "Disable reminder"
															: "Enable reminder"
													}
												/>
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
								<p className="text-sm text-muted-foreground mb-6">
									No reminders yet.
								</p>
							)}

							{/* Add reminder */}
							<div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 space-y-3">
								<p className="text-sm text-muted-foreground">Add a reminder</p>
								<div className="flex items-center gap-2">
									<Input
										type="time"
										value={newTime}
										onChange={(e) => setNewTime(e.target.value)}
										className="flex-1 h-auto px-4 py-2.5 rounded-xl"
										aria-label="New reminder time"
									/>
									<Button
										variant="gradient"
										onClick={() => addReminderMutation.mutate()}
										disabled={addReminderMutation.isPending}
										className="shrink-0 h-auto px-4 py-2.5 rounded-xl"
									>
										<Plus className="w-4 h-4" />
										Add
									</Button>
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

					<Button
						variant="gradient"
						size="xl"
						onClick={() => updateHabitMutation.mutate()}
						disabled={!canSave || updateHabitMutation.isPending}
						className="w-full mt-6"
					>
						{updateHabitMutation.isPending ? "Saving..." : "Save Changes"}
					</Button>

					<button
						type="button"
						onClick={() => setShowDeleteConfirm(true)}
						disabled={deleteHabitMutation.isPending}
						className="w-full mt-3 py-3 px-8 rounded-2xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
					>
						<Trash2 className="w-5 h-5" />
						{deleteHabitMutation.isPending ? "Deleting..." : "Delete Habit"}
					</button>
				</div>
			</div>

			{/* Delete Confirmation */}
			{showDeleteConfirm && (
				<Modal
					onClose={() => setShowDeleteConfirm(false)}
					aria-labelledby="delete-habit-title"
				>
					<h2 id="delete-habit-title" className="mb-3">
						Delete habit?
					</h2>
					<p className="text-muted-foreground mb-6">
						"{habit.name}" and its reminders will be permanently deleted. This
						can't be undone.
					</p>
					<div className="flex gap-3">
						<Button
							variant="outline"
							size="xl"
							onClick={() => setShowDeleteConfirm(false)}
							className="flex-1 rounded-xl"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="xl"
							onClick={() => {
								setShowDeleteConfirm(false);
								deleteHabitMutation.mutate();
							}}
							className="flex-1 rounded-xl"
						>
							Delete
						</Button>
					</div>
				</Modal>
			)}
		</PageShell>
	);
}
