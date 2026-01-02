interface CelebrationToastProps {
	message: string;
}

export function CelebrationToast({ message }: CelebrationToastProps) {
	return (
		<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
			<div className="bg-linear-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-2xl shadow-2xl">
				<div className="font-medium">{message}</div>
			</div>
		</div>
	);
}
