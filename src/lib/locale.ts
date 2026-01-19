import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const getLocaleFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<string> => {
		const request = getRequest();
		const acceptLanguage = request.headers.get("Accept-Language");
		// Parse first locale from Accept-Language header (e.g., "en-US,en;q=0.9" -> "en-US")
		return acceptLanguage?.split(",")[0]?.split(";")[0]?.trim() || "en-US";
	},
);
