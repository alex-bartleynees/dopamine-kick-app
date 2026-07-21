import { createFileRoute } from "@tanstack/react-router";
import { proxyHandler } from "../../lib/proxy-handler";

// Stripe posts events here server-to-server. This route is intentionally
// unauthenticated: it sits outside the `_auth` layout and is a raw server
// handler (no CSRF/function middleware), so Stripe can reach it directly.
// The backend verifies the `Stripe-Signature` header on the raw body, which
// `proxyHandler` forwards untouched.
export const Route = createFileRoute("/api/billing/webhook")({
	server: {
		handlers: {
			POST: proxyHandler,
		},
	},
});
