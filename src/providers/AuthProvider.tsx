import type React from "react";
import { createContext, useCallback, useEffect, useState } from "react";
import type { UserState } from "@/types/user";
import { setCsrfToken } from "../lib/csrf-store";
import { getAuthenticatedStateFn, logoutFn } from "../server/auth";

interface AuthContextType {
	user: UserState | null;
	isLoading: boolean;
	csrfToken: string;
	login: () => void;
	logout: () => Promise<void>;
	refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
	children,
	userState,
	csrfToken,
}: {
	children: React.ReactNode;
	userState?: UserState | null;
	csrfToken?: string;
}) {
	const [user, setUser] = useState<UserState | null>(userState || null);
	const [isLoading, setIsLoading] = useState(!userState);
	const antiForgeryToken = csrfToken ?? "";

	const refetchUser = useCallback(async () => {
		try {
			setIsLoading(true);
			const authState = await getAuthenticatedStateFn();
			if (
				authState?.userState.currentUser &&
				authState.userState.isAuthenticated
			) {
				setUser(authState.userState);
			} else {
				setUser(null);
			}
		} catch {
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const login = useCallback(() => {
		window.location.href = "/bff/login";
	}, []);

	const logout = useCallback(async () => {
		try {
			await logoutFn({ data: antiForgeryToken });
			setUser(null);
			window.location.href = "/";
		} catch (error) {
			console.error("Logout failed:", error);
		}
	}, [antiForgeryToken]);

	// Initial client-side fetch if no initial user
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once on mount
	useEffect(() => {
		if (!userState) {
			refetchUser();
		}
	}, []);

	useEffect(() => {
		if (csrfToken) {
			setCsrfToken(csrfToken);
		}
	}, [csrfToken]);

	const value: AuthContextType = {
		user,
		isLoading,
		csrfToken: antiForgeryToken,
		login,
		logout,
		refetchUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
