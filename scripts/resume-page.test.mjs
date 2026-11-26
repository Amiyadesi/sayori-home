import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { assertOutsideGit } from "./build-resume-pdf.mjs";
import { RESUME_LOCALES } from "./resume-content.mjs";
import { resumePath } from "./render-resume-page.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const pageFile = (locale) => `public${resumePath(locale)}index.html`;
const url = (locale) => `https://sayori.org${resumePath(locale)}`;
const WINDOWS = ["whoami", "awards", "works", "skills", "jams", "contact", "options"];

test("every résumé edition is a complete static document", () => {
	for (const locale of RESUME_LOCALES) {
		const html = read(pageFile(locale));
		assert.match(html, new RegExp(`<html lang="${locale.htmlLang}"`), locale.id);
		for (const id of WINDOWS) assert.match(html, new RegExp(`<section class="win[^"]*" id="${id}"`), `${locale.id} ${id}`);
		assert.equal(html.match(/<section class="win win--work"/g)?.length, 10, locale.id);
		assert.equal(html.match(/<li class="award">/g)?.length, 4, locale.id);
		assert.equal(html.match(/<li class="log-entry/g)?.length, 13, locale.id);
		assert.match(html, /<main class="desktop" id="main-content">/);
		assert.match(html, /data-sayori-analytics-site="resume"/);
		assert.doesNotMatch(html, /paper-|p34-/, `${locale.id} must not load Project 34`);
		assert.doesNotMatch(html, /print-identity/, `${locale.id} must not include private identity`);
		assert.doesNotMatch(html, /\{\{\w+\}\}/, `${locale.id} has an unfilled placeholder`);
	}
});

test("résumé editions point at each other with one canonical URL", () => {
	const expected = Object.fromEntries([...RESUME_LOCALES.map((locale) => [locale.hreflang, url(locale)]), ["x-default", url(RESUME_LOCALES[0])]]);
	for (const locale of RESUME_LOCALES) {
		const html = read(pageFile(locale));
		assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/)[1], url(locale));
		const alternates = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((match) => [match[1], match[2]]));
		assert.deepEqual(alternates, expected, locale.id);
		assert.match(html, new RegExp(`<meta property="og:locale" content="${locale.ogLocale}"`));
	}
});

test("structured data describes the person and the awards", () => {
	for (const locale of RESUME_LOCALES) {
		const html = read(pageFile(locale));
		const schema = JSON.parse(html.match(/<script type="application\/ld\+json" id="resume-schema">([\s\S]*?)<\/script>/)[1]);
		const profile = schema["@graph"].find((item) => item["@type"] === "ProfilePage");
		const person = schema["@graph"].find((item) => item["@type"] === "Person");
		assert.equal(profile.mainEntity["@id"], "https://sayori.org/#person");
		assert.equal(profile.inLanguage, locale.htmlLang);
		assert.equal(person.name, "Amiya_desi");
		assert.equal(person.award.length, 4);
		assert.ok(person.sameAs.includes("https://github.com/Amiyadesi"));
		assert.ok(person.knowsAbout.length >= 10);
	}
});

test("machine-translated editions say so and the source editions do not", () => {
	for (const locale of RESUME_LOCALES) {
		const html = read(pageFile(locale));
		assert.equal(/<p class="footer-note">/.test(html), Boolean(locale.translated), locale.id);
	}
});

test("résumé pages load the shared language scripts and stay within budget", () => {
	for (const locale of RESUME_LOCALES) {
		const html = read(pageFile(locale));
		assert.match(html, /<script src="\/i18n-bootstrap\.js\?v=[^"]+"><\/script>/);
		assert.match(html, /<script defer src="\/i18n-router\.js\?v=[^"]+"><\/script>/);
		assert.ok(Buffer.byteLength(html) <= 60 * 1024, `${locale.id} HTML is ${Buffer.byteLength(html)} bytes`);
	}
	const assets = ["public/resume/resume.css", "public/resume/resume.js"].reduce((total, file) => total + fs.statSync(path.join(root, file)).size, 0);
	assert.ok(assets <= 50 * 1024, `résumé CSS and JS are ${assets} bytes`);
	const headers = read("public/_headers");
	assert.match(headers, /\/resume\/resume\.css\r?\n\s+Cache-Control: public, max-age=31536000, immutable/);
	assert.match(headers, /\/resume\/resume\.js\r?\n\s+Cache-Control: public, max-age=31536000, immutable/);
});

test("trailing-slash résumé redirects cover every edition", () => {
	const redirects = read("public/_redirects");
	for (const locale of RESUME_LOCALES) {
		const target = resumePath(locale);
		assert.match(redirects, new RegExp(`^${target.slice(0, -1)} ${target} 301$`, "m"), locale.id);
	}
});

test("the about page links to the résumé in each of its editions", () => {
	for (const [file, href] of [["public/about/index.html", "/resume/"], ["public/en/about/index.html", "/en/resume/"], ["public/zh-hant/about/index.html", "/zh-hant/resume/"]]) {
		assert.match(read(file), new RegExp(`<a id="letter-resume" href="${href}">`), file);
	}
});

test("the private PDF builder refuses to write into a git working tree", () => {
	const repo = fs.mkdtempSync(path.join(os.tmpdir(), "resume-guard-"));
	try {
		fs.mkdirSync(path.join(repo, ".git"));
		assert.throws(() => assertOutsideGit(path.join(repo, "nested", "out")), /inside a git working tree/);
		assert.throws(() => assertOutsideGit(root), /inside a git working tree/);
	} finally {
		fs.rmSync(repo, { recursive: true, force: true });
	}
});
