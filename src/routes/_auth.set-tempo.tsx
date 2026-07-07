import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
	DEFAULT_REMINDER_TIMES,
	REMINDER_TIME_OPTIONS,
	TIME_OPTIONS,
	toApiTime,
} from "@/lib/reminder-times";
import {
	type BulkHabitReminderItem,
	DEFAULT_HABITS,
	type Habit,
	type HabitSearchParams,
	habitSearchSchema,
} from "@/schemas/habit";
import {
	bulkCreateHabitRemindersFn,
	bulkCreateHabitsFn,
	getHabitsFn,
} from "@/server/habits";

export const Route = createFileRoute("/_auth/set-tempo")({
	loader: async () => {
		const existingHabits = await getHabitsFn();
		return { existingHabits };
	},
	component: RouteComponent,
	validateSearch: (search: Record<string, unknown>): HabitSearchParams => {
		const result = habitSearchSchema.safeParse(search);
		if (result.success) {
			return result.data;
		}
		return { selectedIds: [], customHabits: [] };
	},
});

interface Preference {
	timePreference: string | null;
	reminderEnabled: boolean;
	reminderTime: string;
}

function RouteComponent() {
	const { existingHabits } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { csrfToken } = useAuth();
	const { requestPermission, subscribe, isSupported, permission } =
		usePushNotifications();

	const [currentIndex, setCurrentIndex] = useState(0);
	const [preferences, setPreferences] = useState<Record<string, Preference>>(
		{},
	);
	const [animationKey, setAnimationKey] = useState(0);
	const [hasPromptedForNotifications, setHasPromptedForNotifications] =
		useState(false);

	// Derive habits from URL params (new habits being added) or existing habits (just updating tempo)
	const selectedHabitsFromParams = useMemo(() => {
		const habits: Habit[] = [];
		for (const id of search.selectedIds) {
			const defaultHabit = DEFAULT_HABITS.find((h) => h.id === id);
			if (defaultHabit) {
				habits.push(defaultHabit);
			}
		}
		for (const customHabit of search.customHabits) {
			habits.push(customHabit);
		}
		return habits;
	}, [search.selectedIds, search.customHabits]);

	const hasNewHabitsToSave = selectedHabitsFromParams.length > 0;
	const habits = hasNewHabitsToSave ? selectedHabitsFromParams : existingHabits;

	const createHabitsAndRemindersMutation = useMutation({
		mutationFn: async (data: {
			habitsToCreate: Array<{ name: string; emoji: string; target: string }>;
			preferences: Record<string, Preference>;
			habitsList: Habit[];
		}) => {
			const { habitsToCreate, preferences: prefs, habitsList } = data;

			// Save new habits if any
			if (habitsToCreate.length > 0) {
				await bulkCreateHabitsFn({
					data: { habits: habitsToCreate, csrfToken },
				});
			}

			// Fetch all habits to get real IDs (including newly created ones)
			const allHabits = await getHabitsFn();

			// Map preferences to real habit IDs by matching names
			const reminders: BulkHabitReminderItem[] = habitsList.map((habit) => {
				const dbHabit = allHabits.find((h) => h.name === habit.name);
				const pref = prefs[habit.id];

				return {
					habitId: dbHabit?.id ?? "",
					notificationTime: toApiTime(pref.reminderTime),
					timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
					preferredTime: pref.timePreference ?? "Morning",
					isEnabled: pref.reminderEnabled,
				};
			});

			// Create reminders
			return await bulkCreateHabitRemindersFn({
				data: { reminders, csrfToken },
			});
		},
		onSuccess: async () => {
			// Invalidate habits query to force refetch on dashboard
			await queryClient.invalidateQueries({ queryKey: ["habits"] });
			navigate({ to: "/dashboard" });
		},
		onError: (error) => {
			console.error("Failed to create habits and reminders:", error);
		},
	});

	const currentHabit = habits.length > 0 ? habits[currentIndex] : null;
	const currentPreference = preferences[currentHabit?.id ?? ""] || {
		timePreference: null,
		reminderEnabled: false,
		reminderTime: "09:00",
	};
	const isLastHabit = currentIndex === habits.length - 1;
	const canProceed = currentPreference.timePreference !== null;

	const updatePreference = (update: Partial<Preference>) => {
		setPreferences((prev) => ({
			...prev,
			[currentHabit?.id ?? ""]: { ...currentPreference, ...update },
		}));
	};

	const handleBack = () => {
		if (currentIndex === 0) {
			navigate({
				to: "/choose-habits",
				search: {
					selectedIds: search.selectedIds,
					customHabits: search.customHabits,
				},
			});
		} else {
			setAnimationKey((k) => k + 1);
			setCurrentIndex((i) => i - 1);
		}
	};

	const handleNext = async () => {
		if (!canProceed) {
			return;
		}

		if (!isLastHabit) {
			setAnimationKey((k) => k + 1);
			setCurrentIndex((i) => i + 1);
			return;
		}

		await setupPushNotificationsIfNeeded();

		// Determine which habits need to be created (filter out existing ones by name)
		const existingNames = new Set(existingHabits.map((h) => h.name));
		const habitsToCreate = hasNewHabitsToSave
			? habits
					.map((habit) => ({
						name: habit.name,
						emoji: habit.emoji,
						target: habit.target,
					}))
					.filter((habit) => !existingNames.has(habit.name))
			: [];

		// Create habits and reminders
		createHabitsAndRemindersMutation.mutate({
			habitsToCreate,
			preferences,
			habitsList: habits,
		});
	};

	const setupPushNotificationsIfNeeded = async () => {
		const hasAnyRemindersEnabled = Object.values(preferences).some(
			(pref) => pref.reminderEnabled,
		);

		if (!hasAnyRemindersEnabled || !isSupported) {
			return;
		}

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

	// Redirect if no habits available (must be after all hooks)
	if (habits.length === 0) {
		navigate({
			to: "/choose-habits",
			search: { selectedIds: [], customHabits: [] },
			replace: true,
		});
		return null;
	}

	const progressWidth = ((currentIndex + 1) / habits.length) * 100;

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 flex items-center justify-center p-6">
			<div className="max-w-2xl w-full">
				<div key={animationKey} className="animate-fade-in-right">
					{/* Back Button */}
					<button
						type="button"
						onClick={handleBack}
						className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
					>
						<ChevronLeft className="w-5 h-5" />
						Back
					</button>

					{/* Progress Indicator */}
					<div className="mb-8">
						<div className="flex justify-between items-center mb-3">
							<span className="text-sm text-gray-600 dark:text-gray-400">
								Habit {currentIndex + 1} of {habits.length}
							</span>
							<span className="text-sm font-medium text-purple-600 dark:text-purple-400">
								{Math.round(progressWidth)}%
							</span>
						</div>
						<div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
							<div
								className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
								style={{ width: `${progressWidth}%` }}
							/>
						</div>
					</div>

					{/* Main Content */}
					<div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
						{/* Habit Display */}
						<div className="text-center mb-8">
							<div className="text-7xl mb-4 animate-scale-in">
								{currentHabit?.emoji}
							</div>
							<h2 className="mb-2">
								What time works best for {currentHabit?.name.toLowerCase()}?
							</h2>
							<p className="text-gray-600 dark:text-gray-400">
								{currentHabit?.target}
							</p>
						</div>

						{/* Time Preference Buttons */}
						<div className="mb-8">
							<p className="block text-sm mb-3 text-gray-700 dark:text-gray-300">
								Choose your preferred time
							</p>
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
								{TIME_OPTIONS.map((time) => {
									const isSelected = currentPreference.timePreference === time;
									return (
										<button
											type="button"
											key={time}
											onClick={() =>
												updatePreference({
													timePreference: time,
													reminderTime: DEFAULT_REMINDER_TIMES[time],
												})
											}
											className={`py-3 px-4 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
												isSelected
													? "bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-lg"
													: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
											}`}
										>
											{time}
										</button>
									);
								})}
							</div>
						</div>

						{/* Reminder Toggle */}
						<div className="border-t border-gray-200 dark:border-gray-700 pt-6">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
										<Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
									</div>
									<div>
										<div className="font-medium">Remind me</div>
										<div className="text-sm text-gray-500 dark:text-gray-400">
											Get daily notifications
										</div>
									</div>
								</div>
								<button
									type="button"
									onClick={() =>
										updatePreference({
											reminderEnabled: !currentPreference.reminderEnabled,
										})
									}
									className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
										currentPreference.reminderEnabled
											? "bg-linear-to-r from-blue-500 to-purple-500"
											: "bg-gray-300 dark:bg-gray-600"
									}`}
								>
									<div
										className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
											currentPreference.reminderEnabled
												? "translate-x-6.5"
												: "translate-x-0.5"
										}`}
									/>
								</button>
							</div>

							{/* Time Picker */}
							<div
								className={`grid transition-all duration-300 ease-out ${
									currentPreference.reminderEnabled
										? "grid-rows-[1fr] opacity-100"
										: "grid-rows-[0fr] opacity-0"
								}`}
							>
								<div className="overflow-hidden">
									<p className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
										Reminder time
									</p>
									<input
										type="time"
										value={currentPreference.reminderTime}
										onChange={(e) =>
											updatePreference({ reminderTime: e.target.value })
										}
										className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 bg-white dark:bg-gray-700 dark:text-gray-200 text-base"
									/>
									<div className="mt-3 flex flex-wrap gap-2">
										{REMINDER_TIME_OPTIONS.map((option) => (
											<button
												type="button"
												key={option.value}
												onClick={() =>
													updatePreference({ reminderTime: option.value })
												}
												className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
													currentPreference.reminderTime === option.value
														? "bg-purple-500 text-white shadow-md"
														: "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500"
												}`}
											>
												{option.label}
											</button>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Next/Done Button */}
					<button
						type="button"
						onClick={handleNext}
						disabled={!canProceed || createHabitsAndRemindersMutation.isPending}
						className={`w-full mt-6 py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 opacity-0 animate-fade-in-up ${
							canProceed && !createHabitsAndRemindersMutation.isPending
								? "bg-linear-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl hover:scale-105"
								: "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
						}`}
					>
						{createHabitsAndRemindersMutation.isPending
							? "Setting up..."
							: isLastHabit
								? "Done"
								: "Next"}
					</button>
				</div>
			</div>
		</div>
	);
}
