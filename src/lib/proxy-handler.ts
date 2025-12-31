import { BACKEND_URL, getProxyHeaders } from "./proxy-utils";

interface ServerContext {
	request: Request;
}

export async function proxyHandler({ request }: ServerContext) {
	const url = new URL(request.url);
	const targetUrl = `${BACKEND_URL}${url.pathname}${url.search}`;

	try {
		const response = await fetch(targetUrl, {
			method: request.method,
			headers: getProxyHeaders(request),
			body:
				request.method !== "GET" && request.method !== "HEAD"
					? await request.arrayBuffer()
					: undefined,
			redirect: "manual",
		});

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Service unavailable";
		const errorUrl = new URL("/error", url.origin);
		errorUrl.searchParams.set("message", errorMessage);
		return Response.redirect(errorUrl.toString(), 302);
	}
}

export async function oidcProxyHandler({ request }: ServerContext) {
	return proxyHandler({ request });
}
