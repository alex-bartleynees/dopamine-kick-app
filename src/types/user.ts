import { z } from "zod";

export const userForCreationSchema = z.object({
	email: z.email(),
	username: z.string().min(1),
	name: z.string().min(1),
	password: z.string().min(8),
	image: z.string(),
});

export const userSchema = z.object({
	id: z.string().optional(),
	image: z.string(),
	name: z.string(),
	username: z.string(),
});

export type User = z.infer<typeof userSchema>;

export type UserForCreationDto = z.infer<typeof userForCreationSchema>;

export interface UserState {
	isAuthenticated: boolean;
	currentUser: User;
}
