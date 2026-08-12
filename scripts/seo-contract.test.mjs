import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("public content pages each expose one canonical URL", () => {
	const home = read("public/index.html");
	const services = read("public/services/index.html");
	const about = read("public/about/index.html");
	const tools = read("public/tools/index.html");
	const subaruTap = read("public/tools/subarutap/index.html");
	const subaruTapJs = read("public/tools/subarutap/main.js");

	assert.equal(canonical(home), "https://sayori.org/");
	assert.equal(canonical(services), "https://sayori.org/services/");
	assert.equal(canonical(about), "https://sayori.org/about/");
	assert.equal(canonical(tools), "https://sayori.org/tools/");
	assert.equal(canonical(subaruTap), "https://sayori.org/tools/subarutap/");
	assert.doesNotMatch(home, /hreflang=/);
	assert.doesNotMatch(services, /hreflang=/);
	assert.doesNotMatch(about, /hreflang=/);
	assert.notEqual(title(home), title(services));
	assert.notEqual(title(home), title(about));
	assert.notEqual(title(services), title(about));
	assert.match(subaruTap, /"@type": "WebApplication"/);
	assert.match(subaruTap, /https:\/\/github\.com\/Amiyadesi\/subarutap/);
	assert.match(subaruTap, /<h1 class="sr-only">Subaru Tap/);
	assert.match(subaruTap, /<nav class="controls"/);
	assert.match(subaruTap, /subaru_entry-180\.webp 180w/);
	assert.match(subaruTap, /main\.js\?v=13/);
	assert.match(subaruTapJs, /avatar\.removeAttribute\('srcset'\)[\s\S]*avatar\.src = 'Image\/subaru_cat\.png'/);
});

test("sitemap lists only the canonical content pages", () => {
	const sitemap = read("public/sitemap.xml");
	const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

	assert.deepEqual(locations, [
		"https://sayori.org/",
		"https://sayori.org/services/",
		"https://sayori.org/about/",
		"https://sayori.org/tools/",
		"https://sayori.org/tools/subarutap/",
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

test("Cloudflare Pages sends HSTS with the existing security headers", () => {
	const headers = read("public/_headers");
	assert.match(headers, /Strict-Transport-Security:\s*max-age=31536000/i);
	assert.match(headers, /X-Content-Type-Options:\s*nosniff/i);
	assert.match(headers, /\/tools\/subarutap\/Image\/\*[\s\S]*max-age=31536000, immutable/);
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
