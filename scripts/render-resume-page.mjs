import fs from "node:fs";

import { RESUME_LOCALES } from "./resume-content.mjs";

const template = fs.readFileSync(new URL("./resume-page.html", import.meta.url), "utf8");
export const RESUME_ASSET_VERSION = "20261123-resume";
const ORIGIN = "https://sayori.org";
const TONES = { whoami: "pink", awards: "mint", works: "yellow", skills: "violet", jams: "violet", contact: "blue", options: "violet" };
const FILES = { whoami: "whoami.txt", awards: "awards.exe", works: "works/", skills: "skills.tree", jams: "jams.log", contact: "contact.lnk", options: "options.cfg" };
const MENU = ["works", "awards", "skills", "jams", "contact", "options"];

export function resumePath(locale) {
	return locale.base ? `/${locale.base}/resume/` : "/resume/";
}

export function renderResumePage({ data, text, locale, mode = "public", privateInfo = null, assetBase = "" }) {
	const isPrivate = mode === "private";
	const asset = (href) => (href.startsWith("/") ? `${assetBase}${href}` : href);
	const chinese = locale.id.startsWith("zh");
	const works = new Map(data.works.map((work) => [work.id, work]));
	const more = new Map(data.more.map((item) => [item.id, item]));
	const titleOf = (id) => {
		const work = works.get(id);
		if (work) return chinese ? work.title : work.titleLatin;
		return more.get(id)?.title || "";
	};
	const subtitleOf = (work) => {
		const other = chinese ? work.titleLatin : work.title;
		return other && other !== titleOf(work.id) ? other : "";
	};
	const workHref = (id) => (works.has(id) ? `#work-${id}` : more.get(id)?.href || "#works");
	const statText = Object.fromEntries(data.stats.map(({ id, value }) => [id, value]));
	const asOf = text.ui.asOf.replace("{date}", data.asOf);
	const canonical = `${ORIGIN}${resumePath(locale)}`;

	const windowSection = (id, body, { file = FILES[id], heading = text[id]?.title, tone = TONES[id], extraClass = "", attrs = "" } = {}) => `
		<section class="win win--${id.startsWith("work-") ? "work" : id}${extraClass}" id="${id}" data-window="${id}" data-tone="${tone}" aria-labelledby="${id}-title"${attrs}>
			<header class="win-bar"><h2 class="win-name" id="${id}-title"><span class="win-file" aria-hidden="true">${escapeHtml(file)}</span><span class="win-heading">${escapeHtml(heading)}</span></h2></header>
			<div class="win-body">${body}
			</div>
		</section>`;

	const whoami = windowSection("whoami", `
				<p class="whoami-positioning">${escapeHtml(text.whoami.positioning)}</p>
				<p class="whoami-lede">${escapeHtml(text.whoami.lede)}</p>
				${text.whoami.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n\t\t\t\t")}
				<ul class="tags">${data.tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>
				<p class="whoami-availability">${escapeHtml(text.whoami.availability)}</p>
				<p class="actions"><a class="button button--primary" href="${escapeHtml(data.contact.commission)}">${escapeHtml(text.whoami.cta)} →</a><a class="button" href="mailto:${escapeHtml(data.contact.email)}">${escapeHtml(data.contact.email)}</a></p>`);

	const awards = windowSection("awards", `
				<p class="win-intro">${escapeHtml(text.awards.intro)}</p>
				<ol class="awards">${data.awards.map((award, index) => {
					const copy = text.awards.items[award.id];
					const evidenceLabel = award.evidence.startsWith("/assets/") ? text.ui.links.certificate : text.ui.links.evidence;
					return `
					<li class="award">
						<span class="award-num" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
						<div>
							<p class="award-prize"><strong>${escapeHtml(copy.prize)}</strong> <time datetime="${award.date}">${award.date}</time></p>
							<p class="award-event">${escapeHtml(copy.event)}</p>
							<p class="award-note">${escapeHtml(copy.note)}</p>
							<p class="award-links"><a href="${workHref(award.work)}" data-open="work-${award.work}">${escapeHtml(titleOf(award.work))}</a> · <a href="${escapeHtml(asset(award.evidence))}"${external(award.evidence)}${printUrl(award.evidence)}>${escapeHtml(evidenceLabel)} ↗</a></p>
						</div>
					</li>`;
				}).join("")}
				</ol>`);

	const worksIndex = windowSection("works", `
				<p class="win-intro">${escapeHtml(text.works.intro)}</p>
				<ul class="files">${data.works.map((work) => `
					<li><a class="file" href="#work-${work.id}" data-open="work-${work.id}">${fileIcon(work, asset)}<span class="file-name">${escapeHtml(titleOf(work.id))}</span><span class="file-kind">${escapeHtml(text.works.kinds[work.kind])}${work.award ? " ★" : ""}</span></a></li>`).join("")}
				</ul>
				<h3 class="more-title">${escapeHtml(text.ui.more)}</h3>
				<ul class="more-list">${data.more.map((item) => `
					<li><a href="${escapeHtml(item.href)}"${external(item.href)}>${escapeHtml(item.title)}</a> <span>${escapeHtml(text.more.items[item.id])}</span></li>`).join("")}
				</ul>`);

	const workWindows = data.works.map((work) => {
		const copy = text.works.items[work.id];
		const subtitle = subtitleOf(work);
		const meta = [copy.type, work.date, work.stack].filter(Boolean).map(escapeHtml).join(" · ");
		const cover = work.cover
			? `<figure class="work-cover"><img src="${escapeHtml(asset(work.cover))}" alt="${escapeHtml(titleOf(work.id))}" width="1280" height="720" loading="lazy" decoding="async" /></figure>`
			: `<figure class="work-cover work-cover--glyph" aria-hidden="true">${fileIcon(work, asset, "large")}</figure>`;
		return windowSection(`work-${work.id}`, `
				${cover}
				${subtitle ? `<p class="work-subtitle">${escapeHtml(subtitle)}</p>` : ""}
				<p class="work-meta">${meta}</p>
				<p class="work-summary">${escapeHtml(copy.summary)}</p>
				<dl class="work-role"><dt>${escapeHtml(text.ui.role)}</dt><dd>${escapeHtml(copy.role)}</dd></dl>
				<h3 class="work-highlights-title">${escapeHtml(text.ui.highlights)}</h3>
				<ul class="work-highlights">${copy.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
				<p class="work-links">${work.links.map((link) => `<a class="button${link.kind === "play" || link.kind === "use" ? " button--primary" : ""}" href="${escapeHtml(link.href)}"${external(link.href)}${printUrl(link.href)}>${escapeHtml(text.ui.links[link.kind])} ↗</a>`).join("")}</p>
				<p class="work-back"><a href="#works" data-open="works">← ${escapeHtml(text.ui.backToWorks)}</a></p>`, {
			file: `${work.id}.lnk`, heading: titleOf(work.id), tone: "yellow", attrs: ` data-parent="works" data-kind="${work.kind}"`,
		});
	}).join("");

	const skills = windowSection("skills", `
				<p class="win-intro">${escapeHtml(text.skills.intro)}</p>
				<div class="branches">${data.skills.map((branch) => {
					const copy = text.skills.branches[branch.id];
					return `
					<section class="branch branch--${branch.id}">
						<h3>${escapeHtml(copy.title)}</h3>
						<ul>${branch.nodes.map((node) => {
							const proofs = [
								...node.works.map((id) => `<a href="#work-${id}" data-open="work-${id}">${escapeHtml(titleOf(id))}</a>`),
								...node.links.map((href) => `<a href="${escapeHtml(href)}"${external(href)}>${escapeHtml(linkName(href))}</a>`),
							];
							return `
							<li><span class="node">${escapeHtml(copy.nodes[node.id])}</span><span class="node-proof"><span class="sr-only">${escapeHtml(text.ui.evidenceFor)}: </span>${proofs.join(", ")}</span></li>`;
						}).join("")}
						</ul>
					</section>`;
				}).join("")}
				</div>
				<p class="skills-ai">${escapeHtml(text.skills.ai)}</p>
				<p class="skills-egg">${escapeHtml(text.skills.easterEgg)}</p>`);

	const jams = windowSection("jams", `
				<p class="win-intro">${escapeHtml(text.jams.intro)}</p>
				<ol class="log">${data.jams.map((jam) => {
					const copy = text.jams.items[jam.id];
					const work = jam.work ? `<a href="${escapeHtml(workHref(jam.work))}"${works.has(jam.work) ? ` data-open="work-${jam.work}"` : external(workHref(jam.work))}>${escapeHtml(titleOf(jam.work))}</a>` : `<a href="${escapeHtml(jam.url)}"${external(jam.url)}>${escapeHtml(text.jams.noWork)}</a>`;
					return `
					<li class="log-entry${jam.award ? " log-entry--award" : ""}"><time datetime="${jam.date}">${jam.date}</time><span class="log-event">${escapeHtml(copy.event)}</span><span class="log-work">${work}</span><span class="log-note">${jam.award ? "★ " : ""}${escapeHtml(copy.note)}</span></li>`;
				}).join("")}
				</ol>`);

	const contact = windowSection("contact", `
				<p class="win-intro">${escapeHtml(text.contact.intro)}</p>
				<p class="actions"><a class="button button--primary" href="${escapeHtml(data.contact.commission)}">${escapeHtml(text.contact.commission)} →</a><a class="button" href="mailto:${escapeHtml(data.contact.email)}">${escapeHtml(text.contact.email)} · ${escapeHtml(data.contact.email)}</a></p>
				<h3>${escapeHtml(text.contact.elsewhere)}</h3>
				<ul class="contact-links">${data.contact.links.map((link) => `<li><a href="${escapeHtml(link.href)}"${external(link.href)}${printUrl(link.href)}>${escapeHtml(link.label)} ↗</a></li>`).join("")}</ul>`);

	const options = windowSection("options", `
				<p class="option-label" id="options-language">${escapeHtml(text.options.language)}</p>
				<ul class="lang-links" aria-labelledby="options-language">${RESUME_LOCALES.map((item) => `<li><a href="${resumePath(item)}" hreflang="${item.hreflang}" lang="${item.htmlLang}" data-sayori-resume-language="${item.id}"${item.id === locale.id ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}</a></li>`).join("")}</ul>
				<p class="option-row" data-js-only><button type="button" class="button" data-action="motion" aria-pressed="false">${escapeHtml(text.options.motion)}</button><button type="button" class="button" data-action="replay">${escapeHtml(text.options.replay)}</button><button type="button" class="button" data-action="print">${escapeHtml(text.options.print)}</button></p>`);

	const menuCounts = { works: String(data.works.length), awards: `${data.awards.length}/${data.awards.length}`, skills: String(data.skills.length), jams: statText.jams, contact: "→", options: "⚙" };
	const menu = MENU.map((id) => `<li><a class="menu-item" href="#${id}" data-open="${id}"><span>${escapeHtml(text.ui.menu[id])}</span><small aria-hidden="true">${escapeHtml(menuCounts[id])}</small></a></li>`).join("");
	const hud = `
		<aside class="hud" aria-label="${escapeHtml(text.ui.hudLabel)}">
			<p class="hud-class">${escapeHtml(text.ui.hudClass)} <b>${escapeHtml(text.ui.hudClassValue)}</b> · ${escapeHtml(text.ui.hudSub)} <b>${escapeHtml(text.ui.hudSubValue)}</b></p>
			<ul class="hud-stats">${data.stats.map(({ id, value }) => `<li><b>${escapeHtml(value)}</b> ${escapeHtml(text.ui.stats[id])}</li>`).join("")}</ul>
			<p class="hud-asof">${escapeHtml(asOf)}</p>
		</aside>`;

	const identity = isPrivate && privateInfo
		? PRIVATE_ORDER.filter((field) => privateInfo[field]?.include && privateInfo[field].value).map((field) => `<span>${escapeHtml(privateInfo[field].localized?.[locale.file] || privateInfo[field].value)}</span>`).join("")
		: "";
	const printHeader = `
		<header class="print-header">
			<p class="print-name">Amiya_desi${identity ? ` <span class="print-identity">${identity}</span>` : ""}</p>
			<p class="print-positioning">${escapeHtml(text.whoami.positioning)} ${escapeHtml(text.whoami.lede)}</p>
			<p class="print-contact"><span>${escapeHtml(data.contact.email)}</span><span>${ORIGIN.replace("https://", "")}${resumePath(locale)}</span><span>github.com/Amiyadesi</span><span>amiya-desi.itch.io</span></p>
		</header>`;

	const alternates = [
		...RESUME_LOCALES.map((item) => `<link rel="alternate" hreflang="${item.hreflang}" href="${ORIGIN}${resumePath(item)}" />`),
		`<link rel="alternate" hreflang="x-default" href="${ORIGIN}/resume/" />`,
	].join("\n\t\t");

	const schema = JSON.stringify({
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "ProfilePage",
				"@id": `${canonical}#webpage`,
				name: text.meta.title,
				url: canonical,
				description: text.meta.description,
				inLanguage: locale.htmlLang,
				dateModified: data.asOf,
				mainEntity: { "@id": "https://sayori.org/#person" },
			},
			{
				"@type": "Person",
				"@id": "https://sayori.org/#person",
				name: data.person.name,
				url: data.person.url,
				email: `mailto:${data.person.email}`,
				jobTitle: text.ui.hudClassValue,
				description: `${text.whoami.positioning} ${text.whoami.lede}`,
				sameAs: data.person.sameAs,
				award: data.awards.map((award) => `${text.awards.items[award.id].event} · ${text.awards.items[award.id].prize} (${titleOf(award.work)})`),
				knowsAbout: data.skills.flatMap((branch) => branch.nodes.map((node) => text.skills.branches[branch.id].nodes[node.id])),
			},
		],
	}).replaceAll("<", "\\u003c");

	const ui = JSON.stringify({
		controls: text.ui.windowControls,
		tray: text.ui.trayLabel,
		skip: text.ui.skip,
		locale: locale.id,
	}).replaceAll("<", "\\u003c");

	const values = {
		htmlLang: locale.htmlLang,
		mode,
		robots: isPrivate ? "noindex, nofollow" : "index, follow, max-image-preview:large",
		title: escapeHtml(text.meta.title),
		description: escapeHtml(text.meta.description),
		canonical,
		alternates,
		ogLocale: locale.ogLocale,
		ogAlt: escapeHtml(text.meta.ogAlt),
		version: RESUME_ASSET_VERSION,
		schema,
		ui,
		backHref: escapeHtml(text.ui.backHref),
		back: escapeHtml(text.ui.back),
		tagline: escapeHtml(text.ui.tagline),
		menuLabel: escapeHtml(text.ui.menuLabel),
		menu,
		press: escapeHtml(text.ui.press),
		noJs: escapeHtml(text.ui.noJs),
		printHeader,
		windows: [whoami, awards, worksIndex, workWindows, skills, jams, contact, options].join(""),
		hud,
		trayLabel: escapeHtml(text.ui.trayLabel),
		translationNote: text.ui.translationNote ? `<p class="footer-note">${escapeHtml(text.ui.translationNote)}</p>` : "",
		copyright: escapeHtml(text.ui.copyright),
		analytics: isPrivate ? "" : '<script defer src="/analytics.notebook.js?v=20260807-perf2"></script>',
		head: isPrivate ? `<link rel="stylesheet" href="${escapeHtml(asset("/resume/resume.css"))}" />` : [
			'<script>document.documentElement.classList.add("js");if(matchMedia("(min-width: 720px) and (min-height: 540px)").matches)document.documentElement.classList.add("desktop-mode");</script>',
			`<script src="/i18n-bootstrap.js?v=${RESUME_ASSET_VERSION}"></script>`,
			"<style>html[data-sayori-i18n-pending] body{visibility:hidden}</style>",
			`<script defer src="/i18n-router.js?v=${RESUME_ASSET_VERSION}"></script>`,
			`<link rel="stylesheet" href="/resume/resume.css?v=${RESUME_ASSET_VERSION}" />`,
			`<script type="module" src="/resume/resume.js?v=${RESUME_ASSET_VERSION}"></script>`,
		].join("\n\t\t"),
		logo: escapeHtml(asset(isPrivate ? "/assets/resume/logo.svg" : `/assets/resume/logo.svg?v=${RESUME_ASSET_VERSION}`)),
	};
	return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
		if (values[key] === undefined) throw new Error(`unknown resume page placeholder: ${key}`);
		return values[key];
	}).replace(/^[\t ]+(?=\r?$)/gm, "");
}

const PRIVATE_ORDER = ["realName", "school", "major", "grade", "phone", "email"];

function fileIcon(work, asset, size = "") {
	const glyph = work.titleLatin.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
	const art = work.cover && !size
		? `<img src="${escapeHtml(asset(work.cover))}" alt="" width="1280" height="720" loading="lazy" decoding="async" />`
		: `<span class="file-glyph">${escapeHtml(glyph)}</span>`;
	return `<span class="file-icon file-icon--${work.kind}${size ? ` file-icon--${size}` : ""}" aria-hidden="true">${art}</span>`;
}

function linkName(href) {
	const url = new URL(href);
	const tail = url.pathname.replace(/\/$/, "").split("/").filter(Boolean).pop();
	return url.host === "github.com" || url.host === "blog.sayori.org" ? tail || url.host : url.host.replace(/^www\./, "");
}

function printUrl(href) {
	return /^https:\/\//.test(href) ? ` data-print="${escapeHtml(href.replace(/^https:\/\/(?:www\.)?/, "").replace(/\/$/, ""))}"` : "";
}

function external(href) {
	return /^https:\/\//.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
}

export function escapeHtml(value) {
	return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
