import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
	DEFAULT_HABITS,
	type Habit,
	type HabitSearchParams,
	habitSearchSchema,
} from "@/schemas/habit";
import { getHabitsFn } from "@/server/habits";

export const Route = createFileRoute("/_auth/choose-habits")({
	component: ChooseHabitsScreen,
	validateSearch: (search: Record<string, unknown>): HabitSearchParams => {
		const result = habitSearchSchema.safeParse(search);
		if (result.success) {
			return result.data;
		}
		return { selectedIds: [], customHabits: [] };
	},
	loader: async () => {
		const existingHabits = await getHabitsFn();
		return { existingHabits };
	},
});

export function ChooseHabitsScreen() {
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const [showCustomForm, setShowCustomForm] = useState(false);
	const [customHabits, setCustomHabits] = useState<Habit[]>(
		search.customHabits,
	);
	const [customName, setCustomName] = useState("");
	const [customEmoji, setCustomEmoji] = useState("🎯");
	const [customTarget, setCustomTarget] = useState("");
	const { existingHabits } = Route.useLoaderData();

	// Derive selected habits from URL state
	const selectedHabits = useMemo(() => {
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

	const allHabits = [...DEFAULT_HABITS, ...customHabits].map((habit) => {
		const isDisabled = existingHabits.some((h) => h.name === habit.name);
		return { ...habit, isDisabled };
	});
	const selectedIds = new Set(selectedHabits.map((h) => h.id));

	const closeModal = useCallback(() => {
		setShowCustomForm(false);
	}, []);

	const handleToggleHabit = (habit: Habit) => {
		const isCurrentlySelected = selectedIds.has(habit.id);

		navigate({
			search: (prev) => {
				if (isCurrentlySelected) {
					// Remove from selection
					return {
						...prev,
						selectedIds: prev.selectedIds.filter((id) => id !== habit.id),
						customHabits: habit.isCustom
							? prev.customHabits.filter((h) => h.id !== habit.id)
							: prev.customHabits,
					};
				}
				// Add to selection
				return {
					...prev,
					selectedIds: habit.isCustom
						? prev.selectedIds
						: [...prev.selectedIds, habit.id],
					customHabits: habit.isCustom
						? [
								...prev.customHabits,
								{
									id: habit.id,
									emoji: habit.emoji,
									name: habit.name,
									target: habit.target,
									isCustom: true as const,
								},
							]
						: prev.customHabits,
				};
			},
			replace: true,
		});
	};

	const handleAddCustomHabit = () => {
		if (customName && customTarget) {
			const newHabit: Habit = {
				id: `custom-${Date.now()}`,
				emoji: customEmoji,
				name: customName,
				target: customTarget,
				isCustom: true,
			};
			setCustomHabits([...customHabits, newHabit]);

			// Add custom habit to URL
			navigate({
				search: (prev) => ({
					...prev,
					customHabits: [
						...prev.customHabits,
						{
							id: newHabit.id,
							emoji: newHabit.emoji,
							name: newHabit.name,
							target: newHabit.target,
							isCustom: true as const,
						},
					],
				}),
				replace: true,
			});

			setCustomName("");
			setCustomTarget("");
			setCustomEmoji("🎯");
			setShowCustomForm(false);
		}
	};

	const handleContinue = () => {
		navigate({
			to: "/set-tempo",
			search: {
				selectedIds: search.selectedIds,
				customHabits: search.customHabits,
			},
		});
	};

	const canContinue = existingHabits.length > 0 || selectedHabits.length > 0;

	return (
		<PageShell center>
			<div className="max-w-4xl w-full">
				<div className="animate-fade-in-up">
					{/* Back Button - only show if user has existing habits */}
					{existingHabits.length > 0 && (
						<BackButton onClick={() => navigate({ to: "/dashboard" })} />
					)}

					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="mb-3">What habits do you want to build?</h1>
						<p className="text-muted-foreground">
							Pick 3-5 to start. You can add more later.
						</p>
					</div>

					{/* Habit Grid */}
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
						{allHabits.map((habit, index) => {
							const isSelected = selectedIds.has(habit.id);
							return (
								<button
									type="button"
									key={habit.id}
									onClick={() => handleToggleHabit(habit)}
									style={{ animationDelay: `${index * 50}ms` }}
									disabled={habit.isDisabled}
									className={`relative bg-card rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 animate-scale-in ${
										isSelected
											? "border-2 border-purple-500 shadow-lg shadow-purple-200 dark:shadow-purple-900/50"
											: "border-2 border-gray-100 dark:border-gray-700 shadow hover:shadow-md"
									} ${habit.isDisabled ? "opacity-50! cursor-not-allowed" : ""}`}
								>
									{isSelected && (
										<div className="absolute -top-2 -right-2 bg-linear-to-br from-blue-500 to-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg animate-pop-in">
											<Check className="w-4 h-4" />
										</div>
									)}
									<div className="text-5xl mb-3">{habit.emoji}</div>
									<div className="font-medium mb-1">{habit.name}</div>
									<div className="text-sm text-gray-500 dark:text-gray-400">
										{habit.target}
									</div>
								</button>
							);
						})}

						{/* Custom Habit Card */}
						<button
							type="button"
							onClick={() => setShowCustomForm(true)}
							style={{ animationDelay: `${allHabits.length * 50}ms` }}
							className="bg-card rounded-2xl p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 transition-all duration-300 hover:scale-105 animate-scale-in"
						>
							<div className="text-5xl mb-3">
								<Plus className="w-12 h-12 mx-auto text-gray-400" />
							</div>
							<div className="font-medium text-gray-700 dark:text-gray-200 mb-1">
								Custom Habit
							</div>
							<div className="text-sm text-gray-500 dark:text-gray-400">
								Add your own
							</div>
						</button>
					</div>

					{/* Continue Button */}
					<Button
						variant="gradient"
						size="xl"
						onClick={handleContinue}
						disabled={!canContinue}
						className="w-full animate-fade-in-up animation-delay-300"
					>
						Continue ({selectedIds.size} selected)
					</Button>
				</div>
			</div>

			{/* Custom Habit Modal */}
			{showCustomForm && (
				<Modal onClose={closeModal} aria-labelledby="custom-habit-modal-title">
					<h2 id="custom-habit-modal-title" className="mb-6">
						Create Custom Habit
					</h2>

					<div className="space-y-4">
						<div>
							<label
								htmlFor="custom-habit-emoji"
								className="block text-sm mb-2 text-muted-foreground"
							>
								Emoji
							</label>
							<Input
								id="custom-habit-emoji"
								type="text"
								value={customEmoji}
								onChange={(e) => setCustomEmoji(e.target.value)}
								maxLength={2}
								className="h-auto px-4 py-3 rounded-xl text-center text-3xl"
							/>
						</div>

						<div>
							<label
								htmlFor="custom-habit-name"
								className="block text-sm mb-2 text-muted-foreground"
							>
								Habit Name
							</label>
							<Input
								id="custom-habit-name"
								type="text"
								value={customName}
								onChange={(e) => setCustomName(e.target.value)}
								placeholder="e.g., Learn Spanish"
								className="h-auto px-4 py-3 rounded-xl"
							/>
						</div>

						<div>
							<label
								htmlFor="custom-habit-target"
								className="block text-sm mb-2 text-muted-foreground"
							>
								Target
							</label>
							<Input
								id="custom-habit-target"
								type="text"
								value={customTarget}
								onChange={(e) => setCustomTarget(e.target.value)}
								placeholder="e.g., 15 min"
								className="h-auto px-4 py-3 rounded-xl"
							/>
						</div>

						<div className="flex gap-3 pt-4">
							<Button
								variant="outline"
								onClick={closeModal}
								className="flex-1 h-auto py-3 px-6 rounded-xl"
							>
								Cancel
							</Button>
							<Button
								variant="gradient"
								onClick={handleAddCustomHabit}
								disabled={!customName || !customTarget}
								className="flex-1 h-auto py-3 px-6 rounded-xl"
							>
								Add Habit
							</Button>
						</div>
					</div>
				</Modal>
			)}
		</PageShell>
	);
}
