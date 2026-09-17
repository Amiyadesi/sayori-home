import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import OpenCC from "opencc-js";

const scriptFile = fileURLToPath(import.meta.url);
const homeRoot = path.resolve(path.dirname(scriptFile), "..");
const repoRoot = path.resolve(homeRoot, "..");
const localReposRoot = repoRoot;
const configuredContentDir = String(process.env.CONTENT_DIR || "").trim();
const contentRoot = configuredContentDir
	? path.resolve(homeRoot, configuredContentDir)
	: path.join(localReposRoot, "sayori-articles");
const sourceRoot = path.join(contentRoot, "home");
const dataRoot = path.join(homeRoot, "public", "assets", "data");
const sponsorAssetsSource = path.join(contentRoot, "assets", "sponsor");
const sponsorAssetsDestination = path.join(
	homeRoot,
	"public",
	"assets",
	"sponsor",
);

const LANGS = ["zh", "en"];
const toTraditional = OpenCC.Converter({ from: "cn", to: "t" });
const REQUIRED_SURFACE_KEYS = ["meta", "surface", "profile", "services"];
const REQUIRED_TRUTH_KEYS = ["responses", "eggs", "fallback", "greeting"];
const REQUIRED_ABOUT_KEYS = ["meta", "letter", "faq", "contact"];

main();

function main() {
	if (!fs.existsSync(sourceRoot)) {
		fail(`source directory missing: ${sourceRoot}`);
	}

	fs.mkdirSync(dataRoot, { recursive: true });

	for (const lang of LANGS) {
		const surface = readJson(`surface.${lang}.json`);
		const truth = readJson(`truth.${lang}.json`);
		validateObject(surface, REQUIRED_SURFACE_KEYS, `surface.${lang}.json`);
		validateObject(truth, REQUIRED_TRUTH_KEYS, `truth.${lang}.json`);

		const homeConfig = {
			source: `articles/home/surface.${lang}.json`,
			language: lang,
			...surface,
		};
		const truthConfig = {
			source: `articles/home/truth.${lang}.json`,
			language: lang,
			...truth,
		};

		writeJson(path.join(dataRoot, `home-${lang}.json`), homeConfig);
		writeJson(path.join(dataRoot, `lines-${lang}.json`), truthConfig);

		// about.{lang}.json is optional: only synced when present so the
		// /about/ page can ship independently of the content repo version.
		const aboutFile = `about.${lang}.json`;
		if (fs.existsSync(path.join(sourceRoot, aboutFile))) {
			const about = readJson(aboutFile);
			validateObject(about, REQUIRED_ABOUT_KEYS, aboutFile);
			writeJson(path.join(dataRoot, `about-${lang}.json`), {
				source: `articles/home/${aboutFile}`,
				language: lang,
				...about,
			});
		}
	}

	writeTraditionalData("surface", "home", REQUIRED_SURFACE_KEYS);
	writeTraditionalData("truth", "lines", REQUIRED_TRUTH_KEYS);
	if (fs.existsSync(path.join(sourceRoot, "about.zh.json"))) {
		writeTraditionalData("about", "about", REQUIRED_ABOUT_KEYS);
	}
	writeTraditionalScript("services/services-i18n.js", "services/services-i18n.zh-hant.js");
	writeTraditionalScript("tools/tools.js", "tools/tools.zh-hant.js");

	syncSponsorAssets();

	console.log(
		"[sync-home-content] content/home and content/assets/sponsor -> sayori-home/public/assets",
	);
}

function writeTraditionalScript(sourceName, outputName) {
	const source = fs.readFileSync(path.join(homeRoot, "public", sourceName), "utf8");
	fs.writeFileSync(path.join(homeRoot, "public", outputName), toTraditional(source), "utf8");
}

function writeTraditionalData(sourceName, outputName, requiredKeys) {
	const sourceFile = `${sourceName}.zh.json`;
	const overrideFile = `${sourceName}.zh-hant.json`;
	const source = readJson(sourceFile);
	const overridePath = path.join(sourceRoot, overrideFile);
	const converted = convertValue(source);
	const value = fs.existsSync(overridePath)
		? merge(converted, readJson(overrideFile))
		: converted;
	validateObject(value, requiredKeys, overrideFile);
	writeJson(path.join(dataRoot, `${outputName}-zh-hant.json`), {
		source: `articles/home/${fs.existsSync(overridePath) ? overrideFile : sourceFile}`,
		language: "zh-hant",
		...value,
	});
}

function convertValue(value) {
	if (typeof value === "string") return toTraditional(value);
	if (Array.isArray(value)) return value.map(convertValue);
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, convertValue(item)]));
}

function merge(base, override) {
	if (!override || typeof override !== "object" || Array.isArray(override)) return override;
	const output = { ...base };
	for (const [key, value] of Object.entries(override)) {
		output[key] = value && typeof value === "object" && !Array.isArray(value)
			? merge(base?.[key] || {}, value)
			: value;
	}
	return output;
}

function syncSponsorAssets() {
	if (!fs.existsSync(sponsorAssetsSource)) {
		fail(
			`source directory missing: ${path.relative(repoRoot, sponsorAssetsSource)}`,
		);
	}

	// Sponsor assets are sourced exclusively from sayori-articles; remove stale files.
	fs.rmSync(sponsorAssetsDestination, { recursive: true, force: true });
	fs.cpSync(sponsorAssetsSource, sponsorAssetsDestination, { recursive: true });
}

function readJson(filename) {
	const filePath = path.join(sourceRoot, filename);
	if (!fs.existsSync(filePath)) {
		fail(`required file missing: ${path.relative(repoRoot, filePath)}`);
	}

	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch (error) {
		fail(`${path.relative(repoRoot, filePath)} parse failed: ${error.message}`);
	}
}

function validateObject(value, keys, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		fail(`${label} must be a JSON object`);
	}

	for (const key of keys) {
		if (value[key] === undefined) {
			fail(`${label} missing required key: ${key}`);
		}
	}
}

function writeJson(filePath, value) {
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, "\t")}\n`, "utf8");
}

function fail(message) {
	console.error(`[sync-home-content] ${message}`);
	process.exit(1);
}
