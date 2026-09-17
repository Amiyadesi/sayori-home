import assert from "node:assert/strict";
import test from "node:test";

import { localeFromCountry, requestLocale } from "../_lib/locale.js";
import { onRequestGet } from "./locale.js";

test("country mapping covers China, Greater China, and overseas", () => {
	assert.equal(localeFromCountry("CN"), "zh-Hans");
	for (const code of ["HK", "MO", "TW"]) assert.equal(localeFromCountry(code), "zh-Hant");
	for (const code of ["US", "JP", "XX", ""]) assert.equal(localeFromCountry(code), "en");
});

test("manual cookie wins and IP locale becomes a session cookie", () => {
	const manual = new Request("https://sayori.org/api/locale", {
		headers: { cookie: "sayori_locale=zh-Hant; sayori_locale_auto=en" },
	});
	assert.deepEqual(requestLocale(manual), { locale: "zh-Hant", setCookie: null });

	const firstVisit = new Request("https://sayori.org/api/locale", {
		headers: { "cf-ipcountry": "CN" },
	});
	const result = requestLocale(firstVisit);
	assert.equal(result.locale, "zh-Hans");
	assert.match(result.setCookie, /^sayori_locale_auto=zh-Hans;/);
	assert.doesNotMatch(result.setCookie, /Max-Age/);
});

test("API returns only locale and allows sayori.org subdomains", async () => {
	const response = onRequestGet({
		request: new Request("https://sayori.org/api/locale", {
			headers: { origin: "https://blog.sayori.org", "cf-ipcountry": "TW" },
		}),
	});
	assert.deepEqual(await response.json(), { locale: "zh-Hant" });
	assert.equal(response.headers.get("access-control-allow-origin"), "https://blog.sayori.org");
});
