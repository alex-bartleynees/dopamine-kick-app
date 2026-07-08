import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, Plus } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { timezone } from "@/lib/timezone";
import type { Quest } from "@/schemas/quest";
import {
	createQuestReminderFn,
	getQuestFn,
	updateQuestFn,
} from "@/server/quests";

export const Route = createFileRoute("/_auth/quest/$questId")({
	loader: async ({ params }) => {
		const quest = await getQuestFn({ data: params.questId });
		return { quest };
	},
	component: QuestDetail,
});

// ISO-8601 string -> `datetime-local` value in the browser's local time.
function isoToLocalInput(iso: string): string {
	const d = new Date(iso);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
		d.getHours(),
	)}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string {
	return new Date(value).toISOString();
}

function formatReminder(iso: string, locale: string): string {
	return new Date(iso).toLocaleString(locale, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZone: timezone,
	});
}

const fieldClasses = "h-auto px-4 py-3 rounded-xl";

function QuestDetail() {
	const { quest: initialQuest } = Route.useLoaderData();
	const { questId } = Route.useParams();
	const { csrfToken } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { toast } = useToast();

	const { data: quest = initialQuest } = useQuery({
		queryKey: ["quest", questId],
		queryFn: async () => getQuestFn({ data: questId }),
		initialData: initialQuest,
	});

	const [emoji, setEmoji] = useState(quest.emoji);
	const [title, setTitle] = useState(quest.title);
	const [description, setDescription] = useState(quest.description ?? "");
	const [dueAt, setDueAt] = useState(isoToLocalInput(quest.dueAt));
	const [newReminder, setNewReminder] = useState("");
	const locale =
		typeof navigator !== "undefined" ? navigator.language : "en-US";
	const isCompleted = quest.status === "Completed";

	const refreshQuest = async () => {
		await queryClient.invalidateQueries({ queryKey: ["quest", questId] });
		await queryClient.invalidateQueries({ queryKey: ["quests"] });
	};

	const updateQuestMutation = useMutation({
		mutationFn: async () => {
			return await updateQuestFn({
				data: {
					questId,
					emoji,
					title,
					description: description.trim() ? description.trim() : null,
					dueAt: localInputToIso(dueAt),
					csrfToken,
				},
			});
		},
		onSuccess: async (updated: Quest) => {
			queryClient.setQueryData(["quest", questId], updated);
			await refreshQuest();
			navigate({ to: "/quests" });
		},
		onError: () => {
			toast("Couldn't save your changes. Please try again.", "error");
		},
	});

	const addReminderMutation = useMutation({
		mutationFn: async () => {
			return await createQuestReminderFn({
				data: {
					questId,
					remindAt: localInputToIso(newReminder),
					timeZone: timezone,
					isEnabled: true,
					csrfToken,
				},
			});
		},
		onSuccess: async () => {
			setNewReminder("");
			await refreshQuest();
		},
		onError: () => {
			toast("Couldn't add the reminder. Please try again.", "error");
		},
	});

	const canSave = title.trim().length > 0 && dueAt.length > 0;

	return (
		<PageShell center>
			<div className="max-w-2xl w-full">
				<div className="animate-fade-in-up">
					<BackButton onClick={() => navigate({ to: "/quests" })} />

					<div className="bg-card rounded-3xl shadow-xl p-8 space-y-6">
						{isCompleted && (
							<div className="rounded-xl bg-purple-100 dark:bg-purple-900/40 px-4 py-3 text-sm text-purple-700 dark:text-purple-300">
								This quest is completed.
							</div>
						)}

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
								<div className="font-medium">Reminders</div>
							</div>

							{quest.reminders && quest.reminders.length > 0 ? (
								<ul className="space-y-2 mb-4">
									{quest.reminders.map((reminder) => (
										<li
											key={reminder.id}
											className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm"
										>
											<span className="text-card-foreground">
												{formatReminder(reminder.remindAt, locale)}
											</span>
											<span
												className={`text-xs font-medium ${
													reminder.isEnabled
														? "text-purple-600 dark:text-purple-400"
														: "text-gray-400"
												}`}
											>
												{reminder.isEnabled ? "On" : "Off"}
											</span>
										</li>
									))}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground mb-4">
									No reminders yet.
								</p>
							)}

							{!isCompleted && (
								<div className="flex items-center gap-2">
									<Input
										type="datetime-local"
										value={newReminder}
										onChange={(e) => setNewReminder(e.target.value)}
										className="flex-1 h-auto px-4 py-2.5 rounded-xl"
									/>
									<Button
										variant="gradient"
										onClick={() => addReminderMutation.mutate()}
										disabled={!newReminder || addReminderMutation.isPending}
										className="shrink-0 h-auto px-4 py-2.5 rounded-xl"
									>
										<Plus className="w-4 h-4" />
										Add
									</Button>
								</div>
							)}
						</div>
					</div>

					{!isCompleted && (
						<Button
							variant="gradient"
							size="xl"
							onClick={() => updateQuestMutation.mutate()}
							disabled={!canSave || updateQuestMutation.isPending}
							className="w-full mt-6"
						>
							{updateQuestMutation.isPending ? "Saving..." : "Save Changes"}
						</Button>
					)}
				</div>
			</div>
		</PageShell>
	);
}
