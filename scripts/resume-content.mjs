import fs from "node:fs";
import path from "node:path";

export const RESUME_LOCALES = [
	{ id: "zh-Hans", file: "zh", base: "", htmlLang: "zh-CN", hreflang: "zh-Hans", ogLocale: "zh_CN", label: "简体中文" },
	{ id: "zh-Hant", file: "zh-hant", base: "zh-hant", htmlLang: "zh-Hant", hreflang: "zh-Hant", ogLocale: "zh_TW", label: "繁體中文", derived: true },
	{ id: "en", file: "en", base: "en", htmlLang: "en", hreflang: "en", ogLocale: "en_US", label: "English" },
	{ id: "ja", file: "ja", base: "ja", htmlLang: "ja", hreflang: "ja", ogLocale: "ja_JP", label: "日本語", translated: true },
	{ id: "fr", file: "fr", base: "fr", htmlLang: "fr", hreflang: "fr", ogLocale: "fr_FR", label: "Français", translated: true },
	{ id: "ko", file: "ko", base: "ko", htmlLang: "ko", hreflang: "ko", ogLocale: "ko_KR", label: "한국어", translated: true },
	{ id: "es", file: "es", base: "es", htmlLang: "es", hreflang: "es", ogLocale: "es_ES", label: "Español", translated: true },
	{ id: "de", file: "de", base: "de", htmlLang: "de", hreflang: "de", ogLocale: "de_DE", label: "Deutsch", translated: true },
	{ id: "pt-BR", file: "pt-br", base: "pt-br", htmlLang: "pt-BR", hreflang: "pt-BR", ogLocale: "pt_BR", label: "Português (Brasil)", translated: true },
];

export const STAT_IDS = ["awards", "jams", "repos", "services"];
export const PRIVATE_FIELDS = ["realName", "school", "major", "grade", "phone", "email"];

const optional = (type) => ({ optional: type });
const DATA_SCHEMA = {
	asOf: "date",
	person: { name: "text", url: "url", email: "email", sameAs: ["url"] },
	stats: [{ id: "id", value: "text" }],
	tags: ["text"],
	awards: [{ id: "id", date: "date", work: "id", evidence: "link" }],
	works: [{
		id: "id", kind: "kind", title: "text", titleLatin: "text", date: optional("date"), stack: "text",
		cover: optional("asset"), award: optional("id"), links: [{ kind: "linkKind", href: "url" }],
	}],
	more: [{ id: "id", title: "text", href: "url" }],
	jams: [{ id: "id", date: "date", work: optional("id"), award: optional("id"), url: "url" }],
	skills: [{ id: "id", nodes: [{ id: "id", works: ["id"], links: ["url"] }] }],
	contact: { email: "email", commission: "url", studio: "url", links: [{ id: "id", label: "text", href: "url" }] },
};
const PRIVATE_SCHEMA = Object.fromEntries(PRIVATE_FIELDS.map((field) => [field, optional({ value: "text", include: "boolean", localized: optional("textMap") })]));

const SCALARS = {
	text: (value) => typeof value === "string" && value.trim() !== "",
	id: (value) => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
	date: (value) => typeof value === "string" && /^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/.test(value),
	url: (value) => typeof value === "string" && /^https:\/\/[^\s"<>]+$/.test(value),
	email: (value) => typeof value === "string" && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(value),
	asset: (value) => typeof value === "string" && /^\/assets\/resume\/[a-z0-9/_.-]+$/.test(value),
	link: (value) => SCALARS.url(value) || SCALARS.asset(value),
	kind: (value) => value === "game" || value === "tool",
	linkKind: (value) => ["play", "use", "source"].includes(value),
	boolean: (value) => typeof value === "boolean",
	textMap: (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.entries(value).every(([key, item]) => RESUME_LOCALES.some(({ file }) => file === key) && SCALARS.text(item)),
};

function checkShape(value, schema, at, errors) {
	if (schema && typeof schema === "object" && "optional" in schema) {
		if (value === "" || value === undefined) return;
		return checkShape(value, schema.optional, at, errors);
	}
	if (typeof schema === "string") {
		if (!SCALARS[schema](value)) errors.push(`${at} must be ${schema}`);
		return;
	}
	if (Array.isArray(schema)) {
		if (!Array.isArray(value)) return errors.push(`${at} must be an array`);
		value.forEach((item, index) => checkShape(item, schema[0], `${at}[${index}]`, errors));
		return;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) return errors.push(`${at} must be an object`);
	for (const key of Object.keys(value)) {
		if (!(key in schema)) errors.push(`${at}.${key} is not an allowed field`);
	}
	for (const [key, child] of Object.entries(schema)) {
		const isOptional = child && typeof child === "object" && "optional" in child;
		if (!(key in value)) {
			if (!isOptional) errors.push(`${at}.${key} is required`);
			continue;
		}
		checkShape(value[key], child, `${at}.${key}`, errors);
	}
}

function unique(list, at, errors) {
	const seen = new Set();
	for (const id of list) {
		if (seen.has(id)) errors.push(`${at} repeats id ${id}`);
		seen.add(id);
	}
	return seen;
}

export function validateResumeData(data) {
	const errors = [];
	checkShape(data, DATA_SCHEMA, "data", errors);
	if (errors.length) return errors;
	const works = unique(data.works.map(({ id }) => id), "data.works", errors);
	const awards = unique(data.awards.map(({ id }) => id), "data.awards", errors);
	const more = unique(data.more.map(({ id }) => id), "data.more", errors);
	unique(data.jams.map(({ id }) => id), "data.jams", errors);
	unique(data.skills.map(({ id }) => id), "data.skills", errors);
	const stats = data.stats.map(({ id }) => id);
	if (stats.join() !== STAT_IDS.join()) errors.push(`data.stats must list ${STAT_IDS.join(", ")} in order`);
	for (const award of data.awards) {
		if (!works.has(award.work)) errors.push(`award ${award.id} points to unknown work ${award.work}`);
	}
	for (const work of data.works) {
		if (work.award && !awards.has(work.award)) errors.push(`work ${work.id} points to unknown award ${work.award}`);
	}
	for (const jam of data.jams) {
		if (jam.work && !works.has(jam.work) && !more.has(jam.work)) errors.push(`jam ${jam.id} points to unknown work ${jam.work}`);
		if (jam.award && !awards.has(jam.award)) errors.push(`jam ${jam.id} points to unknown award ${jam.award}`);
	}
	for (const branch of data.skills) {
		unique(branch.nodes.map(({ id }) => id), `data.skills.${branch.id}`, errors);
		for (const node of branch.nodes) {
			for (const id of node.works) if (!works.has(id)) errors.push(`skill ${branch.id}.${node.id} points to unknown work ${id}`);
			if (!node.works.length && !node.links.length) errors.push(`skill ${branch.id}.${node.id} needs evidence`);
		}
	}
	return errors;
}

export function expectedTextShape(data) {
	return {
		works: data.works.map(({ id }) => id),
		awards: data.awards.map(({ id }) => id),
		more: data.more.map(({ id }) => id),
		jams: data.jams.map(({ id }) => id),
		skills: Object.fromEntries(data.skills.map(({ id, nodes }) => [id, nodes.map((node) => node.id)])),
	};
}

export function validateSourceText(text, data, label = "resume.zh.json") {
	const errors = [];
	const sameKeys = (value, ids, at) => {
		const keys = Object.keys(value || {});
		if (keys.join() !== ids.join()) errors.push(`${label} ${at} must list ${ids.join(", ")} in data order`);
	};
	const shape = expectedTextShape(data);
	sameKeys(text?.works?.items, shape.works, "works.items");
	sameKeys(text?.awards?.items, shape.awards, "awards.items");
	sameKeys(text?.more?.items, shape.more, "more.items");
	sameKeys(text?.jams?.items, shape.jams, "jams.items");
	sameKeys(text?.skills?.branches, Object.keys(shape.skills), "skills.branches");
	for (const [branch, nodes] of Object.entries(shape.skills)) sameKeys(text?.skills?.branches?.[branch]?.nodes, nodes, `skills.branches.${branch}.nodes`);
	sameKeys(text?.ui?.stats, STAT_IDS, "ui.stats");
	walkText(text, "", (value, at) => {
		if (typeof value !== "string") errors.push(`${label} ${at} must be text`);
		else if (!value.trim() && at !== ".ui.translationNote") errors.push(`${label} ${at} must not be empty`);
	});
	return errors;
}

export function validateTranslation(text, source, locale) {
	const label = `resume.${locale.file}.json`;
	const errors = [];
	compareShape(text, source, "", label, errors);
	walkText(text, "", (value, at) => {
		if (typeof value !== "string") return;
		if (at === ".ui.translationNote") {
			if (locale.translated && !value.trim()) errors.push(`${label} ${at} must say the page was translated with AI`);
		} else if (!value.trim()) {
			errors.push(`${label} ${at} must not be empty`);
		}
		for (const token of source ? placeholders(lookup(source, at)) : []) {
			if (!value.includes(token)) errors.push(`${label} ${at} must keep ${token}`);
		}
	});
	return errors;
}

export function validatePrivateInfo(info) {
	const errors = [];
	checkShape(info, PRIVATE_SCHEMA, "private", errors);
	return errors;
}

function compareShape(value, reference, at, label, errors) {
	if (Array.isArray(reference)) {
		if (!Array.isArray(value) || value.length !== reference.length) return errors.push(`${label} ${at || "."} must have ${reference.length} items`);
		reference.forEach((item, index) => compareShape(value[index], item, `${at}[${index}]`, label, errors));
		return;
	}
	if (reference && typeof reference === "object") {
		if (!value || typeof value !== "object" || Array.isArray(value)) return errors.push(`${label} ${at || "."} must be an object`);
		const keys = Object.keys(reference);
		for (const key of Object.keys(value)) if (!keys.includes(key)) errors.push(`${label} ${at}.${key} is not in resume.zh.json`);
		for (const key of keys) {
			if (!(key in value)) errors.push(`${label} ${at}.${key} is missing`);
			else compareShape(value[key], reference[key], `${at}.${key}`, label, errors);
		}
		return;
	}
	if (typeof value !== typeof reference) errors.push(`${label} ${at} must be ${typeof reference}`);
}

function walkText(value, at, visit) {
	if (Array.isArray(value)) return value.forEach((item, index) => walkText(item, `${at}[${index}]`, visit));
	if (value && typeof value === "object") return Object.entries(value).forEach(([key, item]) => walkText(item, `${at}.${key}`, visit));
	visit(value, at);
}

function lookup(value, at) {
	return at.match(/[^.[\]]+/g)?.reduce((node, key) => node?.[key], value);
}

function placeholders(value) {
	return typeof value === "string" ? value.match(/\{\w+\}/g) || [] : [];
}

function convertValue(value, convert) {
	if (typeof value === "string") return convert(value);
	if (Array.isArray(value)) return value.map((item) => convertValue(item, convert));
	if (!value || typeof value !== "object") return value;
	return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, convertValue(item, convert)]));
}

function mergeValue(base, override) {
	if (!override || typeof override !== "object" || Array.isArray(override)) return override;
	const output = { ...base };
	for (const [key, value] of Object.entries(override)) {
		output[key] = value && typeof value === "object" && !Array.isArray(value) ? mergeValue(base?.[key] || {}, value) : value;
	}
	return output;
}

function readJson(file) {
	try {
		return JSON.parse(fs.readFileSync(file, "utf8"));
	} catch (error) {
		throw new Error(`${path.basename(file)} ${error.code === "ENOENT" ? "is missing" : `parse failed: ${error.message}`}`);
	}
}

export function loadResumeContent(sourceRoot, toTraditional) {
	const data = readJson(path.join(sourceRoot, "resume.data.json"));
	const errors = validateResumeData(data);
	if (errors.length) throw new Error(errors.join("\n"));
	const source = readJson(path.join(sourceRoot, "resume.zh.json"));
	const sourceErrors = validateSourceText(source, data);
	if (sourceErrors.length) throw new Error(sourceErrors.join("\n"));
	const texts = {};
	for (const locale of RESUME_LOCALES) {
		let text;
		if (locale.id === "zh-Hans") {
			text = source;
		} else if (locale.derived) {
			const override = path.join(sourceRoot, `resume.${locale.file}.json`);
			text = convertValue(source, toTraditional);
			if (fs.existsSync(override)) text = mergeValue(text, readJson(override));
		} else {
			text = readJson(path.join(sourceRoot, `resume.${locale.file}.json`));
		}
		const localeErrors = validateTranslation(text, source, locale);
		if (localeErrors.length) throw new Error(localeErrors.join("\n"));
		texts[locale.id] = text;
	}
	return { data, texts };
}
