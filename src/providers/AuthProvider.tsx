import type React from "react";
import { createContext, useCallback, useEffect, useState } from "react";
import type { UserState } from "@/schemas/user";
import { setCsrfToken } from "../lib/csrf-store";
import { logoutFn } from "../server/auth";

interface AuthContextType {
	user: UserState | null;
	csrfToken: string;
	login: () => void;
	logout: () => Promise<void>;
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
	const antiForgeryToken = csrfToken ?? "";

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

	useEffect(() => {
		if (csrfToken) {
			setCsrfToken(csrfToken);
		}
	}, [csrfToken]);

	const value: AuthContextType = {
		user,
		csrfToken: antiForgeryToken,
		login,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
