import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Chinese browser locales use Chinese without changing the URL", () => {
	const result = runRouter({ browserLanguage: "zh-CN" });

	assert.equal(result.language, "zh");
	assert.equal(result.documentLanguage, "zh-CN");
	assert.equal(result.reloads, 0);
});

test("a saved manual language overrides the browser locale", () => {
	const result = runRouter({ browserLanguage: "zh-CN", storedLanguage: "en" });

	assert.equal(result.language, "en");
	assert.equal(result.documentLanguage, "en");
});

test("legacy lang query sets the preference and is removed from the visible URL", () => {
	const result = runRouter({
		href: "https://sayori.org/services/?lang=en&music=youtube#status",
		browserLanguage: "zh-CN",
	});

	assert.equal(result.language, "en");
	assert.equal(result.savedLanguage, "en");
	assert.equal(result.replacedUrl, "/services/?music=youtube#status");
});

test("manual language controls save the preference and reload the same page", () => {
	const result = runRouter({ href: "https://sayori.org/services/?music=youtube", linkLanguage: "en" });

	result.clickLanguageControl();
	assert.equal(result.savedLanguage, "en");
	assert.equal(result.reloads, 1);
	assert.equal(result.prevented, true);
	assert.equal(result.pathname, "/services/");
});

test("canonical pages use one synchronous language router instead of language routes", () => {
	for (const relativePath of ["public/index.html", "public/services/index.html"]) {
		const html = read(relativePath);
		assert.match(html, /SAYORI_I18N/);
		assert.match(html, /<script src="\/i18n-router\.js[^\"]*"><\/script>/);
		assert.doesNotMatch(html, /<script defer src="[^\"]*i18n-router\.js/);
		assert.doesNotMatch(html, /href="\/(?:zh|en)\//);
	}
});

test("legacy language pages are noindex redirects to the canonical URL", () => {
	const expectations = [
		["public/zh/index.html", "https://sayori.org/", "zh"],
		["public/en/index.html", "https://sayori.org/", "en"],
		["public/zh/services/index.html", "https://sayori.org/services/", "zh"],
		["public/en/services/index.html", "https://sayori.org/services/", "en"],
	];

	for (const [relativePath, canonical, language] of expectations) {
		const html = read(relativePath);
		assert.match(html, /name="robots" content="noindex,follow"/);
		assert.ok(html.includes(`rel="canonical" href="${canonical}"`), relativePath);
		assert.ok(html.includes(`sayori:ui-language", "${language}"`), relativePath);
	}
});

function runRouter({
	browserLanguage = "en-US",
	storedLanguage = null,
	href = "https://sayori.org/",
	linkLanguage = null,
} = {}) {
	const source = fs.readFileSync(path.join(root, "public/i18n-router.js"), "utf8");
	const url = new URL(href);
	let savedLanguage = storedLanguage;
	let delegatedClickHandler = null;
	let reloads = 0;
	let prevented = false;
	let replacedUrl = null;
	const documentElement = { lang: "", dataset: {} };
	const location = {
		href,
		pathname: url.pathname,
		search: url.search,
		hash: url.hash,
		reload() { reloads += 1; },
	};
	const context = {
		URL,
		window: {
			SAYORI_I18N: { defaultLanguage: "zh" },
			location,
			history: {
				replaceState(_state, _title, value) { replacedUrl = value; },
			},
		},
		navigator: { language: browserLanguage, languages: [browserLanguage] },
		localStorage: {
			getItem() { return savedLanguage; },
			setItem(_key, value) { savedLanguage = value; },
		},
		document: {
			documentElement,
			addEventListener(event, handler) {
				if (event === "click") delegatedClickHandler = handler;
			},
		},
	};
	context.window.window = context.window;
	context.window.navigator = context.navigator;
	context.window.localStorage = context.localStorage;
	context.window.document = context.document;
	vm.runInNewContext(source, context);
	return {
		get language() { return context.window.SayoriI18n.language; },
		get documentLanguage() { return documentElement.lang; },
		get savedLanguage() { return savedLanguage; },
		get reloads() { return reloads; },
		get prevented() { return prevented; },
		get replacedUrl() { return replacedUrl; },
		pathname: location.pathname,
		clickLanguageControl() {
			assert.ok(delegatedClickHandler, "delegated language handler");
			delegatedClickHandler({
				preventDefault() { prevented = true; },
				target: {
					closest() {
						return { dataset: { sayoriLanguage: linkLanguage } };
					},
				},
			});
		},
	};
}

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}
