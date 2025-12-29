import { createFileRoute } from "@tanstack/react-router";
import { proxyHandler } from "../../lib/proxy-handler";

export const Route = createFileRoute("/bff/$")({
	server: {
		handlers: {
			GET: proxyHandler,
			POST: proxyHandler,
			PUT: proxyHandler,
			DELETE: proxyHandler,
			PATCH: proxyHandler,
			OPTIONS: proxyHandler,
		},
	},
});
