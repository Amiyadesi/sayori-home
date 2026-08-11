import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("home, services and about each expose one canonical URL", () => {
	const home = read("public/index.html");
	const services = read("public/services/index.html");
	const about = read("public/about/index.html");

	assert.equal(canonical(home), "https://sayori.org/");
	assert.equal(canonical(services), "https://sayori.org/services/");
	assert.equal(canonical(about), "https://sayori.org/about/");
	assert.doesNotMatch(home, /hreflang=/);
	assert.doesNotMatch(services, /hreflang=/);
	assert.doesNotMatch(about, /hreflang=/);
	assert.notEqual(title(home), title(services));
	assert.notEqual(title(home), title(about));
	assert.notEqual(title(services), title(about));
});

test("sitemap lists only the canonical content pages", () => {
	const sitemap = read("public/sitemap.xml");
	const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

	assert.deepEqual(locations, [
		"https://sayori.org/",
		"https://sayori.org/services/",
		"https://sayori.org/about/",
		"https://sayori.org/tools/",
	]);
	assert.doesNotMatch(sitemap, /\/zh\/|\/en\//);
});

test("legacy language pages cannot compete with canonical pages", () => {
	for (const relativePath of [
		"public/zh/index.html",
		"public/en/index.html",
		"public/zh/services/index.html",
		"public/en/services/index.html",
	]) {
		const html = read(relativePath);
		assert.match(html, /name="robots" content="noindex,follow"/);
		assert.doesNotMatch(canonical(html), /\/zh\/|\/en\//);
	}
});

test("support page stays accessible without competing for search results", () => {
	const sponsor = read("public/sponsor/index.html");
	assert.match(sponsor, /name="robots" content="noindex, follow, max-image-preview:large"/);
	assert.equal(canonical(sponsor), "https://sayori.org/sponsor/");
});

test("dynamic truth cameo reserves a stable image box", () => {
	const home = read("public/index.html");
	assert.match(home, /id="truth-cameo"[\s\S]*?<img src="" alt="" decoding="async" width="520" height="680" \/>/);
	assert.match(home, /"position": 9,[\s\S]*?"name": "小工具台"/);
});

test("Cloudflare Pages sends HSTS with the existing security headers", () => {
	const headers = read("public/_headers");
	assert.match(headers, /Strict-Transport-Security:\s*max-age=31536000/i);
	assert.match(headers, /X-Content-Type-Options:\s*nosniff/i);
});

function canonical(html) {
	return html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || "";
}

function title(html) {
	return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || "";
}

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}
