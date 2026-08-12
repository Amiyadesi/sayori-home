import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("canonical pages keep main and navigation landmarks without a visible skip link", () => {
	const home = read("public/index.html");
	const services = read("public/services/index.html");

	assert.match(home, /<main id="main-content" class="notebook-page">/);
	assert.match(home, /<nav class="entries"/);
	assert.match(services, /<main id="main-content">/);
	assert.match(services, /<nav class="top-nav"/);
	for (const html of [home, services]) {
		assert.doesNotMatch(html, /skip-link|跳到主要内容|Skip to main content/);
	}
});

test("no public HTML or stylesheet retains the removed skip-link component", () => {
	for (const relativePath of [
		"public/index.html",
		"public/services/index.html",
		"public/zh/index.html",
		"public/en/index.html",
		"public/zh/services/index.html",
		"public/en/services/index.html",
		"public/styles.notebook.css",
		"public/styles.notebook.min.css",
		"public/services/services.css",
	]) {
		assert.doesNotMatch(read(relativePath), /skip-link|跳到主要内容|Skip to main content/, relativePath);
	}
});

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}
