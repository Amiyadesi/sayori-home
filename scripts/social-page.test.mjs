import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { renderSocialPage } from "./render-social-page.mjs";

const contact = { email: "me@sayori.org", links: [{ label: "X", href: "https://x.com/amiyadesiwa" }] };

test("social pages are complete static directories with matching locale routes", () => {
	for (const [language, prefix, htmlLang] of [["zh", "", "zh-CN"], ["zh-hant", "/zh-hant", "zh-Hant"], ["en", "/en", "en"]]) {
		const html = renderSocialPage(contact, language);
		assert.ok(html.includes(`<html lang="${htmlLang}"`));
		assert.ok(html.includes(`rel="canonical" href="https://sayori.org${prefix}/social/"`));
		assert.ok(html.includes(`class="social-back" href="${prefix}/"`));
		assert.match(html, /class="social-link" href="https:\/\/x.com\/amiyadesiwa"/);
		assert.match(html, /data-sayori-language-select/);
		assert.match(html, /href="mailto:me@sayori.org"/);
		assert.doesNotMatch(html, /\{\{|<iframe/);
	}
});

test("contact text is escaped and unsafe links fail the build", () => {
	const html = renderSocialPage({ ...contact, links: [{ label: '<X & "test">', href: "https://example.com/?a=1&b=2", handle: "<amiya>" }] }, "zh");
	assert.match(html, /&lt;X &amp; &quot;test&quot;&gt;/);
	assert.match(html, /href="https:\/\/example.com\/\?a=1&amp;b=2"/);
	assert.match(html, /&lt;amiya&gt;/);
	assert.throws(() => renderSocialPage({ ...contact, links: [{ label: "bad", href: "javascript:alert(1)" }] }, "zh"), /HTTPS/);
	assert.throws(() => renderSocialPage({ ...contact, links: [] }, "zh"), /contact.links/);
	assert.throws(() => renderSocialPage({ ...contact, email: 'bad"@mail' }, "zh"), /contact.email/);
});

test("home's second entry routes to social without changing the real Bilibili account", () => {
	for (const [language, prefix] of [["zh", ""], ["zh-hant", "/zh-hant"], ["en", "/en"]]) {
		const data = JSON.parse(fs.readFileSync(new URL(`../public/assets/data/home-${language}.json`, import.meta.url), "utf8"));
		assert.equal(data.surface.entries[1].href, "/social/");
		assert.ok(!data.surface.entries[1].external);
		assert.equal(data.links.bilibili, "https://space.bilibili.com/3546919890585725");
		const home = fs.readFileSync(new URL(`../public${prefix}/index.html`, import.meta.url), "utf8");
		assert.ok(home.includes(`href="${prefix}/social/" class="entry"`));
		const social = fs.readFileSync(new URL(`../public${prefix}/social/index.html`, import.meta.url), "utf8");
		const about = JSON.parse(fs.readFileSync(new URL(`../public/assets/data/about-${language}.json`, import.meta.url), "utf8"));
		assert.equal((social.match(/class="social-link"/g) || []).length, about.contact.links.length);
		for (const link of about.contact.links) assert.ok(social.includes(escapeAttribute(new URL(link.href).href)), link.label);
	}
});

function escapeAttribute(value) {
	return value.replaceAll("&", "&amp;");
}
