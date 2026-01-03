import { useEffect, useRef } from "react";

interface AllCompleteModalProps {
	userName: string | undefined;
	onClose: () => void;
}

export function AllCompleteModal({ userName, onClose }: AllCompleteModalProps) {
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		dialogRef.current?.focus();
	}, []);

	return (
		<button
			type="button"
			className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 animate-fade-in w-full cursor-default"
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					onClose();
				}
			}}
		>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				tabIndex={-1}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden animate-modal-enter"
			>
				<div className="absolute inset-0 bg-linear-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20" />

				<div className="relative z-10">
					<div className="text-8xl mb-4 animate-trophy-bounce">🏆</div>

					<h2 className="text-2xl font-bold mb-3 bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
						Amazing Work, {userName}!
					</h2>

					<p className="text-gray-600 dark:text-gray-300 mb-6">
						You've completed all your habits for today. That's the dopamine kick
						we're talking about! 🎯
					</p>

					<div className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-4 mb-6">
						<div className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-1">
							100%
						</div>
						<div className="text-sm text-gray-600 dark:text-gray-400">
							Daily Goal Achieved
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="w-full bg-linear-to-r from-blue-500 to-purple-500 text-white py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
					>
						Keep It Up! 💪
					</button>
				</div>
			</div>
		</button>
	);
}
