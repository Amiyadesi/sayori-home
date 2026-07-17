import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredLinks = [
	"https://geo.sayori.org/",
	"https://github.com/Amiyadesi/geoscore",
	"https://search.sayori.org/",
	"https://github.com/Amiyadesi/search-gateway",
];

test("home surfaces expose GeoScore and Search Gateway service and source links", () => {
	for (const relativePath of ["public/index.html", "public/zh/index.html", "public/en/index.html", "public/llms.txt"]) {
		const content = fs.readFileSync(path.join(root, relativePath), "utf8");
		for (const link of requiredLinks) assert.ok(content.includes(link), `${relativePath}: ${link}`);
	}
});
