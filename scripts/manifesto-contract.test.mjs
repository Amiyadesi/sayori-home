
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { validateSigners } from "./build-manifesto.mjs";

const read = file => fs.readFileSync(new URL("../public/" + file, import.meta.url), "utf8");
const roster = JSON.parse(read("manifesto/signers.json"));
const locales = ["/manifesto/", "/zh-hant/manifesto/", "/en/manifesto/"];

test("localized manifesto pages, sitemap and sign-up resolve to their own routes", () => {
	for (const route of locales) {
		const page = read(route.slice(1) + "index.html");
		const url = "https://sayori.org" + route;
		assert.ok(page.includes('rel="canonical" href="' + url + '"'));
		assert.ok(page.includes('property="og:url" content="' + url + '"'));
		assert.ok(page.includes('href="' + route + '" aria-current="page"'));
		for (const alt of locales) {
			assert.ok(page.includes('href="https://sayori.org' + alt + '"'));
			assert.ok(read("sitemap.xml").includes("<loc>https://sayori.org" + alt + "</loc>"));
		}
		assert.match(page, /Amiya_desi × 栖弦（Lyra）/);
		assert.match(page, /id="public-apply".*action="\/api\/manifesto-signature" method="post"/);
		assert.match(page, /id="public-remove".*action="\/api\/manifesto-signature" method="post"/);
		assert.match(page, /id="public-consent" type="checkbox" required/);
		assert.doesNotMatch(page, /\/issues\/new/);
		assert.match(page, /AI/);
		assert.match(page, /<bdi>栖弦（Lyra）<\/bdi>/);
	}
});

test("roster validation rejects markup, injected profile URLs, private fields and duplicate accounts", () => {
	assert.deepEqual(validateSigners(roster), roster);
	const signers = roster.signers.slice(0, 2);
	const entry = { name: "Mira", github: "mira-creates", joined: roster.updated };
	const validate = added => validateSigners({ ...roster, signers: [...signers, added] });
	assert.equal(validate(entry).signers.length, 3);
	assert.deepEqual(validate({ name: "Mira", joined: roster.updated }).signers.at(-1), { name: "Mira", joined: roster.updated });
	for (const change of [
		{ name: '<img src=x onerror="alert(1)">' },
		{ name: "mira@example.com" },
		{ github: "x/../../evil" },
		{ github: "AMIYADESI" },
		{ name: "Ａｍｉｙａ＿ｄｅｓｉ" },
		{ email: "test@example.com" },
		{ role: "founder" },
	]) assert.throws(() => validate({ ...entry, ...change }), /Invalid or duplicate signer/);
});
