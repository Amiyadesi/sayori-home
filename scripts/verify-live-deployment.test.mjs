import assert from "node:assert/strict";
import { test } from "node:test";

import { verifyHomeDeployment } from "./verify-live-deployment.mjs";

const expected = {
	codeSha: "1".repeat(40),
	contentSha: "2".repeat(40),
	builtAt: "2026-07-16T04:05:06.000Z",
	workflowRun: "https://github.com/Amiyadesi/sayori-home/actions/runs/123",
};

test("verifies the home page and immutable deployment metadata", async () => {
	const requested = [];
	await verifyHomeDeployment("https://sayori.org", expected, {
		attempts: 1,
		delayMs: 0,
		fetchImpl: async (url) => {
			requested.push(url.pathname);
			if (url.pathname === "/deployment.json") return Response.json(expected);
			return new Response("x".repeat(101));
		},
	});
	assert.deepEqual(requested, ["/deployment.json", "/"]);
});

test("retries until the custom domain exposes the new code SHA", async () => {
	let manifestRequests = 0;
	await verifyHomeDeployment("https://sayori.org", expected, {
		attempts: 2,
		delayMs: 0,
		fetchImpl: async (url) => {
			if (url.pathname === "/deployment.json") {
				manifestRequests += 1;
				return Response.json({
					...expected,
					codeSha: manifestRequests === 1 ? "stale" : expected.codeSha,
				});
			}
			return new Response("x".repeat(101));
		},
	});
	assert.equal(manifestRequests, 2);
});
