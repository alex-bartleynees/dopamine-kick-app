export interface ConfettiParticle {
	id: number;
	emoji: string;
	delay: number;
	duration: number;
	startX: number;
}

interface ConfettiParticleProps {
	emoji: string;
	delay: number;
	duration: number;
	startX: number;
}

export function ConfettiParticleComponent({
	emoji,
	delay,
	duration,
	startX,
}: ConfettiParticleProps) {
	return (
		<div
			className="absolute text-3xl animate-confetti-fall"
			style={{
				left: `${startX}%`,
				animationDelay: `${delay}s`,
				animationDuration: `${duration}s`,
			}}
		>
			{emoji}
		</div>
	);
}
