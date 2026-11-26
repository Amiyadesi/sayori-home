import { RESUME_LOCALES as locales } from "./resume-content.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("visible Sayori artwork uses responsive derivatives", () => {
	for (const relativePath of locales.flatMap(({ base }) => ["", "services/"].map(page => path.join("public", base, page, "index.html")))) {
		const html = read(relativePath);
		assert.match(html, /sayori-lineart-256\.webp\?v=20260807-perf 256w/);
		assert.match(html, /sayori-lineart-512\.webp\?v=20260807-perf 512w/);
		assert.match(html, /sayori-lineart\.webp 1024w/);
		assert.match(html, /width="512"\s+height="512"/);
	}
});

test("analytics is a deferred first-party script, with no Google tag", () => {
	for (const relativePath of locales.flatMap(({ base }) => ["", "about/"].map(page => path.join("public", base, page, "index.html")))) {
		const html = read(relativePath);
		assert.doesNotMatch(html, /googletagmanager\.com\/gtag\/js/);
		assert.match(html, /<script defer src="[^\"]*analytics\.notebook\.js\?v=20261121-first-party"/);
	}
});

test("non-critical home requests are scheduled after the initial script path", () => {
	const source = read("public/script.notebook.js");
	assert.match(source, /runWhenIdle\(initWeather, 1800\)/);
	assert.match(source, /runWhenIdle\(loadGuestbookNotes, 3000\)/);
	assert.doesNotMatch(source, /\ninitWeather\(\);/);
	assert.doesNotMatch(source, /\nloadCmdData\(\);/);
	assert.match(source, /loadCmdData\(\)\.finally\(\(\) => initTerminal\(\)\)/);
});

test("the weather line asks wttr.in for plain text, which browsers no longer get by default", () => {
	for (const file of ["public/script.notebook.js", "public/script.notebook.min.js"]) {
		assert.match(read(file), /wttr\.in\/\?format=%c%t&lang=\$\{\w+\}&A`/);
	}
});

test("versioned scripts and derived images are immutable", () => {
	const headers = read("public/_headers");
	assert.match(headers, /\/i18n-router\.js[\s\S]*max-age=31536000, immutable/);
	assert.match(headers, /\/i18n-bootstrap\.js[\s\S]*max-age=31536000, immutable/);
	assert.match(headers, /\/analytics\.notebook\.js[\s\S]*max-age=31536000, immutable/);
	assert.match(headers, /\/assets\/generated\/\*[\s\S]*max-age=31536000, immutable/);
	assert.ok(fs.statSync(path.join(root, "public/assets/generated/sayori-lineart-256.webp")).size > 0);
	assert.ok(fs.statSync(path.join(root, "public/assets/generated/sayori-lineart-512.webp")).size > 0);
});
