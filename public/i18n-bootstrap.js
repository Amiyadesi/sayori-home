(() => {
	"use strict";

	const STORAGE_KEY = "sayori:ui-language";
	const MANUAL_COOKIE = "sayori_locale";
	const AUTO_COOKIE = "sayori_locale_auto";
	const LOCALES = [{"id":"zh-Hans","base":""},{"id":"zh-Hant","base":"zh-hant"},{"id":"en","base":"en"},{"id":"ja","base":"ja"},{"id":"fr","base":"fr"},{"id":"ko","base":"ko"},{"id":"es","base":"es"},{"id":"de","base":"de"},{"id":"pt-BR","base":"pt-br"}];
	const ALL = LOCALES.map(({ id }) => id);
	const SHARED = ["zh-Hans", "zh-Hant", "en"];

	function normalize(value) {
		const input = String(value || "").toLowerCase();
		if (input === "zh-hant" || input === "zh-tw" || input === "zh-hk" || input === "tw") return "zh-Hant";
		if (input === "zh-hans" || input === "zh-cn" || input === "zh" || input === "cn") return "zh-Hans";
		const primary = input.split("-")[0];
		if (primary === "pt") return "pt-BR";
		return ["ja", "fr", "ko", "es", "de"].includes(primary) ? primary : "en";
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
		if (!SHARED.includes(value)) return;
		document.cookie = `${MANUAL_COOKIE}=${encodeURIComponent(value)}; Domain=.sayori.org; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
		document.cookie = `${AUTO_COOKIE}=; Domain=.sayori.org; Path=/; Max-Age=0; SameSite=Lax; Secure`;
	}

	function stripLocale(path) {
		for (const { base } of LOCALES) {
			if (base && (path === "/" + base || path.startsWith("/" + base + "/"))) return path.slice(base.length + 1) || "/";
		}
		return path || "/";
	}

	function pageLanguages(path) {
		const base = stripLocale(path);
		return base === "/" || /^\/(?:about|services|social|resume)\/?$/.test(base) ? ALL : null;
	}

	function isLocalizedPage(path) {
		return pageLanguages(path) !== null;
	}

	function pageLanguage(language, path) {
		return (pageLanguages(path) || SHARED).includes(language) ? language : "en";
	}

	function localizedPath(path, language) {
		const base = stripLocale(path);
		const languages = pageLanguages(base);
		if (!languages) return path;
		const prefix = LOCALES.find(({ id }) => id === (languages.includes(language) ? language : "en")).base;
		if (!prefix) return base;
		return base === "/" ? `/${prefix}/` : `/${prefix}${base}`;
	}

	function pathLanguage(path) {
		for (const { id, base } of LOCALES) {
			if (base && (path === "/" + base || path.startsWith("/" + base + "/"))) return id;
		}
		return isLocalizedPage(path) ? "zh-Hans" : null;
	}

	let query = "";
	let pathname = window.location.pathname;
	let search = window.location.search;
	let hash = window.location.hash;
	try {
		const url = new URL(window.location.href);
		const raw = url.searchParams.get("lang");
		if (raw && ["zh", "zh-hans", "zh-hant", "en", "ja", "fr", "ko", "es", "de", "pt-br"].includes(raw.toLowerCase())) {
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
		|| (stored && !SHARED.includes(normalize(stored)) ? normalize(stored) : "")
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

	const language = pageLanguage(preferred, pathname);
	document.documentElement.lang = language === "zh-Hans" ? "zh-CN" : language;
	document.documentElement.dataset.sayoriCurrentLanguage = language;
	try {
		if (new URLSearchParams(search).get("paper") === "0617") {
			const root = document.documentElement;
            const referrer = document.referrer ? new URL(document.referrer) : null;
            const fromWorld = referrer && /(^|\.)sayori\.org$/.test(referrer.hostname) && referrer.searchParams.get('paper') === '0617';
            const reload = performance.getEntriesByType('navigation')[0]?.type === 'reload' && document.cookie.includes('p34_world_v1=');
            root.dataset.p34Entry = fromWorld || reload ? 'quiet' : 'morph';
            if (root.dataset.p34Entry === 'quiet') root.classList.add('p34-world');
            const worldStyle = document.createElement("link");
            worldStyle.rel = "stylesheet";
            worldStyle.href = "/p34-luminous.css?v=20261104-flow"; worldStyle.dataset.p34LuminousStyle = "";
            worldStyle.dataset.p34LivingStyle = "";
            document.head.append(worldStyle);
		} else if (document.referrer && new URL(document.referrer).origin === location.origin && new URL(document.referrer).searchParams.get('paper') === '0617') {
			const travel = document.createElement('style');
			travel.textContent = '@view-transition{navigation:auto}html::view-transition-old(root),html::view-transition-new(root){animation-duration:180ms}@media(prefers-reduced-motion:reduce){html::view-transition-old(root),html::view-transition-new(root){animation-duration:0ms}}';
			document.head.append(travel);
			const content = document.createElement('link');
			content.rel = 'expect'; content.href = '#main-content'; content.setAttribute('blocking', 'render');
			document.head.append(content);
		}
	} catch {}
	const pendingUntilReady = language !== "zh-Hans" && !isLocalizedPage(pathname);
	if (pendingUntilReady) document.documentElement.dataset.sayoriI18nPending = "true";
	window.SAYORI_I18N = {
		defaultLanguage: "zh-Hans",
		initialLanguage: language,
		preferredLanguage: preferred,
		pendingUntilReady,
		localizedPath,
	};
})();
