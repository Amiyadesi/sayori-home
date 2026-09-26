import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("locale-aware paths map the home, about, and services pages", () => {
	const result = runRouter({ href: "https://sayori.org/about/" });
	assert.equal(result.localizedPath("/", "en"), "/en/");
	assert.equal(result.localizedPath("/about/", "en"), "/en/about/");
	assert.equal(result.localizedPath("/services/", "zh-Hant"), "/zh-hant/services/");
	assert.equal(result.localizedPath("/en/about/", "zh-Hans"), "/about/");
	assert.equal(result.localizedPath("/tools/", "en"), "/tools/");
});

test("the locale in a real URL takes precedence over browser preferences", () => {
	const english = runRouter({
		href: "https://sayori.org/en/about/",
		browserLanguage: "zh-CN",
	});
	assert.equal(english.language, "en");
	assert.equal(english.documentLanguage, "en");

	const traditional = runRouter({
		href: "https://sayori.org/zh-hant/",
		browserLanguage: "en-US",
	});
	assert.equal(traditional.language, "zh-Hant");
	assert.equal(traditional.documentLanguage, "zh-Hant");
});

test("manual language selection navigates to the matching localized URL", () => {
	const result = runRouter({
		href: "https://sayori.org/services/?music=youtube#status",
		browserLanguage: "zh-CN",
		linkLanguage: "en",
	});
	result.clickLanguageControl();
	assert.equal(result.savedLanguage, "en");
	assert.equal(result.prevented, true);
	assert.equal(result.assignedUrl, "/en/services/?music=youtube#status");
	assert.equal(result.reloads, 0);
});

test("switching from one localized page preserves its page type", () => {
	const result = runRouter({
		href: "https://sayori.org/en/about/",
		linkLanguage: "zh-Hant",
	});
	result.clickLanguageControl();
	assert.equal(result.assignedUrl, "/zh-hant/about/");
});

test("ordinary same-site links are rewritten to the current language route", () => {
	const result = runRouter({
		href: "https://sayori.org/en/",
		browserLanguage: "zh-CN",
	});
	const anchor = { href: "https://sayori.org/about/", target: "" };
	result.clickLink(anchor);
	assert.equal(anchor.href, "/en/about/");
});

test("localized landing and profile pages load the language bootstrap and router", () => {
	const paths = [
		"public/index.html",
		"public/en/index.html",
		"public/zh-hant/index.html",
		"public/about/index.html",
		"public/en/about/index.html",
		"public/zh-hant/about/index.html",
		"public/services/index.html",
		"public/en/services/index.html",
		"public/zh-hant/services/index.html",
	];
	for (const relativePath of paths) {
		const html = read(relativePath);
		assert.match(html, /i18n-bootstrap\.js/);
		assert.match(html, /<script defer src="[^"]*i18n-router\.js/);
		assert.doesNotMatch(html, /<script src="\/i18n-router\.js[^"]*"><\/script>/);
	}
});

test("legacy Simplified Chinese aliases remain noindex compatibility pages", () => {
	for (const relativePath of ["public/zh/index.html", "public/zh/services/index.html"]) {
		const html = read(relativePath);
		assert.match(html, /name="robots" content="noindex,follow"/);
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
	let assignedUrl = null;
	const documentElement = { lang: "", dataset: {} };
	const head = { append() {} };
	const location = {
		href,
		pathname: url.pathname,
		origin: url.origin,
		search: url.search,
		hash: url.hash,
		assign(value) { assignedUrl = value; },
		reload() { reloads += 1; },
	};
	const context = {
		URL,
		window: {
			SAYORI_I18N: { defaultLanguage: "zh-Hans", ...(initialLanguage ? { initialLanguage } : {}) },
			dispatchEvent() {},
			location,
			history: {
				replaceState() {},
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
		get assignedUrl() { return assignedUrl; },
		localizedPath: context.window.SayoriI18n.localizedPath,
		clickLanguageControl() {
			assert.ok(delegatedClickHandler, "delegated language handler");
			delegatedClickHandler({
				preventDefault() { prevented = true; },
				target: {
					closest(selector) {
						return selector.includes("[data-sayori-language]")
							? { dataset: { sayoriLanguage: linkLanguage } }
							: null;
					},
				},
			});
		},
		clickLink(anchor) {
			assert.ok(delegatedClickHandler, "delegated link handler");
			delegatedClickHandler({
				target: {
					closest(selector) {
						return selector.includes("[data-sayori-language]") ? null : anchor;
					},
				},
				button: 0,
			});
		},
	};
}

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}
