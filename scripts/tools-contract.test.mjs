import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("tools page keeps the local image workflow wired", () => {
	const html = fs.readFileSync(path.join(root, "public/tools/index.html"), "utf8");
	const js = fs.readFileSync(path.join(root, "public/tools/tools.js"), "utf8");

	for (const id of ["pixel-background", "tiles-info"]) assert.match(html, new RegExp(`id=\"${id}\"`), `${id} is present`);
	for (const action of ["pixel-download", "tiles-download"]) assert.match(html, new RegExp(`data-action=\"${action}\"`), `${action} is present`);
	assert.match(js, /pixel-background/);
	assert.match(js, /tileStats/);
	assert.match(js, /toBlob\(/);
	assert.doesNotMatch(js, /fetch\(/, "image processing stays local");
});
