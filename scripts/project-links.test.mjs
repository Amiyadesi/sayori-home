import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicFiles = [
	"public/index.html",
	"public/services/index.html",
	"public/services/services-i18n.js",
	"public/llms.txt",
];

const maintainedPublicHosts = ["board.sayori.org"];
const retiredPublicHosts = ["ldc.sayori.org", "media.sayori.org"];

test("public surfaces expose the maintained services and self-hostable projects", () => {
	for (const relativePath of publicFiles) {
		const content = read(relativePath);
		assert.ok(content.includes("https://geo.sayori.org/"), `${relativePath}: GeoScore`);
		assert.ok(content.includes("https://blog.sayori.org/"), `${relativePath}: blog`);
		for (const host of maintainedPublicHosts) {
			assert.ok(content.includes(host), `${relativePath}: maintained ${host}`);
		}
		assert.ok(
			content.includes("https://github.com/Amiyadesi/search-gateway"),
			`${relativePath}: Search Gateway source`,
		);
	}
});

test("retired and private services are not advertised on public surfaces", () => {
	for (const relativePath of publicFiles) {
		const content = read(relativePath);
		for (const host of retiredPublicHosts) {
			assert.ok(!content.includes(host), `${relativePath}: unexpectedly exposes ${host}`);
		}
	}
});

test("localized home data exposes the maintained tools and links", () => {
	const expectedLinks = [
		"https://blog.sayori.org/posts/resource-index/",
		"https://board.sayori.org/",
		"https://geo.sayori.org/",
		"https://blog.sayori.org/guestbook/",
	];

	for (const lang of ["zh", "en"]) {
		const config = JSON.parse(read(`public/assets/data/home-${lang}.json`));
		const serviceEntry = config.surface.entries.find((entry) => entry.action === "services");
		assert.ok(serviceEntry, `home-${lang}.json: services panel entry`);
		const serviceLinks = config.services.items.map((item) => item.href);
		for (const link of expectedLinks) {
			assert.ok(serviceLinks.includes(link), `home-${lang}.json: ${link}`);
		}
		const serialized = JSON.stringify(config);
		for (const host of maintainedPublicHosts) {
			assert.ok(serialized.includes(host), `home-${lang}.json: maintained ${host}`);
		}
		for (const host of retiredPublicHosts) {
			assert.ok(!serialized.includes(host), `home-${lang}.json: unexpectedly exposes ${host}`);
		}
	}
});

test("the canonical public services page documents status and operating boundaries", () => {
	const content = read("public/services/index.html");
	assert.match(content, /id="service-status"/);
	assert.match(content, /id="operating-boundaries"/);
	assert.match(content, /id="planned-services"/);
});

test("the public GeoScore API is discoverable without exposing Search Gateway", () => {
	for (const relativePath of [
		"public/services/index.html",
		"public/services/services-i18n.js",
		"public/llms.txt",
	]) {
		const content = read(relativePath);
		assert.ok(content.includes("https://geo-api.sayori.org"), `${relativePath}: GeoScore API`);
	}
	for (const relativePath of ["public/services/index.html", "public/services/services-i18n.js", "public/llms.txt"]) {
		const content = read(relativePath);
		assert.ok(content.includes("https://geo-api.sayori.org/openapi.json"), `${relativePath}: OpenAPI`);
		assert.ok(!content.includes("https://search.sayori.org"), `${relativePath}: hosted Search Gateway`);
	}
});

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), "utf8");
}
