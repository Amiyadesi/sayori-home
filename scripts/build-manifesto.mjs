import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const repo = "https://github.com/Amiyadesi/creative-freedom-manifesto";
const host = "https://sayori.org";
const languages = [
	{ lang: "zh-CN", tag: "zh-Hans", og: "zh_CN", base: "/", label: "简体中文" },
	{ lang: "zh-Hant", tag: "zh-Hant", og: "zh_TW", base: "/zh-hant/", label: "繁體中文" },
	{ lang: "en", tag: "en", og: "en_US", base: "/en/", label: "English" },
];
const escape = value => String(value).replace(/[&<>"']/g, c => ({
	"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[c]);
const emphasis = value => escape(value).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
const isDate = value => typeof value === "string" && /^\d{4}-\d\d-\d\d$/.test(value)
	&& new Date(value).toJSON()?.slice(0, 10) === value;

export function validateSigners(data) {
	const { version, updated, signers } = data;
	if (version !== 1 || !isDate(updated) || !Array.isArray(signers)) throw new Error("Invalid signer registry");
	const names = new Set(), accounts = new Set();
	const first = [["Amiya_desi", "founder", "amiyadesi"], ["栖弦（Lyra）", "ai-co-drafter", undefined]];
	if (signers.length < first.length) throw new Error("Both founding credits are required");
	let lastDate = "";
	for (const [i, entry] of signers.entries()) {
		const { name, github, role, joined } = entry;
		const key = typeof name === "string" ? name.normalize("NFKC").toLowerCase() : "";
		const account = typeof github === "string" ? github.toLowerCase() : undefined;
		if (Object.keys(entry).some(k => !["name", "github", "role", "joined"].includes(k))
			|| !key || name.trim() !== name || [...name].length > 48
			|| /[\p{C}<>&@/\\]|(?:https?:|www\.)/iu.test(key) || names.has(key)
			|| !isDate(joined) || joined < lastDate || joined > updated
			|| (Object.hasOwn(entry, "github") && (!account || !/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/.test(account) || accounts.has(account)))
			|| (i < first.length
				? name !== first[i][0] || role !== first[i][1] || account !== first[i][2]
				: Object.hasOwn(entry, "role") || !account)) {
			throw new Error("Invalid or duplicate signer at row " + (i + 1));
		}
		names.add(key);
		if (account) accounts.add(account);
		lastDate = joined;
	}
	return { version, updated, signers };
}

function readText(text, lang) {
	const sections = text.trim().split(/\n---\n/).map(section => section.trim().split(/\n\n+/));
	const [header, oath, first, core, last, closing] = sections;
	if (sections.length !== 6 || header.length !== 2 || !header[0].startsWith("# ")
		|| !header[1].startsWith("> ") || oath.length !== 1 || first.length < 2
		|| core.length !== 3 || !last.length || closing.length !== 3
		|| [header[0].slice(2), header[1].slice(2), ...sections.slice(1).flat()].some(p => !p || /[\n<>]/.test(p))) throw new Error("Invalid manifesto structure: " + lang);
	return { title: header[0].slice(2), subtitle: header[1].slice(2), oath, first, core, last, closing };
}

export function buildManifesto(source, output = path.join(root, "public")) {
	const read = file => fs.readFileSync(path.join(source, file), "utf8").replace(/\r\n/g, "\n");
	const copy = JSON.parse(fs.readFileSync(path.join(root, "scripts/manifesto-copy.json"), "utf8"));
	const essay = JSON.parse(fs.readFileSync(path.join(root, "scripts/manifesto-essay-urls.json"), "utf8"));
	const edition = JSON.parse(read("edition.json"));
	if (typeof edition.version !== "string" || !/^\d+\.\d+\.\d+$/.test(edition.version)
		|| !isDate(edition.date)) throw new Error("Invalid manifesto edition");
	const registry = validateSigners(JSON.parse(read("signers.json")));
	const texts = languages.map(({ lang }) => readText(read("manifesto." + lang + ".md"), lang));
	if (texts.some(text => text.first.length !== texts[0].first.length || text.last.length !== texts[0].last.length)) {
		throw new Error("Manifesto clauses differ in number across languages");
	}
	const write = (file, contents) => {
		const target = path.join(output, file);
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.writeFileSync(target, contents);
	};
	const alternates = [...languages.map(({ tag, base }) => [tag, host + base + "manifesto/"]), ["x-default", host + "/manifesto/"]];
	const sitemap = fs.readFileSync(path.join(root, "scripts/sitemap-base.xml"), "utf8");
	write("sitemap.xml", sitemap.replace("</urlset>", languages.map(({ base }) =>
		"\t<url>\n\t\t<loc>" + host + base + "manifesto/</loc>\n\t\t<lastmod>" + edition.date + "</lastmod>\n"
		+ alternates.map(([tag, href]) => '\t\t<xhtml:link rel="alternate" hreflang="' + tag + '" href="' + href + '" />\n').join("")
		+ "\t</url>\n").join("") + "</urlset>"));
	for (const [index, locale] of languages.entries()) {
		const { lang, og, base } = locale;
		const t = copy[lang];
		const { title, subtitle, oath, first, core, last, closing } = texts[index];
		const url = host + base + "manifesto/";
		const paragraphs = list => list.map(p => "<p>" + emphasis(p) + "</p>").join("\n");
		const roster = registry.signers.map(({ name, github, role }) => {
			const label = "<bdi>" + escape(name) + "</bdi>";
			return "<li>" + (github ? '<a href="https://github.com/' + github + '">' + label + "</a>" : label)
				+ (role ? '<small>' + (role === "founder" ? t.founder : t.ai) + "</small>" : "") + "</li>";
		}).join("\n");
		const essayUrl = essay[lang];
		if (essayUrl && !/^https:\/\/blog\.sayori\.org\/(?:[^/?#\s"<>]+\/)+$/.test(essayUrl)) throw new Error("Invalid companion essay URL");
		const signUrl = repo + "/issues/new?template=";
		const page = [
			'<!doctype html>',
			'<html lang="' + lang + '"><head>',
			'<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
			'<title>' + escape(title) + ' · Sayori</title>',
			'<meta name="theme-color" content="#A8D4E6"><meta name="description" content="' + escape(t.desc) + '">',
			'<link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/manifesto/paper.css">',
			'<link rel="canonical" href="' + url + '">',
			...alternates.map(([tag, href]) => '<link rel="alternate" hreflang="' + tag + '" href="' + href + '">'),
			'<meta property="og:type" content="article"><meta property="og:site_name" content="Sayori">',
			'<meta property="og:title" content="' + escape(title) + '"><meta property="og:description" content="' + escape(t.desc) + '">',
			'<meta property="og:image" content="https://sayori.org/assets/generated/sayori-lineart.webp">',
			'<meta property="og:image:alt" content="' + escape(t.ogAlt) + '">',
			'<meta property="og:url" content="' + url + '"><meta property="og:locale" content="' + og + '">',
			...languages.filter(l => l !== locale).map(l => '<meta property="og:locale:alternate" content="' + l.og + '">'),
			'<script src="/manifesto/sign.js" defer></script></head><body>',
			'<a class="skip" href="#manifesto">' + t.skip + '</a>',
			'<header class="desk-bar"><a href="' + base + '">← ' + t.desk + '</a>',
			'<nav aria-label="' + t.langs + '">',
			...languages.map(l => '<a lang="' + l.lang + '" hreflang="' + l.tag + '" href="' + l.base + 'manifesto/"' + (l === locale ? ' aria-current="page"' : '') + '>' + l.label + '</a>'),
			'</nav></header>',
			'<main id="manifesto" tabindex="-1" class="paper">',
			'<article class="document" aria-labelledby="title">',
			'<header class="masthead"><p class="folio"><span>' + t.issue + '</span><time datetime="' + edition.date + '">' + edition.date + '</time></p>',
			'<h1 id="title">' + escape(title) + '</h1><p class="dedication">' + escape(subtitle) + '</p>',
			'<div class="byline"><span>' + t.credit + '</span> <b>Amiya_desi × 栖弦（Lyra）</b> <small>' + t.ai + '</small></div></header>',
			'<div class="oath">' + paragraphs(oath) + '</div>',
			'<div class="clauses">' + paragraphs(first) + '</div>',
			'<div class="centerpiece">' + paragraphs(core) + '</div>',
			'<div class="clauses">' + paragraphs(last) + '</div>',
			'<div class="closing">' + paragraphs(closing) + '</div>',
			'<footer class="colophon"><div class="seal" aria-hidden="true"><span>✦</span><b>自由<br>創作</b></div>',
			'<div><p>v' + edition.version + ' · <time datetime="' + edition.date + '">' + edition.date + '</time></p><a href="' + repo + '/blob/main/CHANGELOG.md">' + escape(t.revision) + '</a></div></footer>',
			'</article>',
			'<section class="sign" aria-labelledby="sign-title"><h2 id="sign-title">' + t.sign + '</h2><p>' + t.private + '</p>',
			'<form id="sign-form" data-blank="' + t.blank + '" data-copied="' + t.copied + '" data-copy-error="' + t.copyError + '">',
			'<label for="nickname">' + t.name + '</label><div class="form-row"><input id="nickname" maxlength="48" autocomplete="off" required>',
			'<button id="swear" type="submit" disabled>' + t.swear + '</button></div></form><noscript>' + t.nojs + '</noscript>',
			'<div id="signed-copy" hidden>',
			'<div class="certificate" tabindex="-1" id="certificate"><small>' + t.personal + '</small>',
			'<p id="signed-name"><bdi></bdi></p><p id="signed-verb">' + t.pledges + '</p>',
			'<p id="signed-oath">' + emphasis(core[1]) + '</p><p id="signed-clause">' + emphasis(first[1]) + '</p>',
			'<p><a id="signed-url" href="' + url + '">' + escape(title) + '</a> · v' + edition.version + '</p></div>',
			'<div class="form-row signed-actions"><button type="button" id="copy">' + t.copy + '</button><button type="button" id="print">' + t.print + '</button></div>',
			'<p id="sign-status" role="status"></p></div></section>',
			'<section class="roster" aria-labelledby="roster-title"><h2 id="roster-title">' + t.roster + '</h2>',
			'<ul class="roll" role="list">' + roster + '</ul><p>' + t.public + '</p>',
			'<div class="public-actions"><a class="public-join" href="' + signUrl + 'creative-manifesto-signature.yml">' + t.join + '</a> <a href="' + signUrl + 'withdraw-signature.yml">' + t.withdraw + '</a> <a href="' + repo + '/blob/main/signers.json">' + t.source + '</a></div></section>',
			'<footer class="origin"><h2>' + t.origin + '</h2><p>' + t.story + '</p>',
			essayUrl ? '<a href="' + essayUrl + '">' + t.essay + ' →</a>' : '',
			'</footer></main></body></html>',
		].join("\n");
		write(base.slice(1) + "manifesto/index.html", page + "\n");
	}
	write("manifesto/signers.json", JSON.stringify(registry, null, 2) + "\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	buildManifesto(path.resolve(root, process.env.MANIFESTO_DIR || "../creative-freedom-manifesto"));
}
