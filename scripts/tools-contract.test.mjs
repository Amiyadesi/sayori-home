import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("tools page keeps the local image workflow wired", () => {
	const html = fs.readFileSync(path.join(root, "public/tools/index.html"), "utf8");
	const js = fs.readFileSync(path.join(root, "public/tools/tools.js"), "utf8");
	assert.match(html, /class="subaru-tap-link" href="\/tool\/subarutap\/"/);
	assert.match(js, /subaruTap: "Subaru Tap"/);

	for (const id of ["pixel-background", "pixel-style", "pixel-output-scale", "pixel-info", "tiles-info", "tile-offset-x", "tile-offset-y"]) assert.match(html, new RegExp(`id=\"${id}\"`), `${id} is present`);
	for (const action of ["pixel-download", "tiles-download"]) assert.match(html, new RegExp(`data-action=\"${action}\"`), `${action} is present`);
	for (const id of ["autotile-file", "autotile-format", "autotile-output-format", "autotile-size", "autotile-left-offset", "autotile-right-offset", "autotile-top-offset", "autotile-bottom-offset", "autotile-source", "autotile-output", "autotile-info"]) assert.match(html, new RegExp(`id=\"${id}\"`), `${id} is present`);
	for (const action of ["autotile-download", "autotile-reset"]) assert.match(html, new RegExp(`data-action=\"${action}\"`), `${action} is present`);
	assert.match(js, /pixel-background/);
	assert.match(js, /tileStats/);
	assert.match(js, /FOUR_BY_FOUR_DATA/);
	assert.match(js, /GODOT_TO_GAMEMAKER/);
	assert.match(js, /PREVIEW_LAYOUT/);
	assert.match(js, /renderAutoTile/);
	assert.match(js, /autotile-left-offset/);
	assert.match(js, /autotile-output-format/);
	assert.match(js, /autotile-size/);
	assert.match(js, /pasteHandlers/);
	assert.match(js, /offsets\.right - offsets\.left/, "three-way subtile sections keep their middle span");
	assert.match(js, /function copyTileQuadRaw/, "two-way corner sections use their own splitter");
	assert.match(js, /toBlob\(/);
	assert.doesNotMatch(js, /fetch\(/, "image processing stays local");
	assert.doesNotMatch(html, /[\u{1F300}-\u{1FAFF}]/u, "the tools UI does not use emoji icons");
});
