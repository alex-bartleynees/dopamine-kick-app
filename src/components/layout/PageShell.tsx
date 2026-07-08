import { cn } from "@/lib/utils";

interface PageShellProps {
	children: React.ReactNode;
	/** Center content vertically and horizontally (onboarding/form screens). */
	center?: boolean;
	className?: string;
}

export function PageShell({ children, center, className }: PageShellProps) {
	return (
		<div
			className={cn(
				"min-h-screen page-gradient",
				center && "flex items-center justify-center p-6",
				className,
			)}
		>
			{children}
		</div>
	);
}
