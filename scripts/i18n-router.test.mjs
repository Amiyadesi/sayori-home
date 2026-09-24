import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Simplified and Traditional browser locales stay distinct", () => {
	const result = runRouter({ browserLanguage: "zh-CN" });
	assert.equal(result.language, "zh-Hans");
	assert.equal(result.documentLanguage, "zh-CN");
	assert.equal(result.reloads, 0);
	assert.equal(runRouter({ browserLanguage: "zh-TW" }).language, "zh-Hant");
	assert.equal(runRouter({ browserLanguage: "zh-TW" }).documentLanguage, "zh-Hant");
});

test("a saved manual language overrides the browser locale", () => {
	const result = runRouter({ browserLanguage: "zh-CN", storedLanguage: "en" });

	assert.equal(result.language, "en");
	assert.equal(result.documentLanguage, "en");
});

test("lang query sets the preference and stays visible on the URL", () => {
	const result = runRouter({
		href: "https://sayori.org/services/?lang=en&music=youtube#status",
		browserLanguage: "zh-CN",
	});

	assert.equal(result.language, "en");
	assert.equal(result.savedLanguage, "en");
	assert.equal(result.replacedUrl, null);
	assert.equal(result.pathname, "/services/");
	assert.match(result.href || "", /lang=en/);
});

test("manual language controls save the preference and navigate with ?lang=", () => {
	const result = runRouter({ href: "https://sayori.org/services/?music=youtube", linkLanguage: "en" });

	result.clickLanguageControl();
	assert.equal(result.savedLanguage, "en");
	assert.equal(result.prevented, true);
	assert.equal(result.assignedUrl, "/services/?music=youtube&lang=en");
	assert.equal(result.reloads, 0);
});

test("the deferred router trusts the language selected by the bootstrap", () => {
	const result = runRouter({ initialLanguage: "en", browserLanguage: "zh-CN", storedLanguage: "zh" });

	assert.equal(result.language, "en");
	assert.equal(result.documentLanguage, "en");
});

test("ordinary page controls never trigger the delegated language reload", () => {
	const result = runRouter({ browserLanguage: "zh-CN" });

	result.clickOrdinaryControl();
	assert.equal(result.reloads, 0);
	assert.equal(result.prevented, false);
	assert.equal(result.documentDataset.sayoriLanguage, undefined);
	assert.equal(result.documentDataset.sayoriCurrentLanguage, "zh-Hans");
});

test("canonical pages use the inline language bootstrap and deferred router", () => {
	for (const relativePath of ["public/index.html", "public/about/index.html", "public/services/index.html", "public/tools/index.html"]) {
		const html = read(relativePath);
		assert.match(html, /i18n-bootstrap\.js/);
		assert.match(html, /<script defer src="[^\"]*i18n-router\.js/);
		assert.doesNotMatch(html, /<script src="\/i18n-router\.js[^\"]*"><\/script>/);
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
	initialLanguage = null,
} = {}) {
	const source = fs.readFileSync(path.join(root, "public/i18n-router.js"), "utf8");
	const url = new URL(href);
	let savedLanguage = storedLanguage;
	let delegatedClickHandler = null;
	let delegatedChangeHandler = null;
	let reloads = 0;
	let prevented = false;
	let replacedUrl = null;
	let assignedUrl = null;
	const documentElement = { lang: "", dataset: {} };
	const head = { append() {} };
	const location = {
		href,
		pathname: url.pathname,
		search: url.search,
		hash: url.hash,
		reload() { reloads += 1; },
		assign(value) { assignedUrl = value; },
	};
	const context = {
		URL,
		window: {
			SAYORI_I18N: { defaultLanguage: "zh", ...(initialLanguage ? { initialLanguage } : {}) },
			dispatchEvent() {},
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
			head,
			cookie: "",
			querySelectorAll() { return []; },
			createElement(tag) {
				return {
					tag,
					className: "",
					dataset: {},
					append() {},
					setAttribute() {},
				};
			},
			addEventListener(event, handler) {
				if (event === "click") delegatedClickHandler = handler;
				if (event === "change") delegatedChangeHandler = handler;
			},
		},
	};
	context.window.window = context.window;
	context.window.navigator = context.navigator;
	context.window.localStorage = context.localStorage;
	context.window.document = context.document;
	context.window.CustomEvent = class CustomEvent {};
	vm.runInNewContext(source, context);
	return {
		get language() { return context.window.SayoriI18n.language; },
		get documentLanguage() { return documentElement.lang; },
		get savedLanguage() { return savedLanguage; },
		get reloads() { return reloads; },
		get prevented() { return prevented; },
		get replacedUrl() { return replacedUrl; },
		get assignedUrl() { return assignedUrl; },
		get href() { return location.href; },
		get documentDataset() { return documentElement.dataset; },
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
		clickOrdinaryControl() {
			assert.ok(delegatedClickHandler, "delegated language handler");
			delegatedClickHandler({
				preventDefault() { prevented = true; },
				target: {
					closest(selector) {
						if (selector.includes("[data-sayori-language]") && documentElement.dataset.sayoriLanguage) {
							return documentElement;
						}
						return null;
					},
				},
			});
		},
		changeLanguage(language) {
			assert.ok(delegatedChangeHandler, "delegated change handler");
			delegatedChangeHandler({ target: { closest: () => ({ value: language }) } });
		},
	};
}

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}
