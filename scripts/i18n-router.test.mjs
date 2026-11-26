import { RESUME_LOCALES as locales } from "./resume-content.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";

const pages = ["", "about/", "services/", "social/"];
const pathFor = (locale, page) => "/" + (locale.base ? locale.base + "/" : "") + page;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("locale-aware paths map the home, about, and services pages", () => {
	const result = runRouter({ href: "https://sayori.org/about/" });
	assert.equal(result.localizedPath("/", "en"), "/en/");
	assert.equal(result.localizedPath("/about/", "en"), "/en/about/");
	assert.equal(result.localizedPath("/social/", "en"), "/en/social/");
	assert.equal(result.localizedPath("/en/social/", "zh-Hant"), "/zh-hant/social/");
	assert.equal(result.localizedPath("/services/", "zh-Hant"), "/zh-hant/services/");
	assert.equal(result.localizedPath("/en/about/", "zh-Hans"), "/about/");
	assert.equal(result.localizedPath("/tools/", "en"), "/tools/");
});

test("the locale in a real URL takes precedence over browser preferences", () => {
	const simplified = runRouter({ href: "https://sayori.org/about/", browserLanguage: "en-US" });
	assert.equal(simplified.language, "zh-Hans");
	assert.equal(simplified.documentLanguage, "zh-CN");
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

test("the bootstrap keeps every static language URL visible without an automatic redirect", () => {
	for (const locale of locales) for (const page of pages) {
		const pathname = pathFor(locale, page);
		const url = new URL(pathname, "https://sayori.org");
		const context = {
			URL, document: { cookie: "sayori_locale=en", documentElement: { dataset: {} } },
			localStorage: { getItem: () => "en", setItem() {} }, navigator: { language: "en-US" },
			location: { href: url.href, pathname, search: "", hash: "", replace() { assert.fail("unexpected redirect"); } },
		};
		context.window = context;
		vm.runInNewContext(read("public/i18n-bootstrap.js"), context);
		assert.equal(context.document.documentElement.dataset.sayoriI18nPending, undefined);
		assert.equal(context.SAYORI_I18N.initialLanguage, locale.id);
	}
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

test("manual language changes stay on the social page", () => {
	const result = runRouter({ href: "https://sayori.org/en/social/?from=home#links", linkLanguage: "zh-Hant" });
	result.clickLanguageControl();
	assert.equal(result.assignedUrl, "/zh-hant/social/?from=home#links");
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
	const paths = pages.flatMap(page => locales.map(locale => "public" + pathFor(locale, page) + "index.html"));
	for (const relativePath of paths) {
		const html = read(relativePath);
		assert.match(html, /i18n-bootstrap\.js/);
		assert.match(html, /<script defer src="[^"]*i18n-router\.js/);
		assert.doesNotMatch(html, /<script src="\/i18n-router\.js[^"]*"><\/script>/);
	}
});

test("the résumé and core pages share nine editions; tools keep their unprefixed route", () => {
	const result = runRouter({ href: "https://sayori.org/resume/" });
	assert.equal(result.localizedPath("/resume/", "ja"), "/ja/resume/");
	assert.equal(result.localizedPath("/ja/resume/", "pt-BR"), "/pt-br/resume/");
	assert.equal(result.localizedPath("/fr/resume/", "zh-Hans"), "/resume/");
	assert.equal(result.localizedPath("/ko/resume/", "zh-Hant"), "/zh-hant/resume/");
	assert.equal(result.localizedPath("/resume/", "en"), "/en/resume/");
	assert.equal(result.localizedPath("/about/", "ja"), "/ja/about/");
	assert.equal(result.localizedPath("/", "de"), "/de/");
	assert.equal(result.localizedPath("/es/resume/", "es"), "/es/resume/");
	for (const page of pages) for (const locale of locales) {
		assert.equal(result.localizedPath("/pt-br/" + page, locale.id), pathFor(locale, page));
	}
	assert.equal(result.localizedPath("/tools/", "fr"), "/tools/");
});

test("a nine-locale URL sets its own document language", () => {
	for (const [pathname, language] of [["/pt-br/resume/", "pt-BR"], ["/ja/resume/", "ja"], ["/de/resume/", "de"]]) {
		const result = runRouter({ href: `https://sayori.org${pathname}`, browserLanguage: "zh-CN" });
		assert.equal(result.language, language, pathname);
		assert.equal(result.documentLanguage, language, pathname);
	}
	for (const [browserLanguage, prefix] of [["fr-FR", "fr"], ["pt", "pt-br"], ["ja-JP", "ja"]]) {
		const tools = runRouter({ href: "https://sayori.org/tools/", browserLanguage });
		assert.equal(tools.language, "en", browserLanguage);
		const resume = { href: "https://sayori.org/resume/", target: "" };
		tools.clickLink(resume);
		assert.equal(resume.href, `/${prefix}/resume/`, browserLanguage);
	}
});

test("only the three shared editions write the cross-site locale cookie", () => {
	const japanese = runRouter({ href: "https://sayori.org/resume/", linkLanguage: "ja" });
	japanese.clickLanguageControl();
	assert.equal(japanese.assignedUrl, "/ja/resume/");
	assert.equal(japanese.savedLanguage, "ja");
	assert.ok(!japanese.cookieWrites.some((value) => value.startsWith("sayori_locale=")), "ja stays on this site");

	const english = runRouter({ href: "https://sayori.org/ja/resume/", linkLanguage: "en" });
	english.clickLanguageControl();
	assert.equal(english.assignedUrl, "/en/resume/");
	assert.ok(english.cookieWrites.some((value) => value.startsWith("sayori_locale=en;")));
});

test("links from a nine-locale page land on a page that exists", () => {
	const result = runRouter({ href: "https://sayori.org/ja/resume/" });
	const about = { href: "https://sayori.org/about/", target: "" };
	result.clickLink(about);
	assert.equal(about.href, "/ja/about/");
	const resume = { href: "https://sayori.org/resume/#awards", target: "" };
	result.clickLink(resume);
	assert.equal(resume.href, "/ja/resume/#awards");
});

test("explicit language links keep their own target", () => {
	const result = runRouter({ href: "https://sayori.org/resume/" });
	const japanese = { href: "https://sayori.org/ja/resume/", target: "", hasAttribute: (name) => name === "hreflang" };
	result.clickLink(japanese);
	assert.equal(japanese.href, "https://sayori.org/ja/resume/");
});

test("the bootstrap keeps nine-locale resume URLs without redirecting", () => {
	for (const [pathname, language] of [["/resume/", "zh-Hans"], ["/ja/resume/", "ja"], ["/pt-br/resume/", "pt-BR"], ["/zh-hant/resume/", "zh-Hant"]]) {
		const url = new URL(pathname, "https://sayori.org");
		const writes = [];
		const context = {
			URL, document: { get cookie() { return "sayori_locale=en"; }, set cookie(value) { writes.push(value); }, documentElement: { dataset: {} } },
			localStorage: { getItem: () => "en", setItem() {} }, navigator: { language: "en-US" },
			location: { href: url.href, pathname, search: "", hash: "", replace() { assert.fail("unexpected redirect"); } },
		};
		context.window = context;
		vm.runInNewContext(read("public/i18n-bootstrap.js"), context);
		assert.equal(context.SAYORI_I18N.initialLanguage, language, pathname);
		assert.equal(context.document.documentElement.lang, language === "zh-Hans" ? "zh-CN" : language, pathname);
		if (!["zh-Hans", "zh-Hant", "en"].includes(language)) {
			assert.ok(!writes.some((value) => value.startsWith("sayori_locale=")), pathname);
		}
	}
});

test("locale prefixes match the blog reading editions", async (t) => {
	const blogRoot = process.env.P34_BLOG_PUBLIC
		? path.resolve(process.env.P34_BLOG_PUBLIC, "..")
		: path.resolve(root, "../sayori-blog");
	const localesFile = path.join(blogRoot, "src/utils/blog-locales.mjs");
	if (!fs.existsSync(localesFile)) {
		t.skip("sayori-blog checkout not available");
		return;
	}
	const { blogLocales } = await import(pathToFileURL(localesFile).href);
	const expected = blogLocales.map(({ id, base }) => [id === "zh-CN" ? "zh-Hans" : id, base]);
	for (const file of ["public/i18n-bootstrap.js", "public/i18n-router.js"]) {
		const source = read(file);
		const table = JSON.parse(source.match(/const LOCALES = (\[.*?\]);/s)[1]);
		assert.deepEqual(table.map(({ id, base }) => [id, base]), expected, file);
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
	const cookieWrites = [];
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
			get cookie() { return ""; },
			set cookie(value) { cookieWrites.push(value); },
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
		cookieWrites,
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
