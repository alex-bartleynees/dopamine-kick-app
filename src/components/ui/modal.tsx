import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
	onClose: () => void;
	children: React.ReactNode;
	"aria-labelledby"?: string;
	"aria-label"?: string;
	className?: string;
}

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal shell: backdrop click + Escape to close, focus moves into
 * the dialog on open, Tab is trapped inside, and focus returns to the
 * previously focused element on close.
 */
export function Modal({ onClose, children, className, ...aria }: ModalProps) {
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const previouslyFocused = document.activeElement as HTMLElement | null;
		panelRef.current?.focus();
		return () => previouslyFocused?.focus();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
				return;
			}
			if (event.key !== "Tab" || !panelRef.current) return;

			const focusable = Array.from(
				panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			);
			if (focusable.length === 0) {
				event.preventDefault();
				return;
			}
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			const active = document.activeElement;

			if (event.shiftKey && (active === first || active === panelRef.current)) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && active === last) {
				event.preventDefault();
				first.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	return (
		<div
			role="dialog"
			aria-modal="true"
			{...aria}
			className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50 animate-fade-in"
		>
			{/* Backdrop - click to close */}
			<button
				type="button"
				className="absolute inset-0 bg-transparent cursor-default border-none"
				onClick={onClose}
				aria-label="Close modal"
				tabIndex={-1}
			/>
			<div
				ref={panelRef}
				tabIndex={-1}
				className={cn(
					"relative bg-card rounded-3xl p-8 max-w-md w-full shadow-2xl outline-none animate-modal-enter",
					className,
				)}
			>
				{children}
			</div>
		</div>
	);
}
