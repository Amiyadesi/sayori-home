import { requestLocale } from "../_lib/locale.js";

const ALLOWED_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)*sayori\.org$/i;

export function onRequestOptions({ request }) {
	return response(request, null, 204);
}

export function onRequestGet({ request }) {
	const { locale, setCookie } = requestLocale(request);
	return response(request, { locale }, 200, setCookie);
}

function response(request, body, status, setCookie) {
	const origin = request.headers.get("origin") || "";
	const headers = new Headers({
		"cache-control": "no-store",
		"content-type": "application/json; charset=utf-8",
		"x-content-type-options": "nosniff",
	});
	if (ALLOWED_ORIGIN.test(origin)) {
		headers.set("access-control-allow-origin", origin);
		headers.set("access-control-allow-credentials", "true");
		headers.set("access-control-allow-methods", "GET, OPTIONS");
		headers.set("vary", "Origin");
	}
	if (setCookie) headers.append("set-cookie", setCookie);
	return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}
