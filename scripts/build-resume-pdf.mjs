import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import OpenCC from "opencc-js";

import { RESUME_LOCALES, loadResumeContent, validatePrivateInfo } from "./resume-content.mjs";
import { renderResumePage } from "./render-resume-page.mjs";

const homeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function assertOutsideGit(directory) {
	let current = path.resolve(directory);
	for (;;) {
		if (fs.existsSync(path.join(current, ".git"))) {
			throw new Error(`refusing to write a private résumé inside a git working tree: ${current}`);
		}
		const parent = path.dirname(current);
		if (parent === current) return;
		current = parent;
	}
}

function findBrowser() {
	const candidates = [
		process.env.RESUME_BROWSER,
		"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
		"C:/Program Files/Microsoft/Edge/Application/msedge.exe",
		"C:/Program Files/Google/Chrome/Application/chrome.exe",
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
		"/usr/bin/google-chrome",
		"/usr/bin/chromium",
		"/usr/bin/microsoft-edge",
	].filter(Boolean);
	const found = candidates.find((candidate) => fs.existsSync(candidate));
	if (!found) throw new Error("no Edge or Chrome found; set RESUME_BROWSER to a Chromium browser executable");
	return found;
}

function option(name, fallback) {
	const index = process.argv.indexOf(`--${name}`);
	return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function main() {
	const privatePath = process.env.RESUME_PRIVATE;
	if (!privatePath) throw new Error("set RESUME_PRIVATE to the private résumé JSON file");
	const language = option("lang", "zh");
	const locale = RESUME_LOCALES.find(({ file, id }) => file === language || id === language);
	if (!locale) throw new Error(`unknown --lang ${language}; use one of ${RESUME_LOCALES.map(({ file }) => file).join(", ")}`);
	const privateInfo = JSON.parse(fs.readFileSync(privatePath, "utf8"));
	const errors = validatePrivateInfo(privateInfo);
	if (errors.length) throw new Error(errors.join("\n"));
	const outputDir = path.resolve(option("out", path.join(path.dirname(path.resolve(privatePath)), "resume-out")));
	assertOutsideGit(outputDir);

	const contentRoot = process.env.CONTENT_DIR ? path.resolve(homeRoot, process.env.CONTENT_DIR) : path.resolve(homeRoot, "../sayori-articles");
	const { data, texts } = loadResumeContent(path.join(contentRoot, "home"), OpenCC.Converter({ from: "cn", to: "t" }));
	const html = renderResumePage({
		data,
		text: texts[locale.id],
		locale,
		mode: "private",
		privateInfo,
		assetBase: pathToFileURL(path.join(homeRoot, "public")).href,
	});

	const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "sayori-resume-"));
	const htmlPath = path.join(workDir, "resume.html");
	const pdfPath = path.join(outputDir, `Amiya_desi-resume-${locale.file}.pdf`);
	try {
		fs.writeFileSync(htmlPath, html, "utf8");
		fs.mkdirSync(outputDir, { recursive: true });
		const result = spawnSync(findBrowser(), [
			"--headless=new",
			"--disable-gpu",
			"--no-first-run",
			"--no-pdf-header-footer",
			"--allow-file-access-from-files",
			`--user-data-dir=${path.join(workDir, "profile")}`,
			`--print-to-pdf=${pdfPath}`,
			pathToFileURL(htmlPath).href,
		], { stdio: "pipe", timeout: 120000 });
		if (result.status !== 0 || !fs.existsSync(pdfPath)) {
			throw new Error(`browser failed to print (${result.status}): ${String(result.stderr || "").slice(0, 400)}`);
		}
	} finally {
		fs.rmSync(workDir, { recursive: true, force: true });
	}
	console.log(`[resume-pdf] ${pdfPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
	try {
		main();
	} catch (error) {
		console.error(`[resume-pdf] ${error.message}`);
		process.exit(1);
	}
}
