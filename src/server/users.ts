import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { BACKEND_URL, getProxyHeaders } from "../lib/proxy-utils";
import { csrfMiddleware } from "./middleware/csrf";

const userForCreationSchema = z.object({
	email: z.email(),
	username: z.string().min(1),
	name: z.string().min(1),
	password: z.string().min(8),
	image: z.string(),
});

export type UserForCreationDto = z.infer<typeof userForCreationSchema>;

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
