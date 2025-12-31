import { create } from "zustand";
import type { Habit } from "@/types/habit";

interface HabitStore {
	selectedHabits: Habit[];
	toggleHabit: (habit: Habit) => void;
	setSelectedHabits: (habits: Habit[]) => void;
}

export const useHabitStore = create<HabitStore>((set) => ({
	selectedHabits: [],
	toggleHabit: (habit: Habit) =>
		set((state) => {
			const isSelected = state.selectedHabits.some((h) => h.id === habit.id);
			if (isSelected) {
				return {
					selectedHabits: state.selectedHabits.filter((h) => h.id !== habit.id),
				};
			} else {
				return {
					selectedHabits: [...state.selectedHabits, habit],
				};
			}
		}),
	setSelectedHabits: (habits: Habit[]) => set({ selectedHabits: habits }),
}));
