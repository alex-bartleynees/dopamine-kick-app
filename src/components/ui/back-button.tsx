import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
	onClick: () => void;
	label?: string;
	className?: string;
}

export function BackButton({
	onClick,
	label = "Back",
	className,
}: BackButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors",
				className,
			)}
		>
			<ChevronLeft className="w-5 h-5" />
			{label}
		</button>
	);
}
