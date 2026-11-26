import { RESUME_LOCALES as locales } from "./resume-content.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("canonical pages keep main and navigation landmarks without a visible skip link", () => {
	for (const { base } of locales) {
		const home = read(path.join("public", base, "index.html"));
		const services = read(path.join("public", base, "services", "index.html"));
		assert.match(home, /<main id="main-content" class="notebook-page">/);
		assert.match(home, /<nav class="entries"/);
		assert.match(services, /<main id="main-content">/);
		assert.match(services, /<nav class="top-nav"/);
		for (const html of [home, services]) assert.doesNotMatch(html, /skip-link|跳到主要内容|Skip to main content/);
	}
});

test("no public HTML or stylesheet retains the removed skip-link component", () => {
	for (const relativePath of [
		"public/zh/index.html",
		...locales.flatMap(({ base }) => ["", "services/", "social/", "about/"].map(page => path.join("public", base, page, "index.html"))),
		"public/zh/services/index.html",
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
