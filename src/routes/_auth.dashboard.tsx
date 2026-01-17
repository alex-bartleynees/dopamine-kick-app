import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Calendar, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ConfettiParticle } from "@/components/dashboard";
import {
	AllCompleteModal,
	CelebrationToast,
	ConfettiParticleComponent,
	HabitCard,
	StatsCard,
} from "@/components/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { getTodayDate, isToday, timezone } from "@/lib/timezone";
import type { Habit } from "@/schemas/habit";
import { getHabitsFn, setHabitCompletionFn } from "@/server/habits";

export const Route = createFileRoute("/_auth/dashboard")({
	loader: async () => {
		const habits = await getHabitsFn();
		if (habits.length === 0) {
			throw redirect({
				to: "/choose-habits",
				search: { selectedIds: [], customHabits: [] },
			});
		}
		return { initialHabits: habits };
	},
	component: Dashboard,
});

function Dashboard() {
	const { initialHabits } = Route.useLoaderData();
	const { user, csrfToken } = useAuth();
	const queryClient = useQueryClient();
	const { data: habits = initialHabits } = useQuery({
		queryKey: ["habits"],
		queryFn: async () => {
			return await getHabitsFn();
		},
		initialData: initialHabits,
		refetchOnMount: false,
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
			const previousHabits = queryClient.getQueryData<Habit[]>(["habits"]);
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
							lastCompletedDate: getTodayDate(),
						};
					}
					return habit;
				});
			});
			return { previousHabits };
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["habits"] });
		},
		onError: (_err, _variables, context) => {
			if (context?.previousHabits) {
				queryClient.setQueryData(["habits"], context.previousHabits);
			}
		},
		onSuccess: (habit) => {
			const streak = habit.currentStreak ?? 0;
			if (streak > 0 && streak % 7 === 0) {
				setCelebrationMessage(`🎉 ${streak} day streak on ${habit.name}!`);
			} else if (streak === 1) {
				setCelebrationMessage(`Great start on ${habit.name}! 🎯`);
			} else {
				setCelebrationMessage(`${habit.name} completed! 🔥`);
			}

			if (celebrationTimeoutRef.current) {
				clearTimeout(celebrationTimeoutRef.current);
			}
			setShowCelebration(true);
			celebrationTimeoutRef.current = setTimeout(
				() => setShowCelebration(false),
				3000,
			);
		},
	});
	const [showCelebration, setShowCelebration] = useState(false);
	const [celebrationMessage, setCelebrationMessage] = useState("");
	const [showAllCompleteModal, setShowAllCompleteModal] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [confettiParticles, setConfettiParticles] = useState<
		ConfettiParticle[]
	>([]);
	const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
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
			new Date().toLocaleDateString(undefined, {
				weekday: "long",
				month: "long",
				day: "numeric",
				timeZone: timezone,
			}),
		[],
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

	useEffect(() => {
		return () => {
			if (celebrationTimeoutRef.current) {
				clearTimeout(celebrationTimeoutRef.current);
			}
		};
	}, []);

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
			{/* Header */}
			<div className="bg-white dark:bg-gray-800 shadow-sm">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="mb-1 text-2xl font-bold dark:text-white">
								Hey, {user?.currentUser.name}! 👋
							</h1>
							<p className="text-gray-600 dark:text-gray-300">{today}</p>
						</div>
						<div className="text-right">
							<div className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
								{completedCount}/{totalHabits}
							</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">
								completed
							</div>
						</div>
					</div>

					{/* Progress Bar */}
					<div className="mt-6">
						<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
							<div
								className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
								style={{ width: mounted ? `${completionPercentage}%` : "0%" }}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-4xl mx-auto px-6 py-8">
				{/* Habits List */}
				<div className="space-y-4 mb-8">
					{habits.map((habit, index) => {
						return (
							<HabitCard
								key={habit.id}
								habit={habit}
								mounted={mounted}
								index={index}
								onToggle={(habitId: string) => {
									setHabitCompletedMutation.mutate({
										habitId,
										csrfToken,
										timezone,
									});
								}}
							/>
						);
					})}
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
			</div>

			{showCelebration && <CelebrationToast message={celebrationMessage} />}

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
		</div>
	);
}
