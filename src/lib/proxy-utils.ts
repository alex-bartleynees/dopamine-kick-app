import { setResponseHeader } from "@tanstack/react-start/server";

export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5224";

export function forwardResponseCookies(response: Response): void {
	for (const cookie of response.headers.getSetCookie()) {
		setResponseHeader("Set-Cookie", cookie);
	}
}

export function getProxyHeaders(request: Request): Record<string, string> {
	const headers: Record<string, string> = {};

	for (const [key, value] of request.headers.entries()) {
		if (
			![
				"host",
				"connection",
				"transfer-encoding",
				"content-length",
				"content-type",
			].includes(key.toLowerCase())
		) {
			headers[key] = value;
		}
	}

	headers.host = new URL(BACKEND_URL).host;
	headers["x-forwarded-host"] = request.headers.get("host") || "";
	// Preserve x-forwarded-proto from ingress if it exists, otherwise use current protocol
	headers["x-forwarded-proto"] =
		request.headers.get("x-forwarded-proto") ||
		new URL(request.url).protocol.slice(0, -1);
	headers["x-forwarded-for"] =
		request.headers.get("x-forwarded-for") ||
		request.headers.get("x-real-ip") ||
		"";

	return headers;
}
