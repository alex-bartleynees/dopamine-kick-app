import { afterEach, describe, expect, it, vi } from "vitest";

// forwardResponseCookies calls into the tanstack server runtime, which is not
// available in a plain node test env, so we mock it and assert the interaction.
const setResponseHeader = vi.fn();
vi.mock("@tanstack/react-start/server", () => ({
	setResponseHeader: (...args: unknown[]) => setResponseHeader(...args),
}));

import {
	BACKEND_URL,
	forwardResponseCookies,
	getProxyHeaders,
} from "./proxy-utils";

afterEach(() => {
	vi.clearAllMocks();
});

describe("getProxyHeaders", () => {
	it("drops hop-by-hop and content headers", () => {
		const request = new Request("https://app.example.com/api/habits", {
			headers: {
				host: "app.example.com",
				connection: "keep-alive",
				"transfer-encoding": "chunked",
				"content-length": "42",
				"content-type": "application/json",
				authorization: "Bearer token",
			},
		});

		const headers = getProxyHeaders(request);

		expect(headers.connection).toBeUndefined();
		expect(headers["transfer-encoding"]).toBeUndefined();
		expect(headers["content-length"]).toBeUndefined();
		expect(headers["content-type"]).toBeUndefined();
		expect(headers.authorization).toBe("Bearer token");
	});

	it("rewrites host to the backend host", () => {
		const request = new Request("https://app.example.com/api/habits", {
			headers: { host: "app.example.com" },
		});

		const headers = getProxyHeaders(request);

		expect(headers.host).toBe(new URL(BACKEND_URL).host);
		expect(headers["x-forwarded-host"]).toBe("app.example.com");
	});

	it("derives x-forwarded-proto from the request URL when not provided", () => {
		const request = new Request("https://app.example.com/api/habits", {
			headers: { host: "app.example.com" },
		});

		expect(getProxyHeaders(request)["x-forwarded-proto"]).toBe("https");
	});

	it("preserves an incoming x-forwarded-proto from the ingress", () => {
		const request = new Request("https://app.example.com/api/habits", {
			headers: { host: "app.example.com", "x-forwarded-proto": "http" },
		});

		expect(getProxyHeaders(request)["x-forwarded-proto"]).toBe("http");
	});

	it("prefers x-forwarded-for, then x-real-ip for the client address", () => {
		const forwarded = new Request("https://app.example.com/", {
			headers: { "x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8" },
		});
		expect(getProxyHeaders(forwarded)["x-forwarded-for"]).toBe("1.2.3.4");

		const realIp = new Request("https://app.example.com/", {
			headers: { "x-real-ip": "5.6.7.8" },
		});
		expect(getProxyHeaders(realIp)["x-forwarded-for"]).toBe("5.6.7.8");

		const neither = new Request("https://app.example.com/", {});
		expect(getProxyHeaders(neither)["x-forwarded-for"]).toBe("");
	});

	it("defaults x-forwarded-host to empty when host is absent", () => {
		const request = new Request("https://app.example.com/", {});
		expect(getProxyHeaders(request)["x-forwarded-host"]).toBe("");
	});
});

describe("forwardResponseCookies", () => {
	it("forwards every Set-Cookie header from the upstream response", () => {
		const response = new Response(null, {
			headers: {
				"set-cookie":
					"a=1, b=2, session=abc; Path=/; HttpOnly; Expires=Wed, 21 Oct 2026 07:28:00 GMT",
			},
		});

		forwardResponseCookies(response);

		const cookies = response.headers.getSetCookie();
		expect(setResponseHeader).toHaveBeenCalledTimes(cookies.length);
		for (const cookie of cookies) {
			expect(setResponseHeader).toHaveBeenCalledWith("Set-Cookie", cookie);
		}
	});

	it("does nothing when there are no cookies", () => {
		forwardResponseCookies(new Response(null));
		expect(setResponseHeader).not.toHaveBeenCalled();
	});
});
