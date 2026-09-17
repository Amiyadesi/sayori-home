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
	fs.cpSync(path.join(path.resolve(path.dirname(scriptPath), ".."), "node_modules", "opencc-js"), path.join(homeRoot, "node_modules", "opencc-js"), { recursive: true });

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
	write(path.join(contentRoot, "assets", "sponsor", "reward-code.png"), "reward-code");
	write(path.join(homeRoot, "public", "assets", "sponsor", "stale-code.png"), "stale");
	write(path.join(homeRoot, "public", "services", "services-i18n.js"), "window.copy = '简体';");
	write(path.join(homeRoot, "public", "tools", "tools.js"), "window.copy = '简体';");

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
	const hantHome = readJson(path.join(homeRoot, "public", "assets", "data", "home-zh-hant.json"));
	assert.equal(zhHome.marker, "zh-surface");
	assert.equal(zhHome.language, "zh");
	assert.equal(enLines.marker, "en-truth");
	assert.equal(enLines.language, "en");
	assert.equal(hantHome.language, "zh-hant");
	assert.equal(hantHome.marker, "zh-surface");
	assert.match(fs.readFileSync(path.join(homeRoot, "public", "services", "services-i18n.zh-hant.js"), "utf8"), /簡體/);
	assert.equal(
		fs.readFileSync(
			path.join(homeRoot, "public", "assets", "sponsor", "reward-code.png"),
			"utf8",
		),
		"reward-code",
	);
	assert.equal(
		fs.existsSync(
			path.join(homeRoot, "public", "assets", "sponsor", "stale-code.png"),
		),
		false,
	);
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

function write(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, value, "utf8");
}
