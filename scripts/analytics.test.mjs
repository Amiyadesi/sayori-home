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
	assert.match(source, /requestIdleCallback/);
	assert.match(source, /data-sayori-ga4/);
});

test("every public analytics entry point is identified and cache-busted", () => {
	for (const relativePath of ["public/index.html", "public/about/index.html", "public/sponsor/index.html"]) {
		const html = fs.readFileSync(path.join(root, relativePath), "utf8");
		assert.match(html, /data-sayori-analytics-site="[^"]+"/, relativePath);
		assert.match(
			html,
			/analytics\.notebook\.js\?v=20260807-perf2/,
			relativePath,
		);
	}
});
