import fs from "node:fs";

const template = fs.readFileSync(new URL("./social-page.html", import.meta.url), "utf8");
const copy = {
	zh: {
		lang: "zh-CN", prefix: "", title: "社交账号", back: "回到书桌",
		intro: "Amiya_desi 的作品、动态和交流入口，都放在这里。",
		language: "切换语言", email: "联系我", note: "点击平台，查看动态或和我联系。",
	},
	"zh-hant": {
		lang: "zh-Hant", prefix: "/zh-hant", title: "社交帳號", back: "回到書桌",
		intro: "Amiya_desi 的作品、動態和交流入口，都放在這裡。",
		language: "切換語言", email: "聯絡我", note: "點擊平台，查看動態或和我聯絡。",
	},
	en: {
		lang: "en", prefix: "/en", title: "Find me online", back: "Back to the desk",
		intro: "My projects, updates, and places to keep in touch, all in one place.",
		language: "Language", email: "Email me", note: "Choose a platform to follow or get in touch.",
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
	const canonical = `https://sayori.org${text.prefix}/social/`;
	const schema = JSON.stringify({
		"@context": "https://schema.org", "@type": "CollectionPage",
		name: title, description: text.intro, url: canonical, inLanguage: text.lang,
		mainEntity: { "@type": "ItemList", itemListElement: contact.links.map((link, index) => ({
			"@type": "ListItem", position: index + 1, name: link.label, url: link.href,
		})) },
	}).replaceAll("<", "\\u003c");
	const values = {
		...Object.fromEntries(Object.entries(text).map(([key, value]) => [key, escapeHtml(value)])),
		title: escapeHtml(title), heading: escapeHtml(text.title), canonical,
		home: `${text.prefix}/`, links, schema, address: escapeHtml(contact.email),
		options: Object.keys(copy).map((key) => `<option value="${key === "zh" ? "zh-Hans" : key === "zh-hant" ? "zh-Hant" : "en"}"${key === language ? " selected" : ""}>${key === "zh" ? "简体中文" : key === "zh-hant" ? "繁體中文" : "English"}</option>`).join(""),
	};
	return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
		if (values[key] === undefined) throw new Error(`unknown social page placeholder: ${key}`);
		return values[key];
	});
}

function escapeHtml(value) {
	return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
