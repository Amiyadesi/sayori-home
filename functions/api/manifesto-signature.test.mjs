import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { onRequest } from "./manifesto-signature.js";

const url = "https://sayori.org/api/manifesto-signature";
const migration = readFileSync(new URL("../../migrations/manifesto/0001_public_signatures.sql", import.meta.url), "utf8");

function setup() {
	const db = new DatabaseSync(":memory:");
	db.exec(migration);
	const env = {
		MANIFESTO_SIGNATURES: {
			prepare(sql) {
				return { bind: (...values) => {
					const stmt = db.prepare(sql.replace(/\?\d+/g, "?"));
					return { first: async () => stmt.get(...values) ?? null, run: async () => stmt.run(...values) };
				} };
			},
		},
		MANIFESTO_RATE_SECRET: "test only",
		ASSETS: { fetch: async () => Response.json({ signers: [{ name: "Amiya_desi" }, { name: "Not in queue" }] }) },
	};
	const send = (payload, changes) => onRequest({ env, request: new Request(url, {
		method: "POST",
		headers: { "origin": "https://sayori.org", "content-type": "application/json", "cf-connecting-ip": "192.0.2.1" },
		body: JSON.stringify(payload),
		...changes,
	}) });
	return { db, send };
}

const code = "0123456789abcdef".repeat(3);
const other = "fedcba9876543210".repeat(3);
const join = (nickname = "Paper Crane", receipt = code) => ({ action: "apply", nickname, consent: true, receipt });

test("private intake, retry, duplicate reservation and removal by code", async () => {
	const { db, send } = setup();
	assert.equal((await send(join())).status, 200);
	assert.equal((await send(join())).status, 200);
	assert.equal((await send(join("Ｐaper Crane", other))).status, 409);
	assert.equal((await send({ action: "remove", receipt: other })).status, 404);
	assert.equal((await send({ action: "remove", receipt: code })).status, 200);
	assert.equal((await send({ action: "remove", receipt: code })).status, 200);
	const row = db.prepare("SELECT * FROM signature_requests").get();
	assert.equal(row.nickname, "Paper Crane");
	assert.notEqual(row.receipt_hash, code);
	assert.equal(row.approved_at, null);
	assert.ok(row.removal_requested_at);
	assert.equal(db.prepare("SELECT * FROM signature_rate_limits").get().bucket_key.includes("192.0.2.1"), false);
});

test("public names are reserved; malformed, oversized, nonconsensual and cross-origin requests never enter the queue", async () => {
	const { db, send } = setup();
	for (const nickname of ["Ａｍｉｙａ＿ｄｅｓｉ", "Not in queue"]) assert.equal((await send(join(nickname))).status, 409);
	for (const nickname of ["<img>", "user@example.com", "abc\u202e", "", "x".repeat(49)]) {
		assert.equal((await send(join(nickname))).status, 400);
	}
	assert.equal((await send({ ...join(), consent: false })).status, 400);
	assert.equal((await send({ ...join(), email: "private" })).status, 400);
	assert.equal((await send({ ...join(), nickname: "x".repeat(1000) })).status, 413);
	assert.equal((await send(join(), { headers: { origin: "https://elsewhere.test" } })).status, 403);
	assert.equal(db.prepare("SELECT count(*) AS count FROM signature_requests").get().count, 0);
});

test("rate limit refuses further submissions in the same bucket", async () => {
	const { db, send } = setup();
	for (let i = 0; i < 8; i++) assert.equal((await send(join())).status, 200);
	const denied = await send(join("A second nickname", other));
	assert.equal(denied.status, 429);
	assert.ok(Number(denied.headers.get("retry-after")) > 0);
	assert.equal(db.prepare("SELECT count(*) AS count FROM signature_requests").get().count, 1);
});
