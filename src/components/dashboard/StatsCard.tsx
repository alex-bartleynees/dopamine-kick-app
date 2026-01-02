interface StatsCardProps {
	icon: React.ReactNode;
	iconBgColor: string;
	label: string;
	value: number | string;
	mounted: boolean;
	delay: string;
}

export function StatsCard({
	icon,
	iconBgColor,
	label,
	value,
	mounted,
	delay,
}: StatsCardProps) {
	return (
		<div
			className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md transition-[opacity,transform] duration-500 ${
				mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
			}`}
			style={{ transitionDelay: delay }}
		>
			<div className="flex items-center gap-3 mb-2">
				<div
					className={`w-10 h-10 ${iconBgColor} rounded-xl flex items-center justify-center`}
				>
					{icon}
				</div>
				<div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
			</div>
			<div className="text-3xl font-bold text-gray-900 dark:text-white">
				{value}
			</div>
		</div>
	);
}
