import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Plus, X } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { timezone } from "@/lib/timezone";
import { createQuestFn, createQuestReminderFn } from "@/server/quests";

export const Route = createFileRoute("/_auth/create-quest")({
	component: CreateQuest,
});

interface ReminderRow {
	id: number;
	remindAt: string; // datetime-local value
	isEnabled: boolean;
}

// Convert a `datetime-local` value (local time) to an ISO-8601 string with offset.
function localInputToIso(value: string): string {
	return new Date(value).toISOString();
}

const fieldClasses = "h-auto px-4 py-3 rounded-xl";

function CreateQuest() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { csrfToken } = useAuth();
	const { toast } = useToast();
	const { requestPermission, subscribe, isSupported, permission } =
		usePushNotifications();

	const [emoji, setEmoji] = useState("🎯");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [dueAt, setDueAt] = useState("");
	const [reminders, setReminders] = useState<ReminderRow[]>([]);

	const addReminder = () => {
		setReminders((prev) => [
			...prev,
			{ id: Date.now(), remindAt: dueAt, isEnabled: true },
		]);
	};

	const updateReminder = (id: number, update: Partial<ReminderRow>) => {
		setReminders((prev) =>
			prev.map((r) => (r.id === id ? { ...r, ...update } : r)),
		);
	};

	const removeReminder = (id: number) => {
		setReminders((prev) => prev.filter((r) => r.id !== id));
	};

	const setupPushNotificationsIfNeeded = async () => {
		const hasAnyRemindersEnabled = reminders.some(
			(r) => r.isEnabled && r.remindAt,
		);

		if (!hasAnyRemindersEnabled || !isSupported) {
			return;
		}

		if (permission === "granted") {
			await subscribe();
			return;
		}

		const granted = await requestPermission();
		if (granted) {
			await subscribe();
		}
	};

	const createQuestMutation = useMutation({
		mutationFn: async () => {
			await setupPushNotificationsIfNeeded();

			const quest = await createQuestFn({
				data: {
					emoji,
					title,
					description: description.trim() ? description.trim() : null,
					dueAt: localInputToIso(dueAt),
					csrfToken,
				},
			});

			// Contract has no bulk reminder endpoint — add one at a time.
			for (const reminder of reminders) {
				if (!reminder.remindAt) continue;
				await createQuestReminderFn({
					data: {
						questId: quest.id,
						remindAt: localInputToIso(reminder.remindAt),
						timeZone: timezone,
						isEnabled: reminder.isEnabled,
						csrfToken,
					},
				});
			}

			return quest;
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["quests"] });
			navigate({ to: "/quests" });
		},
		onError: () => {
			toast("Couldn't create the quest. Please try again.", "error");
		},
	});

	const canSubmit = title.trim().length > 0 && dueAt.length > 0;

	return (
		<PageShell center>
			<div className="max-w-2xl w-full">
				<div className="animate-fade-in-up">
					<BackButton onClick={() => navigate({ to: "/quests" })} />

					{/* Header */}
					<div className="text-center mb-8">
						<h1 className="mb-3">Create a Quest</h1>
						<p className="text-muted-foreground">
							A one-off task to complete by a certain time.
						</p>
					</div>

					{/* Form */}
					<div className="bg-card rounded-3xl shadow-xl p-8 space-y-6">
						<div className="flex gap-4">
							<div className="w-24">
								<label
									htmlFor="quest-emoji"
									className="block text-sm mb-2 text-muted-foreground"
								>
									Emoji
								</label>
								<Input
									id="quest-emoji"
									type="text"
									value={emoji}
									onChange={(e) => setEmoji(e.target.value)}
									maxLength={10}
									className={`${fieldClasses} text-center text-3xl`}
								/>
							</div>
							<div className="flex-1">
								<label
									htmlFor="quest-title"
									className="block text-sm mb-2 text-muted-foreground"
								>
									Title
								</label>
								<Input
									id="quest-title"
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									maxLength={100}
									placeholder="e.g., Submit tax return"
									className={fieldClasses}
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="quest-description"
								className="block text-sm mb-2 text-muted-foreground"
							>
								Description <span className="text-gray-400">(optional)</span>
							</label>
							<Textarea
								id="quest-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								maxLength={500}
								rows={3}
								placeholder="Add any details..."
								className={`${fieldClasses} resize-none`}
							/>
						</div>

						<div>
							<label
								htmlFor="quest-due"
								className="block text-sm mb-2 text-muted-foreground"
							>
								Due date &amp; time
							</label>
							<Input
								id="quest-due"
								type="datetime-local"
								value={dueAt}
								onChange={(e) => setDueAt(e.target.value)}
								className={fieldClasses}
							/>
						</div>

						{/* Reminders */}
						<div className="border-t border-border pt-6">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
									<Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
								</div>
								<div>
									<div className="font-medium">Reminders</div>
									<div className="text-sm text-muted-foreground">
										Get a push notification before it's due
									</div>
								</div>
							</div>

							<div className="space-y-3">
								{reminders.map((reminder) => (
									<div key={reminder.id} className="flex items-center gap-2">
										<Input
											type="datetime-local"
											value={reminder.remindAt}
											onChange={(e) =>
												updateReminder(reminder.id, {
													remindAt: e.target.value,
												})
											}
											className="flex-1 h-auto px-4 py-2.5 rounded-xl"
										/>
										<Switch
											size="sm"
											checked={reminder.isEnabled}
											onCheckedChange={(isEnabled) =>
												updateReminder(reminder.id, { isEnabled })
											}
											aria-label={
												reminder.isEnabled
													? "Disable reminder"
													: "Enable reminder"
											}
										/>
										<button
											type="button"
											onClick={() => removeReminder(reminder.id)}
											aria-label="Remove reminder"
											className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
										>
											<X className="w-5 h-5" />
										</button>
									</div>
								))}
							</div>

							<button
								type="button"
								onClick={addReminder}
								className="mt-3 flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
							>
								<Plus className="w-4 h-4" />
								Add reminder
							</button>
						</div>
					</div>

					{/* Submit Button */}
					<Button
						variant="gradient"
						size="xl"
						onClick={() => createQuestMutation.mutate()}
						disabled={!canSubmit || createQuestMutation.isPending}
						className="w-full mt-6"
					>
						{createQuestMutation.isPending ? "Creating..." : "Create Quest"}
					</Button>
				</div>
			</div>
		</PageShell>
	);
}
