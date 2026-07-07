import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QuestCard } from "@/components/quests";
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
	const [mounted, setMounted] = useState(false);

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
		},
		onSuccess: (quest) => {
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
		},
	});

	return (
		<div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
			{/* Header */}
			<header className="bg-white dark:bg-gray-800 shadow-sm">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<button
						type="button"
						onClick={() => navigate({ to: "/dashboard" })}
						className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
					>
						<ChevronLeft className="w-5 h-5" />
						Back
					</button>
					<div className="flex items-center justify-between">
						<div>
							<h1 className="mb-1 text-2xl font-bold dark:text-white">
								Quests
							</h1>
							<p className="text-gray-600 dark:text-gray-300">
								One-off tasks to complete
							</p>
						</div>
						<div className="text-right">
							<div className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
								{activeQuests.length}
							</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">
								active
							</div>
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
							onDelete={(questId) => deleteQuestMutation.mutate(questId)}
							onOpen={(questId) =>
								navigate({ to: "/quest/$questId", params: { questId } })
							}
						/>
					))}

					{activeQuests.length === 0 && (
						<div className="text-center py-10 text-gray-500 dark:text-gray-400">
							No active quests. Add one to get started!
						</div>
					)}

					{/* Add Quest Button */}
					<button
						type="button"
						onClick={() => navigate({ to: "/create-quest" })}
						className="w-full py-4 px-6 bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
						style={{
							animationDelay: `${activeQuests.length * 100}ms`,
							opacity: mounted ? 1 : 0,
						}}
					>
						<Plus className="w-5 h-5" />
						<span className="font-medium">Add Quest</span>
					</button>
				</div>

				{/* Completed Quests */}
				{completedQuests.length > 0 && (
					<div>
						<h2 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
							Completed
						</h2>
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
									onDelete={(questId) => deleteQuestMutation.mutate(questId)}
									onOpen={(questId) =>
										navigate({ to: "/quest/$questId", params: { questId } })
									}
								/>
							))}
						</div>
					</div>
				)}
			</section>
		</div>
	);
}
