import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(
	path.join(root, "public/analytics.notebook.js"),
	"utf8",
);

test("analytics heartbeat is bounded and initialized once", () => {
	assert.match(source, /const heartbeatMs = 60000;/);
	assert.match(source, /dataset\.sayoriAnalyticsTracker/);
});

test("every public analytics entry point cache-busts the reduced heartbeat", () => {
	for (const relativePath of ["public/index.html", "public/sponsor/index.html"]) {
		const html = fs.readFileSync(path.join(root, relativePath), "utf8");
		assert.match(
			html,
			/analytics\.notebook\.js\?v=20260726-heartbeat-60s/,
			relativePath,
		);
	}
});
