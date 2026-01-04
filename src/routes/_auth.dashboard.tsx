import { createFileRoute, redirect } from "@tanstack/react-router";
import { Award, Calendar, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ConfettiParticle, HabitProgress } from "@/components/dashboard";
import {
	AllCompleteModal,
	CelebrationToast,
	ConfettiParticleComponent,
	HabitCard,
	StatsCard,
} from "@/components/dashboard";
import { useAuth } from "@/hooks/useAuth";
import { getHabitsFn } from "@/server/habits";

export const Route = createFileRoute("/_auth/dashboard")({
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
	component: Dashboard,
});

function Dashboard() {
	const { habits } = Route.useLoaderData();
	const { user } = useAuth();
	const [habitProgress, setHabitProgress] = useState<
		Map<string, HabitProgress>
	>(
		() =>
			new Map(
				habits.map((h) => [
					h.id,
					{
						habitId: h.id,
						completed: false,
						streak: Math.floor(Math.random() * 15),
					},
				]),
			),
	);
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

	const completedCount = Array.from(habitProgress.values()).filter(
		(p) => p.completed,
	).length;
	const totalHabits = habits.length;
	const completionPercentage =
		totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;
	const allCompleted = completionPercentage === 100 && totalHabits > 0;

	const longestStreak = useMemo(
		() =>
			Math.max(...Array.from(habitProgress.values()).map((p) => p.streak), 0),
		[habitProgress],
	);

	const today = useMemo(
		() =>
			new Date().toLocaleDateString("en-US", {
				weekday: "long",
				month: "long",
				day: "numeric",
			}),
		[],
	);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (allCompleted) {
			const emojis = ["🎉", "✨", "🌟", "🎊", "💫"];
			const particles = Array.from({ length: 20 }, (_, i) => ({
				id: i,
				emoji: emojis[Math.floor(Math.random() * emojis.length)],
				delay: Math.random() * 0.5,
				duration: 2 + Math.random() * 2,
				startX: Math.random() * 100,
			}));
			setConfettiParticles(particles);
		} else {
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

	const toggleHabit = (habitId: string) => {
		const newProgress = new Map(habitProgress);
		const current = newProgress.get(habitId);
		if (!current) return;

		const wasCompleted = current.completed;
		const newStreak = wasCompleted ? current.streak : current.streak + 1;

		newProgress.set(habitId, {
			...current,
			completed: !wasCompleted,
			streak: newStreak,
		});

		setHabitProgress(newProgress);

		const allNowComplete = Array.from(newProgress.values()).every(
			(p) => p.completed,
		);

		if (!wasCompleted) {
			const habit = habits.find((h) => h.id === habitId);

			if (allNowComplete) {
				setShowAllCompleteModal(true);
			}

			if (newStreak % 7 === 0) {
				setCelebrationMessage(
					`🎉 ${newStreak} day streak on ${habit?.name}! Amazing!`,
				);
			} else if (newStreak === 1) {
				setCelebrationMessage(`Great start on ${habit?.name}! 🎯`);
			} else {
				setCelebrationMessage(`${habit?.name} completed! 🔥`);
			}
			if (celebrationTimeoutRef.current) {
				clearTimeout(celebrationTimeoutRef.current);
			}
			setShowCelebration(true);
			celebrationTimeoutRef.current = setTimeout(
				() => setShowCelebration(false),
				3000,
			);
		}
	};

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
						const progress = habitProgress.get(habit.id);
						if (!progress) return null;

						return (
							<HabitCard
								key={habit.id}
								habit={habit}
								progress={progress}
								mounted={mounted}
								index={index}
								onToggle={toggleHabit}
							/>
						);
					})}
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
						value={7}
						mounted={mounted}
						delay="500ms"
					/>
					<StatsCard
						icon={
							<Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
						}
						iconBgColor="bg-yellow-100 dark:bg-yellow-900/50"
						label="Achievements"
						value={3}
						mounted={mounted}
						delay="600ms"
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
