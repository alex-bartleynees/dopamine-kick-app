import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "celebration" | "error";

interface ToastItem {
	id: number;
	message: string;
	variant: ToastVariant;
}

interface ToastContextValue {
	toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION: Record<ToastVariant, number> = {
	celebration: 3000,
	error: 5000,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);
	const nextIdRef = useRef(0);

	const toast = useCallback((message: string, variant: ToastVariant = "celebration") => {
		const id = nextIdRef.current++;
		setToasts((prev) => [...prev, { id, message, variant }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, TOAST_DURATION[variant]);
	}, []);

	const value = useMemo(() => ({ toast }), [toast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
				{toasts.map((t) => (
					<div
						key={t.id}
						role={t.variant === "error" ? "alert" : "status"}
						className={cn(
							"px-8 py-4 rounded-2xl shadow-2xl text-white font-medium animate-slide-up pointer-events-auto",
							t.variant === "celebration" &&
								"bg-linear-to-r from-blue-500 to-purple-500",
							t.variant === "error" && "bg-red-600",
						)}
					>
						{t.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast(): ToastContextValue {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}
