import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("canonical pages keep main and navigation landmarks with a focus-only skip link", () => {
	const home = read("public/index.html");
	const about = read("public/about/index.html");
	const services = read("public/services/index.html");
	const tools = read("public/tools/index.html");

	assert.match(home, /<main id="main-content" class="notebook-page">/);
	assert.match(home, /<nav class="entries"/);
	assert.match(about, /<main class="letter-paper" id="main-content"/);
	assert.match(services, /<main id="main-content">/);
	assert.match(services, /<nav class="top-nav"/);
	assert.match(tools, /<main class="tools-main" id="main-content">/);
	for (const html of [home, about, services, tools]) {
		assert.match(html, /<a class="skip-link" href="#main-content">/);
		assert.match(html, /\.skip-link:focus-visible\{transform:translateY\(0\)/);
	}
});

test("legacy language redirects do not add duplicate visible navigation", () => {
	for (const relativePath of [
		"public/zh/index.html",
		"public/en/index.html",
		"public/zh/services/index.html",
		"public/en/services/index.html",
	]) {
		assert.doesNotMatch(read(relativePath), /class="skip-link"/, relativePath);
	}
});

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}
