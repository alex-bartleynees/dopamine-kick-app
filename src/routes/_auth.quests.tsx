import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { QuestCard } from "@/components/quests";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { getLocaleFn } from "@/lib/locale";
import type { Quest } from "@/schemas/quest";
import { completeQuestFn, deleteQuestFn, getQuestsFn } from "@/server/quests";

export const Route = createFileRoute("/_auth/quests")({
	loader: async () => {
		const [quests, locale] = await Promise.all([getQuestsFn(), getLocaleFn()]);
		return { initialQuests: quests, locale };
	},
	component: Quests,
});

function Quests() {
	const { initialQuests, locale } = Route.useLoaderData();
	const { csrfToken } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { toast } = useToast();
	const [mounted, setMounted] = useState(false);
	const [questToDelete, setQuestToDelete] = useState<Quest | null>(null);

	const { data: quests = initialQuests } = useQuery({
		queryKey: ["quests"],
		queryFn: async () => {
			return await getQuestsFn();
		},
		initialData: initialQuests,
	});

	useEffect(() => {
		setMounted(true);
	}, []);

	const { activeQuests, completedQuests } = useMemo(() => {
		const active = quests
			.filter((q) => q.status === "Pending")
			.sort(
				(a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
			);
		const completed = quests
			.filter((q) => q.status === "Completed")
			.sort(
				(a, b) => new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime(),
			);
		return { activeQuests: active, completedQuests: completed };
	}, [quests]);

	const completeQuestMutation = useMutation({
		mutationFn: async (questId: string) => {
			return await completeQuestFn({ data: { questId, csrfToken } });
		},
		onMutate: async (questId) => {
			await queryClient.cancelQueries({ queryKey: ["quests"] });
			const previousQuests = queryClient.getQueryData<Quest[]>(["quests"]);
			queryClient.setQueryData<Quest[]>(["quests"], (oldQuests) => {
				if (!oldQuests) return oldQuests;
				return oldQuests.map((quest) =>
					quest.id === questId
						? {
								...quest,
								status: "Completed" as const,
								completedAt: new Date().toISOString(),
							}
						: quest,
				);
			});
			return { previousQuests };
		},
		onError: (_err, _questId, context) => {
			if (context?.previousQuests) {
				queryClient.setQueryData(["quests"], context.previousQuests);
			}
			toast("Couldn't complete the quest. Please try again.", "error");
		},
		onSuccess: (quest) => {
			toast(`${quest.title} completed! 🎉`);
			queryClient.setQueryData<Quest[]>(["quests"], (oldQuests) => {
				if (!oldQuests) return oldQuests;
				return oldQuests.map((q) => (q.id === quest.id ? quest : q));
			});
		},
	});

	const deleteQuestMutation = useMutation({
		mutationFn: async (questId: string) => {
			return await deleteQuestFn({ data: { questId, csrfToken } });
		},
		onMutate: async (questId) => {
			await queryClient.cancelQueries({ queryKey: ["quests"] });
			const previousQuests = queryClient.getQueryData<Quest[]>(["quests"]);
			queryClient.setQueryData<Quest[]>(["quests"], (oldQuests) => {
				if (!oldQuests) return oldQuests;
				return oldQuests.filter((quest) => quest.id !== questId);
			});
			return { previousQuests };
		},
		onError: (_err, _questId, context) => {
			if (context?.previousQuests) {
				queryClient.setQueryData(["quests"], context.previousQuests);
			}
			toast("Couldn't delete the quest. Please try again.", "error");
		},
	});

	return (
		<PageShell>
			{/* Header */}
			<header className="bg-card shadow-sm">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<BackButton
						onClick={() => navigate({ to: "/dashboard" })}
						className="mb-4"
					/>
					<div className="flex items-center justify-between">
						<div>
							<h1 className="mb-1 text-card-foreground">Quests</h1>
							<p className="text-muted-foreground">One-off tasks to complete</p>
						</div>
						<div className="text-right">
							<div className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
								{activeQuests.length}
							</div>
							<div className="text-sm text-muted-foreground">active</div>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<section className="max-w-4xl mx-auto px-2 sm:px-6 py-8">
				<div className="space-y-4 mb-8">
					{activeQuests.map((quest, index) => (
						<QuestCard
							key={quest.id}
							quest={quest}
							mounted={mounted}
							index={index}
							locale={locale}
							onComplete={(questId) => completeQuestMutation.mutate(questId)}
							onDelete={() => setQuestToDelete(quest)}
							onOpen={(questId) =>
								navigate({ to: "/quest/$questId", params: { questId } })
							}
						/>
					))}

					{activeQuests.length === 0 && (
						<div className="bg-card/60 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-12 text-center animate-fade-in">
							<div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
								<Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
							</div>
							<h2 className="mb-2 text-card-foreground">No active quests</h2>
							<p className="text-muted-foreground">
								Quests are one-off tasks with a deadline — perfect for that
								thing you keep putting off. Add one to get started!
							</p>
						</div>
					)}

					{/* Add Quest Button */}
					<Button
						variant="gradient"
						size="xl"
						onClick={() => navigate({ to: "/create-quest" })}
						className="w-full"
						style={{
							animationDelay: `${activeQuests.length * 100}ms`,
							opacity: mounted ? 1 : 0,
						}}
					>
						<Plus className="size-5" />
						Add Quest
					</Button>
				</div>

				{/* Completed Quests */}
				{completedQuests.length > 0 && (
					<div>
						<h2 className="mb-4 text-gray-700 dark:text-gray-300">Completed</h2>
						<div className="space-y-4 opacity-80">
							{completedQuests.map((quest, index) => (
								<QuestCard
									key={quest.id}
									quest={quest}
									mounted={mounted}
									index={index}
									locale={locale}
									onComplete={(questId) =>
										completeQuestMutation.mutate(questId)
									}
									onDelete={() => setQuestToDelete(quest)}
									onOpen={(questId) =>
										navigate({ to: "/quest/$questId", params: { questId } })
									}
								/>
							))}
						</div>
					</div>
				)}
			</section>

			{/* Delete Confirmation */}
			{questToDelete && (
				<Modal
					onClose={() => setQuestToDelete(null)}
					aria-labelledby="delete-quest-title"
				>
					<h2 id="delete-quest-title" className="mb-3">
						Delete quest?
					</h2>
					<p className="text-muted-foreground mb-6">
						"{questToDelete.title}" will be permanently deleted. This can't be
						undone.
					</p>
					<div className="flex gap-3">
						<Button
							variant="outline"
							size="xl"
							onClick={() => setQuestToDelete(null)}
							className="flex-1 rounded-xl"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="xl"
							onClick={() => {
								deleteQuestMutation.mutate(questToDelete.id);
								setQuestToDelete(null);
							}}
							className="flex-1 rounded-xl"
						>
							Delete
						</Button>
					</div>
				</Modal>
			)}
		</PageShell>
	);
}
