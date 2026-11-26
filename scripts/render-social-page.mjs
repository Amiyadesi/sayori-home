import fs from "node:fs";
import { RESUME_LOCALES as locales } from "./resume-content.mjs";

const template = fs.readFileSync(new URL("./social-page.html", import.meta.url), "utf8");
const copy = {
	zh: {
		title: "社交账号", back: "回到书桌",
		intro: "Amiya_desi 的作品、动态和交流入口，都放在这里。",
		language: "切换语言", email: "联系我", note: "点击平台，查看动态或和我联系。",
	},
	"zh-hant": {
		title: "社交帳號", back: "回到書桌",
		intro: "Amiya_desi 的作品、動態和交流入口，都放在這裡。",
		language: "切換語言", email: "聯絡我", note: "點擊平台，查看動態或和我聯絡。",
	},
	en: {
		title: "Find me online", back: "Back to the desk",
		intro: "My projects, updates, and places to keep in touch, all in one place.",
		language: "Language", email: "Email me", note: "Choose a platform to follow or get in touch.",
	},
	"ja": {
		title: "ソーシャルリンク",
		back: "机に戻る",
		intro: "作品や近況、連絡先をここにまとめました。",
		language: "言語",
		email: "メールで連絡",
		note: "気になる場所から、近況をのぞいたり声をかけたりしてください。",
	},
	"fr": {
		title: "Me retrouver en ligne",
		back: "Retour au bureau",
		intro: "Mes projets, mes nouvelles et les endroits où me joindre.",
		language: "Langue",
		email: "M’écrire",
		note: "Choisissez une plateforme pour suivre mes nouvelles ou m’écrire.",
	},
	"ko": {
		title: "소셜 링크",
		back: "책상으로",
		intro: "작품과 소식, 연락할 수 있는 곳을 한데 모았습니다.",
		language: "언어",
		email: "이메일 보내기",
		note: "플랫폼을 골라 소식을 보거나 연락해 주세요.",
	},
	"es": {
		title: "Dónde encontrarme",
		back: "Volver al escritorio",
		intro: "Mis proyectos, novedades y formas de contacto, en un solo lugar.",
		language: "Idioma",
		email: "Escríbeme",
		note: "Elige una plataforma para seguir mis novedades o escribirme.",
	},
	"de": {
		title: "Hier findest du mich",
		back: "Zurück zum Schreibtisch",
		intro: "Meine Projekte, Neuigkeiten und Kontaktmöglichkeiten auf einen Blick.",
		language: "Sprache",
		email: "E-Mail schreiben",
		note: "Wähle eine Plattform, um Neues zu lesen oder mir zu schreiben.",
	},
	"pt-br": {
		title: "Onde me encontrar",
		back: "Voltar à mesa",
		intro: "Meus projetos, novidades e formas de contato, tudo em um só lugar.",
		language: "Idioma",
		email: "Enviar e-mail",
		note: "Escolha uma plataforma para acompanhar as novidades ou falar comigo.",
	},
};

export function renderSocialPage(contact, language) {
	const text = copy[language];
	if (!text) throw new Error(`unsupported social page language: ${language}`);
	if (!Array.isArray(contact?.links) || !contact.links.length) throw new Error("social page requires contact.links");
	if (typeof contact.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) throw new Error("social page requires a valid contact.email");
	const links = contact.links.map(({ label, href, handle }) => {
		if (typeof label !== "string" || !label.trim()) throw new Error("social link requires a label");
		const url = new URL(href);
		if (url.protocol !== "https:") throw new Error(`social link must use HTTPS: ${label}`);
		if (handle !== undefined && typeof handle !== "string") throw new Error(`social link handle must be text: ${label}`);
		return `<li><a class="social-link" href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer"><span class="social-platform">${escapeHtml(label)}</span><span class="social-handle">${escapeHtml(handle ?? url.host.replace(/^www\./, "") + url.pathname.replace(/\/$/, ""))}</span></a></li>`;
	}).join("\n\t\t\t\t\t");
	const title = `${text.title} · Amiya_desi`;
	const locale = locales.find((item) => item.file === language);
	const home = locale.base ? `/${locale.base}/` : "/";
	const canonical = `https://sayori.org${home}social/`;
	const schema = JSON.stringify({
		"@context": "https://schema.org", "@type": "CollectionPage",
		name: title, description: text.intro, url: canonical, inLanguage: locale.htmlLang,
		mainEntity: { "@type": "ItemList", itemListElement: contact.links.map((link, index) => ({
			"@type": "ListItem", position: index + 1, name: link.label, url: link.href,
		})) },
	}).replaceAll("<", "\\u003c");
	const values = {
		...Object.fromEntries(Object.entries(text).map(([key, value]) => [key, escapeHtml(value)])),
		title: escapeHtml(title), heading: escapeHtml(text.title), canonical,
		home, lang: locale.htmlLang, ogLocale: locale.ogLocale, links, schema, address: escapeHtml(contact.email),
		options: locales.map((item) => `<option value="${item.id}"${item === locale ? " selected" : ""}>${item.label}</option>`).join(""),
		languageLinks: locales.map((item) => `<a href="/${item.base ? item.base + "/" : ""}social/" lang="${item.htmlLang}" hreflang="${item.hreflang}">${item.label}</a>`).join(" "),
	};
	return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
		if (values[key] === undefined) throw new Error(`unknown social page placeholder: ${key}`);
		return values[key];
	});
}

function escapeHtml(value) {
	return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
