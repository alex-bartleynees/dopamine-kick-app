import { Check, Clock, Trash2 } from "lucide-react";
import { timezone } from "@/lib/timezone";
import type { Quest } from "@/schemas/quest";

interface QuestCardProps {
	quest: Quest;
	mounted: boolean;
	index: number;
	locale: string;
	onComplete: (questId: string) => void;
	onDelete: (questId: string) => void;
	onOpen: (questId: string) => void;
}

function formatDueDate(dueAt: string, locale: string): string {
	return new Date(dueAt).toLocaleString(locale, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZone: timezone,
	});
}

export function QuestCard({
	quest,
	mounted,
	index,
	locale,
	onComplete,
	onDelete,
	onOpen,
}: QuestCardProps) {
	const isCompleted = quest.status === "Completed";
	const isOverdue =
		!isCompleted && new Date(quest.dueAt).getTime() < Date.now();

	return (
		<div
			className={`transition-[opacity,transform] duration-500 ${
				mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
			}`}
			style={{ transitionDelay: `${index * 100}ms` }}
		>
			<div
				className={`w-full bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border-2 ${
					isCompleted
						? "border-purple-400 dark:border-purple-500"
						: isOverdue
							? "border-red-300 dark:border-red-500/60"
							: "border-transparent dark:border-gray-700"
				}`}
			>
				<div className="flex items-center gap-4 flex-wrap">
					<button
						type="button"
						onClick={() => !isCompleted && onComplete(quest.id)}
						disabled={isCompleted}
						aria-label={isCompleted ? "Quest completed" : "Mark quest complete"}
						className={`relative shrink-0 w-12 h-12 rounded-xl border-2 transition-[border-color,background-color] duration-300 ${
							isCompleted
								? "bg-linear-to-br from-blue-500 to-purple-500 border-purple-400"
								: "border-gray-300 dark:border-gray-600 hover:border-purple-400"
						}`}
					>
						{isCompleted && (
							<div className="absolute inset-0 flex items-center justify-center animate-check-bounce">
								<Check className="w-7 h-7 text-white" strokeWidth={3} />
							</div>
						)}
					</button>

					<button
						type="button"
						onClick={() => onOpen(quest.id)}
						className="flex-1 text-left min-w-20"
					>
						<div className="flex items-center gap-2 mb-1">
							<span className="text-2xl">{quest.emoji}</span>
							<span
								className={`font-medium transition-[color,text-decoration] duration-300 ${
									isCompleted
										? "line-through text-gray-400 dark:text-gray-500"
										: "dark:text-gray-200"
								}`}
							>
								{quest.title}
							</span>
						</div>
						<div
							className={`flex items-center gap-1.5 text-sm ${
								isOverdue
									? "text-red-500 dark:text-red-400"
									: "text-gray-500 dark:text-gray-400"
							}`}
						>
							<Clock className="w-4 h-4" />
							<span>
								{isOverdue ? "Overdue · " : ""}
								{formatDueDate(quest.dueAt, locale)}
							</span>
						</div>
					</button>

					<button
						type="button"
						onClick={() => onDelete(quest.id)}
						aria-label="Delete quest"
						className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
					>
						<Trash2 className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
}
