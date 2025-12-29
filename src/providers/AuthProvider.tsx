import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { getAntiforgeryTokenFn, getCurrentUserFn } from "../server/auth";
import { type ParsedUser, parseUser, type User } from "../types/auth";

interface AuthContextType {
	user: ParsedUser | null;
	rawUser: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: () => void;
	logout: () => Promise<void>;
	refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
	children,
	initialUser,
}: {
	children: React.ReactNode;
	initialUser?: User | null;
}) {
	const [rawUser, setRawUser] = useState<User | null>(initialUser || null);
	const [isLoading, setIsLoading] = useState(!initialUser);

	const user = rawUser ? parseUser(rawUser) : null;
	const isAuthenticated = rawUser?.isAuthenticated || false;

	const refetchUser = useCallback(async () => {
		try {
			setIsLoading(true);
			const userData = await getCurrentUserFn();
			setRawUser(userData);
		} catch (error) {
			console.error("Failed to fetch user:", error);
			setRawUser(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const login = useCallback(() => {
		window.location.href = "/bff/login";
	}, []);

	const logout = useCallback(async () => {
		try {
			const csrfData = await getAntiforgeryTokenFn();
			await fetch("/bff/logout", {
				method: "POST",
				headers: {
					"X-CSRF-TOKEN": csrfData.requestToken,
				},
			});
		} catch (error) {
			console.error("Logout failed:", error);
		}
		setRawUser(null);
		window.location.href = "/";
	}, []);

	// Initial client-side fetch if no initial user
	useEffect(() => {
		if (!initialUser && typeof window !== "undefined") {
			refetchUser();
		}
	}, [initialUser, refetchUser]);

	const value: AuthContextType = {
		user,
		rawUser,
		isAuthenticated,
		isLoading,
		login,
		logout,
		refetchUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
