import { createMiddleware } from "@tanstack/react-start";
import { getCsrfToken } from "../../lib/csrf-store";

export const csrfMiddleware = createMiddleware({ type: "function" }).client(
	async ({ next }) => {
		return next({
			headers: {
				"X-CSRF-TOKEN": getCsrfToken(),
			},
		});
	},
);
