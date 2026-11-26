import { RESUME_LOCALES as locales } from "./resume-content.mjs";
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
	for (const file of ["render-social-page.mjs", "social-page.html", "resume-content.mjs", "render-resume-page.mjs", "resume-page.html"]) {
		fs.copyFileSync(path.join(path.dirname(scriptPath), file), path.join(homeRoot, "scripts", file));
	}
	fs.cpSync(path.join(path.resolve(path.dirname(scriptPath), ".."), "node_modules", "opencc-js"), path.join(homeRoot, "node_modules", "opencc-js"), { recursive: true });

	for (const { file: lang } of locales.filter(l => !l.derived)) {
		writeJson(path.join(contentRoot, "home", `surface.${lang}.json`), {
			meta: {}, surface: {}, profile: {}, services: {}, marker: lang + "-surface",
		});
		writeJson(path.join(contentRoot, "home", `truth.${lang}.json`), {
			responses: {}, eggs: {}, fallback: {}, greeting: {}, marker: lang + "-truth",
		});
		writeJson(path.join(contentRoot, "home", `about.${lang}.json`), {
			meta: {}, letter: {}, faq: {},
			contact: { email: "me@sayori.org", links: [{ label: "测试", href: "https://example.com/" }] },
		});
	}
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

	for (const { file, base } of locales) {
		for (const kind of ["home", "lines", "about"]) {
			const data = readJson(path.join(homeRoot, "public", "assets", "data", `${kind}-${file}.json`));
			assert.equal(data.language, file);
			if (kind !== "about") assert.equal(data.marker, (file === "zh-hant" ? "zh" : file) + (kind === "home" ? "-surface" : "-truth"));
		}
		assert.ok(fs.existsSync(path.join(homeRoot, "public", base, "social", "index.html")));
	}

	assert.match(fs.readFileSync(path.join(homeRoot, "public", "zh-hant", "social", "index.html"), "utf8"), /測試/);
	assert.match(fs.readFileSync(path.join(homeRoot, "public", "en", "social", "index.html"), "utf8"), /Find me online/);
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
