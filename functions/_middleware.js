import { requestLocale } from "./_lib/locale.js";

export async function onRequest(context) {
	const response = await context.next();
	const { setCookie } = requestLocale(context.request);
	if (!setCookie) return response;
	const headers = new Headers(response.headers);
	headers.append("set-cookie", setCookie);
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
