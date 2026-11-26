import { RESUME_LOCALES as locales } from "./resume-content.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const corePages = ["", "about/", "services/", "social/"];
const route = (locale, page) => "/" + (locale.base ? locale.base + "/" : "") + page;
const url = (locale, page) => "https://sayori.org" + route(locale, page);
const expectedAlternates = page => Object.fromEntries([
	...locales.map(locale => [locale.hreflang, url(locale, page)]),
	["x-default", url(locales[0], page)],
]);

test("core pages have one canonical, their own language and complete reciprocal alternates", () => {
	for (const page of corePages) for (const locale of locales) {
		const file = "public" + route(locale, page) + "index.html";
		const html = read(file);
		assert.equal((html.match(/rel="canonical"/g) || []).length, 1, file);
		assert.equal(canonical(html), url(locale, page), file);
		assert.equal(html.match(/<html lang="([^"]+)"/)[1], locale.htmlLang, file);
		assert.ok(html.includes('property="og:locale" content="' + locale.ogLocale + '"'), file);
		assert.equal((html.match(/<link rel="alternate" hreflang=/g) || []).length, 10, file);
		assert.deepEqual(alternates(html), expectedAlternates(page), file);
		if (page === "about/") assert.ok(html.includes('id="letter-resume" href="' + route(locale, "resume/") + '"'), file);
	}
});

test("new editions ship the English shell assets and real localized content before JavaScript", () => {
	const assets = html => [...html.matchAll(/<(?:script[^>]*?src|link rel="stylesheet" href)="([^"]+)"/g)].map(match => match[1]);
	for (const page of corePages) {
		const reference = assets(read("public/en/" + page + "index.html"));
		for (const locale of locales.filter(item => item.translated)) {
			const html = read("public" + route(locale, page) + "index.html");
			assert.deepEqual(assets(html), reference, route(locale, page));
			if (page === "" || page === "about/") {
				const data = JSON.parse(read(`public/assets/data/${page ? "about" : "home"}-${locale.file}.json`));
				assert.ok(html.includes("<title>" + data.meta.title + "</title>"), locale.id);
				if (page) {
					assert.equal(data.letter.backHref, route(locale, ""));
					assert.equal(data.letter.resume.href, route(locale, "resume/"));
					assert.ok(html.includes(data.letter.signature.ps), locale.id);
				} else {
					for (const entry of data.surface.entries) assert.ok(html.includes(entry.title), entry.title);
				}
			}
		}
	}
});

test("home page keeps the compact legacy entry surface", () => {
	const home = read("public/index.html");
	assert.doesNotMatch(home, /class="home-hero"/);
	assert.doesNotMatch(home, /class="project-showcase"/);
	assert.doesNotMatch(home, /homepage-sections\.css/);
	assert.equal(home.match(/class="entry(?:\s|\")/g)?.length, 6);
	for (const number of ["01", "02", "03", "04", "05", "06"]) {
		assert.match(home, new RegExp(`class="entry-num">${number}<`));
	}
});

test("sitemap includes all localized landing, about, and services routes", () => {
	const sitemap = read("public/sitemap.xml");
	const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
	assert.deepEqual(locations, [
		...corePages.flatMap(page => locales.map(locale => url(locale, page))),
		"https://sayori.org/tools/",
		"https://sayori.org/tools/subarutap/",
		...locales.map(locale => url(locale, "resume/")),
		"https://sayori.org/manifesto/",
		"https://sayori.org/zh-hant/manifesto/",
		"https://sayori.org/en/manifesto/",
	]);
	for (const block of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
		const href = block[1].match(/<loc>([^<]+)/)[1];
		const page = corePages.find(page => locales.some(locale => url(locale, page) === href));
		if (page !== undefined) assert.deepEqual(alternates(block[1]), expectedAlternates(page), href);
	}
});

test("each profile page defines its main person in the same document", () => {
	for (const locale of locales.map(l => l.base ? l.base + "/" : "")) {
		const html = read(`public/${locale}about/index.html`);
		const schema = JSON.parse(html.match(/<script[^>]+id="about-schema"[^>]*>([\s\S]*?)<\/script>/)[1]);
		const profile = schema["@graph"].find((item) => item["@type"] === "ProfilePage");
		assert.equal(profile.mainEntity["@type"], "Person", locale || "zh-Hans");
		assert.ok(profile.mainEntity.name);
		assert.equal(profile.mainEntity["@id"], "https://sayori.org/#person");
	}
});

test("legacy URLs do not redirect live locale pages back to a query-only URL", () => {
	const redirects = read("public/_redirects");
	assert.match(redirects, /\/zh \/\?lang=zh 301/);
	for (const locale of locales.slice(1)) for (const page of corePages) {
		const target = route(locale, page);
		assert.ok(redirects.split(/\r?\n/).includes(target.slice(0, -1) + " " + target + " 301"), target);
	}
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
	return Object.fromEntries([...html.matchAll(/<(?:xhtml:)?link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
		.map((match) => [match[1], match[2]]));
}

function canonical(html) {
	return html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || "";
}

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}
test("unknown URLs have a noindex 404 document instead of the Pages SPA fallback", () => {
	assert.match(read("public/404.html"), /name="robots" content="noindex"/);
});
