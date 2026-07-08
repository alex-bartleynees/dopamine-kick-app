import { cn } from "@/lib/utils";

interface SwitchProps {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	size?: "default" | "sm";
	"aria-label"?: string;
	className?: string;
}

export function Switch({
	checked,
	onCheckedChange,
	size = "default",
	className,
	...props
}: SwitchProps) {
	const isSmall = size === "sm";
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onCheckedChange(!checked)}
			className={cn(
				"relative rounded-full transition-colors duration-300 shrink-0",
				isSmall ? "w-12 h-7" : "w-14 h-8",
				checked
					? "bg-linear-to-r from-blue-500 to-purple-500"
					: "bg-gray-300 dark:bg-gray-600",
				className,
			)}
			{...props}
		>
			<span
				className={cn(
					"absolute top-1 bg-white rounded-full shadow transition-transform duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
					isSmall ? "w-5 h-5" : "w-6 h-6",
					checked
						? isSmall
							? "translate-x-6"
							: "translate-x-6.5"
						: isSmall
							? "translate-x-1"
							: "translate-x-0.5",
				)}
			/>
		</button>
	);
}
