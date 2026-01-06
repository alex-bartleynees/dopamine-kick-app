import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronLeft } from "lucide-react";
import { useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
	type HabitReminderForCreation,
	type HabitSearchParams,
	habitSearchSchema,
} from "@/schemas/habit";
import { bulkCreateHabitRemindersFn, getHabitsFn } from "@/server/habits";

export const Route = createFileRoute("/_auth/set-tempo")({
	loader: async () => {
		const habits = await getHabitsFn();
		if (habits.length === 0) {
			throw redirect({
				to: "/choose-habits",
				search: { selectedIds: [], customHabits: [] },
			});
		}
		return { habits };
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

const TIME_OPTIONS = ["Morning", "Afternoon", "Evening", "Night"] as const;

const DEFAULT_REMINDER_TIMES: Record<(typeof TIME_OPTIONS)[number], string> = {
	Morning: "08:00",
	Afternoon: "12:00",
	Evening: "17:00",
	Night: "21:00",
};

const REMINDER_TIME_OPTIONS = [
	{ value: "06:00", label: "6:00 AM" },
	{ value: "07:00", label: "7:00 AM" },
	{ value: "08:00", label: "8:00 AM" },
	{ value: "09:00", label: "9:00 AM" },
	{ value: "10:00", label: "10:00 AM" },
	{ value: "11:00", label: "11:00 AM" },
	{ value: "12:00", label: "12:00 PM" },
	{ value: "13:00", label: "1:00 PM" },
	{ value: "14:00", label: "2:00 PM" },
	{ value: "15:00", label: "3:00 PM" },
	{ value: "16:00", label: "4:00 PM" },
	{ value: "17:00", label: "5:00 PM" },
	{ value: "18:00", label: "6:00 PM" },
	{ value: "19:00", label: "7:00 PM" },
	{ value: "20:00", label: "8:00 PM" },
	{ value: "21:00", label: "9:00 PM" },
];

function RouteComponent() {
	const { habits } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const { csrfToken } = useAuth();

	const [currentIndex, setCurrentIndex] = useState(0);
	const [preferences, setPreferences] = useState<Record<string, Preference>>(
		{},
	);
	const [animationKey, setAnimationKey] = useState(0);

	const createRemindersMutation = useMutation({
		mutationFn: async (reminders: HabitReminderForCreation[]) => {
			return await bulkCreateHabitRemindersFn({
				data: { reminders, csrfToken },
			});
		},
		onSuccess: () => {
			navigate({ to: "/dashboard" });
		},
		onError: (error) => {
			console.error("Failed to create reminders:", error);
			// TODO: Show error toast/message to user
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

	const handleNext = () => {
		if (canProceed) {
			if (isLastHabit) {
				const habitRemindersToCreate = Object.entries(preferences).map(
					([habitId, pref]) => ({
						habitId,
						notificationTime: pref.reminderTime,
						timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
						preferredTime: pref.timePreference ?? "",
						isEnabled: pref.reminderEnabled,
					}),
				);
				createRemindersMutation.mutate(habitRemindersToCreate);
			} else {
				setAnimationKey((k) => k + 1);
				setCurrentIndex((i) => i + 1);
			}
		}
	};

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
									<Select
										value={currentPreference.reminderTime}
										onValueChange={(value) =>
											updatePreference({ reminderTime: value })
										}
									>
										<SelectTrigger className="w-full px-4 py-3 h-auto rounded-xl border border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 bg-white dark:bg-gray-700 dark:text-gray-200">
											<SelectValue placeholder="Select a time" />
										</SelectTrigger>
										<SelectContent>
											{REMINDER_TIME_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					</div>

					{/* Next/Done Button */}
					<button
						type="button"
						onClick={handleNext}
						disabled={!canProceed || createRemindersMutation.isPending}
						className={`w-full mt-6 py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 opacity-0 animate-fade-in-up ${
							canProceed && !createRemindersMutation.isPending
								? "bg-linear-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl hover:scale-105"
								: "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
						}`}
					>
						{isLastHabit ? "Done" : "Next"}
					</button>
				</div>
			</div>
		</div>
	);
}
