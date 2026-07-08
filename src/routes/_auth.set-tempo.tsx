import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
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
	const { toast } = useToast();
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
		onError: () => {
			toast("Couldn't save your habits. Please try again.", "error");
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
		<PageShell center>
			<div className="max-w-2xl w-full">
				<div key={animationKey} className="animate-fade-in-right">
					{/* Back Button */}
					<BackButton onClick={handleBack} />

					{/* Progress Indicator */}
					<div className="mb-8">
						<div className="flex justify-between items-center mb-3">
							<span className="text-sm text-muted-foreground">
								Habit {currentIndex + 1} of {habits.length}
							</span>
							<span className="text-sm font-medium text-purple-600 dark:text-purple-400">
								{Math.round(progressWidth)}%
							</span>
						</div>
						<div
							role="progressbar"
							aria-label="Habit setup progress"
							aria-valuenow={Math.round(progressWidth)}
							aria-valuemin={0}
							aria-valuemax={100}
							className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
						>
							<div
								className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
								style={{ width: `${progressWidth}%` }}
							/>
						</div>
					</div>

					{/* Main Content */}
					<div className="bg-card rounded-3xl shadow-xl p-8">
						{/* Habit Display */}
						<div className="text-center mb-8">
							<div className="text-7xl mb-4 animate-scale-in">
								{currentHabit?.emoji}
							</div>
							<h2 className="mb-2">
								What time works best for {currentHabit?.name.toLowerCase()}?
							</h2>
							<p className="text-muted-foreground">{currentHabit?.target}</p>
						</div>

						{/* Time Preference Buttons */}
						<div className="mb-8">
							<p className="block text-sm mb-3 text-muted-foreground">
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
						<div className="border-t border-border pt-6">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
										<Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
									</div>
									<div>
										<div className="font-medium">Remind me</div>
										<div className="text-sm text-muted-foreground">
											Get daily notifications
										</div>
									</div>
								</div>
								<Switch
									checked={currentPreference.reminderEnabled}
									onCheckedChange={(reminderEnabled) =>
										updatePreference({ reminderEnabled })
									}
									aria-label="Remind me with daily notifications"
								/>
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
									<p className="block text-sm mb-2 text-muted-foreground">
										Reminder time
									</p>
									<Input
										type="time"
										value={currentPreference.reminderTime}
										onChange={(e) =>
											updatePreference({ reminderTime: e.target.value })
										}
										className="h-auto px-4 py-3 rounded-xl"
										aria-label="Reminder time"
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
					<Button
						variant="gradient"
						size="xl"
						onClick={handleNext}
						disabled={!canProceed || createHabitsAndRemindersMutation.isPending}
						className="w-full mt-6 opacity-0 animate-fade-in-up"
					>
						{createHabitsAndRemindersMutation.isPending
							? "Setting up..."
							: isLastHabit
								? "Done"
								: "Next"}
					</Button>
				</div>
			</div>
		</PageShell>
	);
}
