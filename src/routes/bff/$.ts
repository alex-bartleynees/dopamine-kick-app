import { createFileRoute } from "@tanstack/react-router";
import { proxyHandler } from "../../lib/proxy-handler";

export const Route = createFileRoute("/bff/$")({
	server: {
		handlers: {
			GET: proxyHandler,
		},
	},
});
