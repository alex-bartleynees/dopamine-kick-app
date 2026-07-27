// Server-only. This module reads OPENROUTER_API_KEY and imports the AI SDK; it
// must never be pulled into a client bundle. `import.meta.env.SSR` is statically
// replaced by Vite (false in the client build), so an accidental client import
// compiles to `if (!false) throw ...` and hard-errors the moment it is evaluated,
// rather than silently leaking the key.
if (!import.meta.env.SSR) {
	throw new Error(
		"suggest-habits.ts is server-only and must not run in the client",
	);
}

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, Output } from "ai";
import { Data, Effect } from "effect";
import {
	type AiSuggestedHabit,
	aiHabitSuggestionsSchema,
} from "@/schemas/habit";

const MODEL = "deepseek/deepseek-v4-flash";

export class MissingApiKeyError extends Data.TaggedError("MissingApiKeyError")<{
	readonly message: string;
}> {}

export class AiGenerationError extends Data.TaggedError("AiGenerationError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

const systemPrompt = [
	"You help a habit-tracking app turn a user's goal into concrete daily habits.",
	"Return 3 to 5 habits that are specific, measurable, and realistic to do every day.",
	"Each habit needs: a single relevant emoji, a short name (a few words),",
	"a concrete target (a time or count, e.g. '20 min', '8 glasses', 'Before 11pm'),",
	"and a one-line rationale explaining how it helps the goal.",
	"Prefer small, achievable habits over ambitious ones. Do not repeat habits the user already has.",
].join(" ");

// Explicit return type keeps the value concrete so `yield*` in buildProgram does
// not try to re-infer generateText's large generic result type circularly.
async function generateSuggestions(
	prompt: string,
): Promise<AiSuggestedHabit[]> {
	const openrouter = createOpenRouter({
		apiKey: process.env.OPENROUTER_API_KEY,
	});
	const { output } = await generateText({
		model: openrouter(MODEL),
		system: systemPrompt,
		prompt,
		output: Output.object({ schema: aiHabitSuggestionsSchema }),
	});
	return output.suggestions;
}

const buildProgram = (goal: string, existingNames: readonly string[]) =>
	Effect.gen(function* () {
		if (!process.env.OPENROUTER_API_KEY) {
			return yield* new MissingApiKeyError({
				message: "OPENROUTER_API_KEY is not configured",
			});
		}

		const existing =
			existingNames.length > 0
				? `\n\nThe user already tracks these habits, so do not suggest them again: ${existingNames.join(", ")}.`
				: "";

		const suggestions: AiSuggestedHabit[] = yield* Effect.tryPromise({
			try: () =>
				generateSuggestions(`The user wants to achieve: ${goal}.${existing}`),
			catch: (cause) =>
				new AiGenerationError({
					message: "Failed to generate habit suggestions",
					cause,
				}),
		}).pipe(
			Effect.timeoutFail({
				duration: "20 seconds",
				onTimeout: () =>
					new AiGenerationError({
						message: "Habit suggestions timed out",
					}),
			}),
			Effect.retry({ times: 1 }),
		);

		return suggestions;
	});

/**
 * Generate AI habit suggestions for a goal. Runs the Effect program and resolves
 * with the suggestions, or rejects with a `MissingApiKeyError` / `AiGenerationError`.
 */
export function runSuggestHabits(
	goal: string,
	existingNames: readonly string[] = [],
): Promise<AiSuggestedHabit[]> {
	return Effect.runPromise(buildProgram(goal, existingNames));
}
