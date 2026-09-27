(() => {
	"use strict";

	const STORAGE_KEY = "sayori:ui-language";
	const MANUAL_COOKIE = "sayori_locale";
	const AUTO_COOKIE = "sayori_locale_auto";
	const PREFIXES = [["/zh-hant", "zh-Hant"], ["/en", "en"]];

	function normalize(value) {
		const input = String(value || "").toLowerCase();
		if (input === "zh-hant" || input === "zh-tw" || input === "zh-hk" || input === "tw") return "zh-Hant";
		if (input === "zh-hans" || input === "zh-cn" || input === "zh" || input === "cn") return "zh-Hans";
		return "en";
	}

	function cookie(name) {
		for (const part of document.cookie.split(";")) {
			const [key, ...value] = part.trim().split("=");
			if (key === name) return decodeURIComponent(value.join("="));
		}
		return "";
	}

	function save(value) {
		try { localStorage.setItem(STORAGE_KEY, value); } catch {}
		document.cookie = `${MANUAL_COOKIE}=${encodeURIComponent(value)}; Domain=.sayori.org; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
		document.cookie = `${AUTO_COOKIE}=; Domain=.sayori.org; Path=/; Max-Age=0; SameSite=Lax; Secure`;
	}

	function stripLocale(path) {
		for (const [prefix] of PREFIXES) {
			if (path === prefix || path.startsWith(prefix + "/")) return path.slice(prefix.length) || "/";
		}
		return path || "/";
	}

	function isLocalizedPage(path) {
		const base = stripLocale(path);
		return base === "/" || /^\/(?:about|services)\/?$/.test(base);
	}

	function localizedPath(path, language) {
		const base = stripLocale(path);
		if (!isLocalizedPage(base)) return path;
		if (language === "en") return base === "/" ? "/en/" : "/en" + base;
		if (language === "zh-Hant") return base === "/" ? "/zh-hant/" : "/zh-hant" + base;
		return base;
	}

	function pathLanguage(path) {
		if (path === "/en" || path.startsWith("/en/")) return "en";
		if (path === "/zh-hant" || path.startsWith("/zh-hant/")) return "zh-Hant";
		return null;
	}

	let query = "";
	let pathname = window.location.pathname;
	let search = window.location.search;
	let hash = window.location.hash;
	try {
		const url = new URL(window.location.href);
		const raw = url.searchParams.get("lang");
		if (raw && ["zh", "zh-hans", "zh-hant", "en"].includes(raw.toLowerCase())) {
			query = normalize(raw);
			url.searchParams.delete("lang");
			save(query);
			const targetPath = localizedPath(url.pathname, query);
			window.location.replace(`${targetPath}${url.search}${url.hash}`);
			return;
		}
		pathname = url.pathname;
		search = url.search;
		hash = url.hash;
	} catch {}

	const explicitLanguage = pathLanguage(pathname);
	let stored = "";
	try { stored = localStorage.getItem(STORAGE_KEY) || ""; } catch {}
	const manual = cookie(MANUAL_COOKIE);
	if (!manual && stored) save(normalize(stored));

	const preferred = explicitLanguage
		|| (manual ? normalize(manual) : "")
		|| (cookie(AUTO_COOKIE) ? normalize(cookie(AUTO_COOKIE)) : "")
		|| (stored ? normalize(stored) : "")
		|| normalize(navigator.languages?.[0] || navigator.language || "zh-CN");

	if (!explicitLanguage) {
		const targetPath = localizedPath(pathname, preferred);
		if (targetPath !== pathname) {
			save(preferred);
			window.location.replace(`${targetPath}${search}${hash}`);
			return;
		}
	} else {
		save(explicitLanguage);
	}

	const htmlLanguage = preferred === "zh-Hans" ? "zh-CN" : preferred;
	document.documentElement.lang = htmlLanguage;
	document.documentElement.dataset.sayoriCurrentLanguage = preferred;
	if (preferred !== "zh-Hans") document.documentElement.dataset.sayoriI18nPending = "true";
	window.SAYORI_I18N = {
		defaultLanguage: "zh-Hans",
		initialLanguage: preferred,
		pendingUntilReady: preferred !== "zh-Hans",
		localizedPath,
	};
})();
