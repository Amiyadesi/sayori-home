import { manifestoNameKey } from "../_lib/manifesto-name.js";

const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
const reply = (status, error, headers) => Response.json(error ? { error } : { ok: true }, {
	status,
	headers: { "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers },
});

async function readPayload(request) {
	const reader = request.body?.getReader();
	if (!reader) return null;
	const decoder = new TextDecoder("utf-8", { fatal: true });
	let size = 0, text = "";
	for (;;) {
		const { value, done } = await reader.read();
		if (done) return JSON.parse(text + decoder.decode());
		size += value.byteLength;
		if (size > 1024) {
			await reader.cancel();
			throw new RangeError("payload too large");
		}
		text += decoder.decode(value, { stream: true });
	}
}

async function rateLimit(db, ip, secret) {
	const window = 600;
	const now = Math.floor(Date.now() / 1000);
	const bucketEnd = (Math.floor(now / window) + 1) * window;
	const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	const bucket = hex(await crypto.subtle.sign("HMAC", key, encoder.encode(bucketEnd + ":" + ip)));
	await db.prepare("DELETE FROM signature_rate_limits WHERE expires <= ?1").bind(now).run();
	const allowed = await db.prepare(`
		INSERT INTO signature_rate_limits (bucket_key, expires, submissions) VALUES (?1, ?2, 1)
		ON CONFLICT(bucket_key) DO UPDATE SET submissions = submissions + 1 WHERE submissions < 8
		RETURNING submissions
	`).bind(bucket, bucketEnd).first();
	return allowed ? 0 : bucketEnd - now;
}

export async function onRequest({ env, request }) {
	if (request.method !== "POST") return reply(405, "method", { allow: "POST" });
	const url = new URL(request.url);
	if (request.headers.get("origin") !== url.origin) return reply(403, "origin");
	if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return reply(415, "format");
	let payload;
	try {
		payload = await readPayload(request);
	} catch (error) {
		return error instanceof RangeError ? reply(413, "invalid") : reply(400, "invalid");
	}
	if (!payload || typeof payload.receipt !== "string" || !/^[a-f0-9]{48}$/.test(payload.receipt)) return reply(400, "invalid");
	const { action, receipt } = payload;
	const nickname = typeof payload.nickname === "string" ? payload.nickname.trim() : "";
	const identity = manifestoNameKey(nickname);
	if (action === "apply" ? !identity || payload.consent !== true || Object.keys(payload).length !== 4
		: action !== "remove" || Object.keys(payload).length !== 2) return reply(400, "invalid");
	const db = env.MANIFESTO_SIGNATURES;
	const ip = request.headers.get("cf-connecting-ip");
	if (!db || !env.MANIFESTO_RATE_SECRET || !ip) return reply(503, "unavailable");

	try {
		const wait = await rateLimit(db, ip, env.MANIFESTO_RATE_SECRET);
		if (wait) return reply(429, "limited", { "retry-after": String(wait) });
		const proof = hex(await crypto.subtle.digest("SHA-256", encoder.encode(receipt)));
		if (action === "remove") {
			const removed = await db.prepare(`
				UPDATE signature_requests SET removal_requested_at = COALESCE(removal_requested_at, CURRENT_TIMESTAMP)
				WHERE receipt_hash = ?1 RETURNING id
			`).bind(proof).first();
			return removed ? reply(200) : reply(404, "not-found");
		}
		// Recover the same receipt if the first response was lost, even after approval.
		const previous = await db.prepare("SELECT name_key, removal_requested_at FROM signature_requests WHERE receipt_hash = ?1")
			.bind(proof).first();
		if (previous) return previous.name_key === identity && !previous.removal_requested_at ? reply(200) : reply(409, "duplicate");
		const roster = await env.ASSETS.fetch(new URL("/manifesto/signers.json", url));
		if (!roster.ok) throw new Error("Public roll asset unavailable");
		const { signers } = await roster.json();
		if (signers.some(signer => manifestoNameKey(signer.name) === identity)) return reply(409, "duplicate");

		const added = await db.prepare(`
			INSERT INTO signature_requests (nickname, name_key, receipt_hash) VALUES (?1, ?2, ?3)
			ON CONFLICT DO NOTHING RETURNING id
		`).bind(nickname, identity, proof).first();
		return added ? reply(200) : reply(409, "duplicate");
	} catch {
		console.error("Manifesto signature intake unavailable");
		return reply(503, "unavailable");
	}
}
