import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("./sync-home-content.mjs", import.meta.url));
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sayori-home-sync-"));

try {
	const homeRoot = path.join(tmpRoot, "sayori-home");
	const contentRoot = path.join(tmpRoot, "sayori-articles");
	const scriptDest = path.join(homeRoot, "scripts", "sync-home-content.mjs");
	fs.mkdirSync(path.dirname(scriptDest), { recursive: true });
	fs.copyFileSync(scriptPath, scriptDest);

	writeJson(path.join(contentRoot, "home", "surface.zh.json"), {
		meta: {}, surface: {}, profile: {}, services: {}, marker: "zh-surface",
	});
	writeJson(path.join(contentRoot, "home", "truth.zh.json"), {
		responses: {}, eggs: {}, fallback: {}, greeting: {}, marker: "zh-truth",
	});
	writeJson(path.join(contentRoot, "home", "surface.en.json"), {
		meta: {}, surface: {}, profile: {}, services: {}, marker: "en-surface",
	});
	writeJson(path.join(contentRoot, "home", "truth.en.json"), {
		responses: {}, eggs: {}, fallback: {}, greeting: {}, marker: "en-truth",
	});

	const result = spawnSync(process.execPath, [scriptDest], {
		cwd: tmpRoot,
		encoding: "utf8",
		env: {
			...process.env,
			CONTENT_DIR: "../sayori-articles",
		},
	});
	assert.equal(result.status, 0, result.stderr || result.stdout);

	const zhHome = readJson(path.join(homeRoot, "public", "assets", "data", "home-zh.json"));
	const enLines = readJson(path.join(homeRoot, "public", "assets", "data", "lines-en.json"));
	assert.equal(zhHome.marker, "zh-surface");
	assert.equal(zhHome.language, "zh");
	assert.equal(enLines.marker, "en-truth");
	assert.equal(enLines.language, "en");
} finally {
	fs.rmSync(tmpRoot, { recursive: true, force: true });
}

function writeJson(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
