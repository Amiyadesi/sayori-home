import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("each localized public page has one matching canonical and a reciprocal hreflang set", () => {
	const pages = [
		["public/index.html", "https://sayori.org/", "https://sayori.org/", "https://sayori.org/zh-hant/", "https://sayori.org/en/"],
		["public/zh-hant/index.html", "https://sayori.org/zh-hant/", "https://sayori.org/", "https://sayori.org/zh-hant/", "https://sayori.org/en/"],
		["public/en/index.html", "https://sayori.org/en/", "https://sayori.org/", "https://sayori.org/zh-hant/", "https://sayori.org/en/"],
		["public/about/index.html", "https://sayori.org/about/", "https://sayori.org/about/", "https://sayori.org/zh-hant/about/", "https://sayori.org/en/about/"],
		["public/zh-hant/about/index.html", "https://sayori.org/zh-hant/about/", "https://sayori.org/about/", "https://sayori.org/zh-hant/about/", "https://sayori.org/en/about/"],
		["public/en/about/index.html", "https://sayori.org/en/about/", "https://sayori.org/about/", "https://sayori.org/zh-hant/about/", "https://sayori.org/en/about/"],
		["public/services/index.html", "https://sayori.org/services/", "https://sayori.org/services/", "https://sayori.org/zh-hant/services/", "https://sayori.org/en/services/"],
		["public/zh-hant/services/index.html", "https://sayori.org/zh-hant/services/", "https://sayori.org/services/", "https://sayori.org/zh-hant/services/", "https://sayori.org/en/services/"],
		["public/en/services/index.html", "https://sayori.org/en/services/", "https://sayori.org/services/", "https://sayori.org/zh-hant/services/", "https://sayori.org/en/services/"],
	];
	for (const [file, expectedCanonical, zhHans, zhHant, en] of pages) {
		const html = read(file);
		assert.equal(canonical(html), expectedCanonical, file);
		assert.deepEqual(alternates(html), {
			"zh-Hans": zhHans,
			"zh-Hant": zhHant,
			en,
			"x-default": zhHans,
		}, file);
	}
});

test("home page copy leads with the game-maker identity and highest-priority work", () => {
	const home = read("public/index.html");
	assert.match(home, /用 Godot 做独立游戏/);
	assert.match(home, /试玩《梦醒边界》/);
	assert.match(home, /看开发记录/);
	const start = home.indexOf('class="project-showcase"');
	const showcase = home.slice(start, home.indexOf("</section>", start));
	const order = ["梦醒边界", "DelayTrace", "TimeRewindLinker", "Enhanced Save System", "GeoScore"]
		.map((name) => showcase.indexOf(name));
	assert.ok(order.every((index) => index >= 0));
	assert.deepEqual(order, [...order].sort((a, b) => a - b));
	assert.match(showcase, /GodotHub 第三届命题 Jam 赛道二等奖/);
});

test("sitemap includes all localized landing, about, and services routes", () => {
	const sitemap = read("public/sitemap.xml");
	const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
	assert.deepEqual(locations, [
		"https://sayori.org/",
		"https://sayori.org/zh-hant/",
		"https://sayori.org/en/",
		"https://sayori.org/about/",
		"https://sayori.org/zh-hant/about/",
		"https://sayori.org/en/about/",
		"https://sayori.org/services/",
		"https://sayori.org/zh-hant/services/",
		"https://sayori.org/en/services/",
		"https://sayori.org/tools/",
		"https://sayori.org/tools/subarutap/",
	]);
	assert.match(sitemap, /hreflang="x-default"/);
});

test("legacy URLs do not redirect live locale pages back to a query-only URL", () => {
	const redirects = read("public/_redirects");
	assert.match(redirects, /\/zh \/\?lang=zh 301/);
	assert.match(redirects, /\/en \/en\/ 301/);
	assert.match(redirects, /\/zh-hant \/zh-hant\/ 301/);
	assert.doesNotMatch(redirects, /\/en\/ \/\?lang=en/);
	assert.doesNotMatch(redirects, /\/en\/services\/ \/services\/\?lang=en/);
});

test("legacy Simplified Chinese shells remain noindex while /en/ is a real canonical page", () => {
	for (const relativePath of ["public/zh/index.html", "public/zh/services/index.html"]) {
		const html = read(relativePath);
		assert.match(html, /name="robots" content="noindex,follow"/);
		assert.doesNotMatch(canonical(html), /\/zh\//);
	}
	assert.equal(canonical(read("public/en/index.html")), "https://sayori.org/en/");
	assert.doesNotMatch(read("public/en/index.html"), /name="robots" content="noindex,follow"/);
});

test("the remaining utility pages retain their canonical metadata", () => {
	const tools = read("public/tools/index.html");
	const subaruTap = read("public/tools/subarutap/index.html");
	const subaruTapJs = read("public/tools/subarutap/main.js");
	assert.equal(canonical(tools), "https://sayori.org/tools/");
	assert.equal(canonical(subaruTap), "https://sayori.org/tools/subarutap/");
	assert.match(subaruTap, /"@type": "WebApplication"/);
	assert.match(subaruTap, /https:\/\/github\.com\/Amiyadesi\/subarutap/);
	assert.match(subaruTap, /<h1 class="sr-only">Subaru Tap/);
	assert.match(subaruTap, /<nav class="controls"/);
	assert.match(subaruTap, /subaru_entry-180\.webp 180w/);
	assert.match(subaruTap, /main\.js\?v=13/);
	assert.match(subaruTapJs, /avatar\.removeAttribute\('srcset'\)[\s\S]*avatar\.src = 'Image\/subaru_cat\.png'/);
});

test("Cloudflare Pages keeps the existing security headers", () => {
	const headers = read("public/_headers");
	assert.match(headers, /Strict-Transport-Security:\s*max-age=31536000/i);
	assert.match(headers, /X-Content-Type-Options:\s*nosniff/i);
	assert.match(headers, /\/tools\/subarutap\/Image\/\*[\s\S]*max-age=31536000, immutable/);
});

function alternates(html) {
	return Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
		.map((match) => [match[1], match[2]]));
}

function canonical(html) {
	return html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || "";
}

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}
