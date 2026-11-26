import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import OpenCC from "opencc-js";

import {
	RESUME_LOCALES,
	loadResumeContent,
	validatePrivateInfo,
	validateResumeData,
	validateSourceText,
	validateTranslation,
} from "./resume-content.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const japanese = RESUME_LOCALES.find(({ id }) => id === "ja");
const english = RESUME_LOCALES.find(({ id }) => id === "en");

function fixture() {
	const data = {
		asOf: "2026-11",
		person: { name: "Amiya_desi", url: "https://sayori.org/", email: "me@sayori.org", sameAs: ["https://github.com/Amiyadesi"] },
		stats: ["awards", "jams", "repos", "services"].map((id) => ({ id, value: "1" })),
		tags: ["Godot 4"],
		awards: [{ id: "award-one", date: "2025-11", work: "work-one", evidence: "/assets/resume/awards/one.webp" }],
		works: [{
			id: "work-one", kind: "game", title: "作品", titleLatin: "Work", date: "", stack: "Godot", cover: "",
			award: "award-one", links: [{ kind: "play", href: "https://amiya-desi.itch.io/one" }],
		}],
		more: [{ id: "more-one", title: "More", href: "https://github.com/Amiyadesi/more" }],
		jams: [{ id: "jam-one", date: "2025-11", work: "more-one", award: "", url: "https://amiya-desi.itch.io/one" }],
		skills: [{ id: "client", nodes: [{ id: "godot", works: ["work-one"], links: [] }] }],
		contact: { email: "me@sayori.org", commission: "https://studio.sayori.org/commission", studio: "https://studio.sayori.org/", links: [{ id: "github", label: "GitHub", href: "https://github.com/Amiyadesi" }] },
	};
	const text = {
		ui: { asOf: "截至 {date}", translationNote: "", stats: { awards: "奖", jams: "场", repos: "仓库", services: "服务" } },
		works: { items: { "work-one": { role: "单人完成", highlights: ["环形缓冲"] } } },
		awards: { items: { "award-one": { prize: "二等奖" } } },
		more: { items: { "more-one": "更多" } },
		jams: { items: { "jam-one": { event: "Jam", note: "备注" } } },
		skills: { branches: { client: { title: "客户端", nodes: { godot: "Godot 4" } } } },
	};
	return { data, text };
}

test("a complete fixture passes every résumé check", () => {
	const { data, text } = fixture();
	assert.deepEqual(validateResumeData(data), []);
	assert.deepEqual(validateSourceText(text, data), []);
	const translated = structuredClone(text);
	translated.ui.asOf = "{date} 時点";
	translated.ui.translationNote = "AI の協力で翻訳しました。";
	assert.deepEqual(validateTranslation(translated, text, japanese), []);
});

test("public data rejects private fields, plain HTTP and dangling references", () => {
	const { data } = fixture();
	data.person.phone = "000";
	data.works[0].links[0].href = "http://amiya-desi.itch.io/one";
	data.awards[0].work = "missing-work";
	data.skills[0].nodes[0].works = [];
	const errors = validateResumeData(data).join("\n");
	assert.match(errors, /data\.person\.phone is not an allowed field/);
	data.person = fixture().data.person;
	const next = validateResumeData(data).join("\n");
	assert.match(next, /data\.works\[0\]\.links\[0\]\.href must be url/);
	data.works[0].links[0].href = "https://amiya-desi.itch.io/one";
	const refs = validateResumeData(data).join("\n");
	assert.match(refs, /award award-one points to unknown work missing-work/);
	assert.match(refs, /skill client\.godot needs evidence/);
});

test("source text must follow the data ids", () => {
	const { data, text } = fixture();
	delete text.works.items["work-one"];
	text.works.items.other = { role: "x", highlights: ["y"] };
	assert.match(validateSourceText(text, data).join("\n"), /works\.items must list work-one/);
});

test("translations keep the source shape, placeholders and AI note", () => {
	const { text } = fixture();
	const missing = structuredClone(text);
	delete missing.awards.items["award-one"].prize;
	missing.ui.extra = "x";
	missing.works.items["work-one"].highlights = [];
	missing.ui.asOf = "As of";
	missing.ui.translationNote = "";
	const errors = validateTranslation(missing, text, japanese).join("\n");
	assert.match(errors, /\.awards\.items\.award-one\.prize is missing/);
	assert.match(errors, /\.ui\.extra is not in resume\.zh\.json/);
	assert.match(errors, /highlights must have 1 items/);
	assert.match(errors, /\.ui\.asOf must keep \{date\}/);
	assert.match(errors, /translationNote must say the page was translated with AI/);
	const englishCopy = structuredClone(text);
	englishCopy.ui.asOf = "As of {date}";
	assert.deepEqual(validateTranslation(englishCopy, text, english), []);
	englishCopy.jams.items["jam-one"].note = " ";
	assert.match(validateTranslation(englishCopy, text, english).join("\n"), /note must not be empty/);
});

test("private résumé data only accepts the documented identity fields", () => {
	assert.deepEqual(validatePrivateInfo({ realName: { value: "Name", include: true }, phone: { value: "1", include: false } }), []);
	assert.deepEqual(validatePrivateInfo({ school: { value: "学校", include: true, localized: { en: "School" } } }), []);
	assert.match(validatePrivateInfo({ school: { value: "学校", include: true, localized: { xx: "School" } } }).join("\n"), /private\.school\.localized must be textMap/);
	assert.match(validatePrivateInfo({ address: { value: "x", include: true } }).join("\n"), /private\.address is not an allowed field/);
	assert.match(validatePrivateInfo({ school: { value: "x", include: "yes" } }).join("\n"), /private\.school\.include must be boolean/);
});

test("the published résumé content loads in all nine editions", (t) => {
	const contentRoot = process.env.CONTENT_DIR ? path.resolve(root, process.env.CONTENT_DIR) : path.resolve(root, "../sayori-articles");
	const sourceRoot = path.join(contentRoot, "home");
	if (!fs.existsSync(path.join(sourceRoot, "resume.data.json"))) {
		t.skip("sayori-articles checkout not available");
		return;
	}
	const { texts } = loadResumeContent(sourceRoot, OpenCC.Converter({ from: "cn", to: "t" }));
	assert.deepEqual(Object.keys(texts), RESUME_LOCALES.map(({ id }) => id));
	assert.notEqual(texts["zh-Hant"].whoami.positioning, texts["zh-Hans"].whoami.positioning);
});
