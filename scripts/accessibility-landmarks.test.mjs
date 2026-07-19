import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("root fallback exposes a keyboard skip link and navigation landmarks", () => {
	const html = read("public/index.html");

	assert.match(html, /<a class="skip-link" href="#main-content">/);
	assert.match(html, /<main id="main-content" class="fallback-note"/);
	assert.match(html, /<nav class="langs" aria-label="Choose language">/);
	assert.match(html, /<nav class="primary-links" aria-label="Primary links">/);
});

test("localized home surfaces expose keyboard skip links", () => {
	for (const relativePath of ["public/zh/index.html", "public/en/index.html"]) {
		const html = read(relativePath);
		assert.match(html, /<a class="skip-link" href="#main-content">/);
		assert.match(html, /<main id="main-content" class="notebook-page">/);
	}
});

test("both committed stylesheets include the visible focus treatment", () => {
	for (const relativePath of ["public/styles.notebook.css", "public/styles.notebook.min.css"]) {
		const css = read(relativePath);
		assert.ok(css.includes(".skip-link"), `${relativePath}: .skip-link`);
		assert.ok(css.includes(".skip-link:focus"), `${relativePath}: .skip-link:focus`);
	}
});

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}
