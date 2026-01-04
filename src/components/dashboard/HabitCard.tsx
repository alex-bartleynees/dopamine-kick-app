import { Check, Flame } from "lucide-react";
import type { Habit } from "@/schemas/habit";

export interface HabitProgress {
	habitId: string;
	completed: boolean;
	streak: number;
}

interface HabitCardProps {
	habit: Habit;
	progress: HabitProgress;
	mounted: boolean;
	index: number;
	onToggle: (habitId: string) => void;
}

export function HabitCard({
	habit,
	progress,
	mounted,
	index,
	onToggle,
}: HabitCardProps) {
	return (
		<div
			className={`transition-[opacity,transform] duration-500 ${
				mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
			}`}
			style={{ transitionDelay: `${index * 100}ms` }}
		>
			<button
				type="button"
				onClick={() => onToggle(habit.id)}
				className={`w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border-2 ${
					progress.completed
						? "border-purple-400 dark:border-purple-500"
						: "border-transparent dark:border-gray-700"
				}`}
			>
				<div className="flex items-center gap-4">
					<div
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
					</div>

					<div className="flex-1 text-left">
						<div className="flex items-center gap-2 mb-1">
							<span className="text-2xl">{habit.emoji}</span>
							<span
								className={`font-medium transition-[color,text-decoration] duration-300 ${
									progress.completed
										? "line-through text-gray-400 dark:text-gray-500"
										: "dark:text-gray-200"
								}`}
							>
								{habit.name}
							</span>
						</div>
						<div className="text-sm text-gray-500 dark:text-gray-400">
							{habit.target}
						</div>
					</div>

					{progress.streak > 0 && (
						<div className="flex items-center gap-2 bg-linear-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 px-4 py-2 rounded-xl">
							<Flame className="w-5 h-5 text-orange-500" />
							<span className="font-bold text-orange-600 dark:text-orange-400">
								{progress.streak}
							</span>
						</div>
					)}
				</div>
			</button>
		</div>
	);
}
