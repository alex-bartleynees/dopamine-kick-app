import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { type User, userForCreationSchema, userSchema } from "@/types/user";
import { BACKEND_URL, getProxyHeaders } from "../lib/proxy-utils";
import { csrfMiddleware } from "./middleware/csrf";

export const createUserFn = createServerFn({ method: "POST" })
	.middleware([csrfMiddleware])
	.inputValidator(userForCreationSchema)
	.handler(async ({ data }): Promise<void> => {
		const request = getRequest();

		const response = await fetch(`${BACKEND_URL}/api/users`, {
			method: "POST",
			headers: {
				...getProxyHeaders(request),
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (response.ok) {
			return;
		}

		if (response.status === 409) {
			throw new Error("EMAIL_EXISTS");
		}

		throw new Error("Failed to create user");
	});

export const getCurrentUserFn = createServerFn({ method: "GET" })
	.inputValidator((id: string) => id)
	.handler(async ({ data: id }): Promise<User> => {
		const request = getRequest();

		const response = await fetch(`${BACKEND_URL}/api/users/${id}`, {
			method: "GET",
			headers: getProxyHeaders(request),
		});

		if (response.ok) {
			const data = await response.json();
			return userSchema.parse(data);
		}

		throw new Error("Failed to fetch user");
	});
