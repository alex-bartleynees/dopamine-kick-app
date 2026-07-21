import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Calendar, CreditCard, Plus, Target, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ConfettiParticle } from "@/components/dashboard";
import {
	AllCompleteModal,
	ConfettiParticleComponent,
	HABIT_HISTORY_DAYS,
	HabitCard,
	StatsCard,
} from "@/components/dashboard";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { getLocaleFn } from "@/lib/locale";
import { getTodayDate, isToday, timezone } from "@/lib/timezone";
import type { Habit, HabitCompletions } from "@/schemas/habit";
import {
	getHabitCompletionsFn,
	getHabitsFn,
	setHabitCompletionFn,
} from "@/server/habits";

export const Route = createFileRoute("/_auth/dashboard")({
	loader: async () => {
		const [habits, locale, completions] = await Promise.all([
			getHabitsFn(),
			getLocaleFn(),
			getHabitCompletionsFn({
				data: { days: HABIT_HISTORY_DAYS, timezone },
			}),
		]);
		if (habits.length === 0) {
			throw redirect({
				to: "/choose-habits",
				search: { selectedIds: [], customHabits: [] },
			});
		}
		return { initialHabits: habits, locale, initialCompletions: completions };
	},
	component: Dashboard,
});

function Dashboard() {
	const { initialHabits, locale, initialCompletions } = Route.useLoaderData();
	const { user, csrfToken } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { toast } = useToast();
	const { data: habits = initialHabits } = useQuery({
		queryKey: ["habits"],
		queryFn: async () => {
			return await getHabitsFn();
		},
		initialData: initialHabits,
	});
	const { data: completionsData } = useQuery({
		queryKey: ["habit-completions"],
		queryFn: async () => {
			return await getHabitCompletionsFn({
				data: { days: HABIT_HISTORY_DAYS, timezone },
			});
		},
		initialData: initialCompletions,
	});
	const setHabitCompletedMutation = useMutation({
		mutationFn: async (data: {
			habitId: string;
			csrfToken: string;
			timezone: string;
		}) => {
			return await setHabitCompletionFn({ data });
		},
		onMutate: async ({ habitId }) => {
			await queryClient.cancelQueries({ queryKey: ["habits"] });
			await queryClient.cancelQueries({ queryKey: ["habit-completions"] });
			const previousHabits = queryClient.getQueryData<Habit[]>(["habits"]);
			const previousCompletions =
				queryClient.getQueryData<HabitCompletions | null>([
					"habit-completions",
				]);
			const today = getTodayDate();
			queryClient.setQueryData<Habit[]>(["habits"], (oldHabits) => {
				if (!oldHabits) return oldHabits;
				return oldHabits.map((habit) => {
					if (habit.id === habitId) {
						const newCurrentStreak = (habit.currentStreak ?? 0) + 1;
						return {
							...habit,
							currentStreak: newCurrentStreak,
							longestStreak: Math.max(
								habit.longestStreak ?? 0,
								newCurrentStreak,
							),
							lastCompletedDate: today,
						};
					}
					return habit;
				});
			});
			queryClient.setQueryData<HabitCompletions | null>(
				["habit-completions"],
				(old) => {
					if (!old) return old;
					const dates = old.completions[habitId] ?? [];
					if (dates.includes(today)) return old;
					return {
						...old,
						completions: { ...old.completions, [habitId]: [...dates, today] },
					};
				},
			);
			return { previousHabits, previousCompletions };
		},
		onError: (_err, _variables, context) => {
			if (context?.previousHabits) {
				queryClient.setQueryData(["habits"], context.previousHabits);
			}
			if (context?.previousCompletions !== undefined) {
				queryClient.setQueryData(
					["habit-completions"],
					context.previousCompletions,
				);
			}
			toast("Couldn't save your progress. Please try again.", "error");
		},
		onSuccess: (habit) => {
			const streak = habit.currentStreak ?? 0;
			if (streak > 0 && streak % 7 === 0) {
				toast(`🎉 ${streak} day streak on ${habit.name}!`);
			} else if (streak === 1) {
				toast(`Great start on ${habit.name}! 🎯`);
			} else {
				toast(`${habit.name} completed! 🔥`);
			}

			queryClient.setQueryData<Habit[]>(["habits"], (oldHabits) => {
				if (!oldHabits) return oldHabits;
				return oldHabits.map((h) => (h.id === habit.id ? habit : h));
			});
		},
	});
	const [showAllCompleteModal, setShowAllCompleteModal] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [confettiParticles, setConfettiParticles] = useState<
		ConfettiParticle[]
	>([]);
	const prevAllCompletedRef = useRef<boolean | null>(null);

	const completedCount = habits.filter((h) =>
		isToday(h.lastCompletedDate),
	).length;
	const totalHabits = habits.length;
	const completionPercentage =
		totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;
	const allCompleted = completionPercentage === 100 && totalHabits > 0;

	const longestStreak = useMemo(
		() =>
			Math.max(
				...habits.map((h) => h.longestStreak ?? h.currentStreak ?? 0),
				0,
			),
		[habits],
	);

	const totalDays = useMemo(() => {
		const createdAt = user?.currentUser.createdAt;
		if (!createdAt) return 0;

		const createdDate = new Date(createdAt).toISOString().split("T")[0];
		const todayDate = getTodayDate();
		const diffTime =
			new Date(todayDate).getTime() - new Date(createdDate).getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		return diffDays + 1;
	}, [user?.currentUser.createdAt]);

	const today = useMemo(
		() =>
			new Date().toLocaleDateString(locale, {
				weekday: "long",
				month: "long",
				day: "numeric",
				timeZone: timezone,
			}),
		[locale],
	);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		const wasAllCompleted = prevAllCompletedRef.current;
		prevAllCompletedRef.current = allCompleted;

		// Only show confetti when transitioning from not-all-complete to all-complete
		if (allCompleted && wasAllCompleted === false) {
			const emojis = ["🎉", "✨", "🌟", "🎊", "💫"];
			const particles = Array.from({ length: 20 }, (_, i) => ({
				id: i,
				emoji: emojis[Math.floor(Math.random() * emojis.length)],
				delay: Math.random() * 0.5,
				duration: 2 + Math.random() * 2,
				startX: Math.random() * 100,
			}));
			setShowAllCompleteModal(true);
			setConfettiParticles(particles);
		} else if (!allCompleted) {
			setConfettiParticles([]);
		}
	}, [allCompleted]);

	return (
		<PageShell>
			{/* Header */}
			<header className="bg-card shadow-sm">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="min-w-0">
							<h1 className="mb-1 wrap-break-word text-card-foreground">
								Hey, {user?.currentUser.name}! 👋
							</h1>
							<p className="text-muted-foreground">{today}</p>
						</div>
						<div className="flex items-center justify-between gap-4 sm:justify-end">
							<Button
								variant="gradient"
								onClick={() => navigate({ to: "/quests" })}
								className="shrink-0 rounded-xl"
							>
								<Target className="w-4 h-4" />
								Quests
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => navigate({ to: "/account" })}
								className="shrink-0 rounded-xl"
								aria-label="Membership & billing"
							>
								<CreditCard className="w-5 h-5" />
							</Button>
							<div className="text-right shrink-0">
								<div className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
									{completedCount}/{totalHabits}
								</div>
								<div className="text-sm text-muted-foreground">completed</div>
							</div>
						</div>
					</div>

					{/* Progress Bar */}
					<div className="mt-6">
						<div
							role="progressbar"
							aria-label="Today's habit completion"
							aria-valuenow={Math.round(completionPercentage)}
							aria-valuemin={0}
							aria-valuemax={100}
							className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
						>
							<div
								className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
								style={{ width: mounted ? `${completionPercentage}%` : "0%" }}
							/>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<section className="max-w-4xl mx-auto px-2 sm:px-6 py-8">
				{/* Habits List */}
				<div className="space-y-4 mb-8">
					{habits.map((habit, index) => {
						return (
							<HabitCard
								key={habit.id}
								habit={habit}
								mounted={mounted}
								index={index}
								completedDates={completionsData?.completions[habit.id]}
								onToggle={(habitId: string) => {
									setHabitCompletedMutation.mutate({
										habitId,
										csrfToken,
										timezone,
									});
								}}
								onOpen={(habitId: string) => {
									navigate({
										to: "/habit/$habitId",
										params: { habitId },
									});
								}}
							/>
						);
					})}

					{/* Add More Habits Button */}
					<Button
						variant="gradient"
						size="xl"
						onClick={() =>
							navigate({
								to: "/choose-habits",
								search: { selectedIds: [], customHabits: [] },
							})
						}
						className="w-full"
						style={{
							animationDelay: `${habits.length * 100}ms`,
							opacity: mounted ? 1 : 0,
						}}
					>
						<Plus className="size-5" />
						Add More Habits
					</Button>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<StatsCard
						icon={
							<TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
						}
						iconBgColor="bg-blue-100 dark:bg-blue-900/50"
						label="Longest Streak"
						value={longestStreak}
						mounted={mounted}
						delay="400ms"
					/>
					<StatsCard
						icon={
							<Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
						}
						iconBgColor="bg-purple-100 dark:bg-purple-900/50"
						label="Total Days"
						value={totalDays}
						mounted={mounted}
						delay="500ms"
					/>
				</div>
			</section>

			{allCompleted && confettiParticles.length > 0 && (
				<div className="fixed inset-0 pointer-events-none z-40 overflow-hidden animate-fade-in">
					{confettiParticles.map((particle) => (
						<ConfettiParticleComponent
							key={particle.id}
							emoji={particle.emoji}
							delay={particle.delay}
							duration={particle.duration}
							startX={particle.startX}
						/>
					))}
				</div>
			)}

			{showAllCompleteModal && (
				<AllCompleteModal
					userName={user?.currentUser.name}
					onClose={() => setShowAllCompleteModal(false)}
				/>
			)}
		</PageShell>
	);
}
