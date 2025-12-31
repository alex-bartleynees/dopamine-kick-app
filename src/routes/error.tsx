import { createFileRoute } from "@tanstack/react-router";
import { ErrorComponent } from "@/components/ErrorComponent";

export const Route = createFileRoute("/error")({
	validateSearch: (search: Record<string, unknown>) => ({
		message: (search.message as string) || "An unexpected error occurred",
	}),
	component: ErrorPage,
});

function ErrorPage() {
	const { message } = Route.useSearch();

	return <ErrorComponent message={message} />;
}
