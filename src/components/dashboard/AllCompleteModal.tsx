import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface AllCompleteModalProps {
	userName: string | undefined;
	onClose: () => void;
}

export function AllCompleteModal({ userName, onClose }: AllCompleteModalProps) {
	return (
		<Modal
			onClose={onClose}
			aria-label="All habits completed"
			className="text-center overflow-hidden"
		>
			<div className="absolute inset-0 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20" />

			<div className="relative z-10">
				<div className="text-8xl mb-4 animate-trophy-bounce">🏆</div>

				<h2 className="text-2xl font-bold mb-3 bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
					Amazing Work, {userName}!
				</h2>

				<p className="text-muted-foreground mb-6">
					You've completed all your habits for today. That's the dopamine kick
					we're talking about! 🎯
				</p>

				<div className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-4 mb-6">
					<div className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-1">
						100%
					</div>
					<div className="text-sm text-muted-foreground">
						Daily Goal Achieved
					</div>
				</div>

				<Button
					variant="gradient"
					size="xl"
					onClick={onClose}
					className="w-full rounded-xl"
				>
					Keep It Up! 💪
				</Button>
			</div>
		</Modal>
	);
}
