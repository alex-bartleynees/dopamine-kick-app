import { Check, Flame } from "lucide-react";
import { getTodayDate, isToday } from "@/lib/timezone";
import type { Habit } from "@/schemas/habit";

/** How many days of history the card shows and the dashboard fetches. */
export const HABIT_HISTORY_DAYS = 7;

interface HabitCardProps {
	habit: Habit;
	mounted: boolean;
	index: number;
	/** Completion dates (YYYY-MM-DD) from the history API; undefined falls back to streak-derived dots. */
	completedDates?: string[];
	onToggle: (habitId: string) => void;
	onOpen: (habitId: string) => void;
}

function formatDate(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}

/** The last `count` calendar dates (oldest first), ending today. */
function getRecentDays(count: number): Date[] {
	const base = new Date(`${getTodayDate()}T00:00:00`);
	return Array.from({ length: count }, (_, i) => {
		const d = new Date(base);
		d.setDate(base.getDate() - (count - 1 - i));
		return d;
	});
}

/**
 * Whether `day` falls inside the current streak window: the `streak`
 * consecutive days ending on `lastCompletedDate`.
 */
function isInStreak(
	day: Date,
	lastCompletedDate: string | null | undefined,
	streak: number,
): boolean {
	if (!lastCompletedDate || streak <= 0) return false;
	const last = new Date(`${lastCompletedDate}T00:00:00`);
	const diffDays = Math.round(
		(last.getTime() - day.getTime()) / (1000 * 60 * 60 * 24),
	);
	return diffDays >= 0 && diffDays < streak;
}

function WeekDots({
	habit,
	completedDates,
}: {
	habit: Habit;
	completedDates?: string[];
}) {
	const days = getRecentDays(HABIT_HISTORY_DAYS);
	const streak = habit.currentStreak ?? 0;
	const completedSet = completedDates ? new Set(completedDates) : null;

	return (
		<div className="flex items-center gap-1.5 mt-4" aria-hidden="true">
			{days.map((day) => {
				const dayKey = formatDate(day);
				const completed = completedSet
					? completedSet.has(dayKey)
					: isInStreak(day, habit.lastCompletedDate, streak);
				const today = isToday(dayKey);
				return (
					<span
						key={dayKey}
						title={dayKey}
						className={`w-2 h-2 rounded-full transition-colors ${
							completed
								? "bg-linear-to-br from-blue-500 to-purple-500"
								: "bg-gray-200 dark:bg-gray-600"
						} ${today ? "ring-2 ring-purple-300 dark:ring-purple-700" : ""}`}
					/>
				);
			})}
			<span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
				{HABIT_HISTORY_DAYS} days
			</span>
		</div>
	);
}

export function HabitCard({
	habit,
	mounted,
	index,
	completedDates,
	onToggle,
	onOpen,
}: HabitCardProps) {
	const completedToday = isToday(habit.lastCompletedDate);
	const progress = {
		completed: completedToday,
		streak: habit.currentStreak ?? 0,
	};
	return (
		<div
			className={`transition-[opacity,transform] duration-500 ${
				mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
			}`}
			style={{ transitionDelay: `${index * 100}ms` }}
		>
			<div
				className={`w-full bg-card rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border-2 ${
					progress.completed
						? "border-purple-400 dark:border-purple-500"
						: "border-transparent dark:border-gray-700"
				}`}
			>
				<div className="flex items-center gap-4 flex-wrap">
					<button
						type="button"
						onClick={() => !completedToday && onToggle(habit.id)}
						disabled={completedToday}
						aria-label={
							completedToday
								? `${habit.name} completed today`
								: `Mark ${habit.name} complete`
						}
						className={`relative shrink-0 w-12 h-12 rounded-xl border-2 transition-[border-color,background-color] duration-300 ${
							progress.completed
								? "bg-linear-to-br from-blue-500 to-purple-500 border-purple-400"
								: "border-gray-300 dark:border-gray-600 hover:border-purple-400"
						}`}
					>
						{progress.completed && (
							<div className="absolute inset-0 flex items-center justify-center animate-check-bounce">
								<Check className="w-7 h-7 text-white" strokeWidth={3} />
							</div>
						)}
					</button>

					<button
						type="button"
						onClick={() => onOpen(habit.id)}
						aria-label={`Edit ${habit.name}`}
						className="flex-1 text-left min-w-20"
					>
						<div className="flex items-center gap-2 mb-1">
							<span className="text-2xl">{habit.emoji}</span>
							<span
								className={`font-medium transition-[color,text-decoration] duration-300 ${
									progress.completed
										? "line-through text-gray-400 dark:text-gray-500"
										: "text-card-foreground"
								}`}
							>
								{habit.name}
							</span>
						</div>
						<div className="text-sm text-gray-500 dark:text-gray-400">
							{habit.target}
						</div>
					</button>

					{progress.streak > 0 && (
						<div className="flex items-center gap-2 bg-linear-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 px-4 py-2 rounded-xl">
							<Flame className="w-5 h-5 text-orange-500" />
							<span className="font-bold text-orange-600 dark:text-orange-400">
								{progress.streak}
							</span>
						</div>
					)}
				</div>

				<WeekDots habit={habit} completedDates={completedDates} />
			</div>
		</div>
	);
}
