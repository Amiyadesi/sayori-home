(() => {
	"use strict";

	const STORAGE_KEY = "sayori:ui-language";
	const config = window.SAYORI_I18N || {};
	const LOCALES = [{"id":"zh-Hans","base":""},{"id":"zh-Hant","base":"zh-hant"},{"id":"en","base":"en"},{"id":"ja","base":"ja"},{"id":"fr","base":"fr"},{"id":"ko","base":"ko"},{"id":"es","base":"es"},{"id":"de","base":"de"},{"id":"pt-BR","base":"pt-br"}];
	const LANGUAGES = LOCALES.map(({ id }) => id);
	const SHARED = ["zh-Hans", "zh-Hant", "en"];
	const LABELS = { "zh-Hans": "简体中文", "zh-Hant": "繁體中文", en: "English", ja: "日本語", fr: "Français", ko: "한국어", es: "Español", de: "Deutsch", "pt-BR": "Português (Brasil)" };

	function normalizeLanguage(value) {
		const input = String(value || "").toLowerCase();
		if (["zh-hant", "zh-tw", "zh-hk", "tw"].includes(input)) return "zh-Hant";
		if (["zh-hans", "zh-cn", "zh", "cn"].includes(input)) return "zh-Hans";
		const primary = input.split("-")[0];
		if (primary === "pt") return "pt-BR";
		return ["ja", "fr", "ko", "es", "de"].includes(primary) ? primary : "en";
	}

	function readStoredLanguage() {
		try {
			const value = localStorage.getItem(STORAGE_KEY);
			return value ? normalizeLanguage(value) : null;
		} catch {
			return null;
		}
	}

	function saveLanguage(value) {
		try {
			localStorage.setItem(STORAGE_KEY, value);
		} catch {}
		if (!SHARED.includes(value)) return;
		document.cookie = `sayori_locale=${encodeURIComponent(value)}; Domain=.sayori.org; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
		document.cookie = "sayori_locale_auto=; Domain=.sayori.org; Path=/; Max-Age=0; SameSite=Lax; Secure";
	}

	function stripLocale(path) {
		for (const { base } of LOCALES) {
			if (base && (path === "/" + base || path.startsWith("/" + base + "/"))) return path.slice(base.length + 1) || "/";
		}
		return path || "/";
	}

	function pageLanguages(path) {
		const base = stripLocale(path);
		return base === "/" || /^\/(?:about|services|social|resume)\/?$/.test(base) ? LANGUAGES : null;
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

	function readQueryLanguage() {
		try {
			const url = new URL(window.location.href);
			const value = url.searchParams.get("lang");
			if (!value || !["zh", "zh-hans", "zh-hant", "en", "ja", "fr", "ko", "es", "de", "pt-br"].includes(value.toLowerCase())) return null;
			url.searchParams.delete("lang");
			window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
			return normalizeLanguage(value);
		} catch {
			return null;
		}
	}

	const routeLanguage = (() => {
		const path = window.location.pathname;
		for (const { id, base } of LOCALES) {
			if (base && (path === "/" + base || path.startsWith("/" + base + "/"))) return id;
		}
		return isLocalizedPage(path) ? "zh-Hans" : null;
	})();
	const browserLanguage = normalizeLanguage(
		navigator.languages?.[0] || navigator.language || config.defaultLanguage || "zh-CN",
	);
	const queryLanguage = config.initialLanguage ? null : readQueryLanguage();
	let preferredLanguage = normalizeLanguage(config.preferredLanguage || config.initialLanguage || routeLanguage || queryLanguage || readStoredLanguage() || browserLanguage);
	let currentLanguage = config.initialLanguage
		? normalizeLanguage(config.initialLanguage)
		: pageLanguage(routeLanguage || preferredLanguage, window.location.pathname);
	if (queryLanguage) saveLanguage(queryLanguage);

	document.documentElement.lang = htmlLanguage(currentLanguage);
	document.documentElement.dataset.sayoriCurrentLanguage = currentLanguage;
	if (config.pendingUntilReady) document.documentElement.dataset.sayoriI18nPending = "true";

	let readyTimer = null;
	function ready() {
		delete document.documentElement.dataset.sayoriI18nPending;
		if (readyTimer !== null && typeof clearTimeout === "function") clearTimeout(readyTimer);
		readyTimer = null;
	}

	if (config.pendingUntilReady && typeof setTimeout === "function") readyTimer = setTimeout(ready, 3000);

	function setLanguage(value, { reload = config.reloadOnChange !== false } = {}) {
		const language = normalizeLanguage(value);
		preferredLanguage = language;
		currentLanguage = pageLanguage(language, window.location.pathname);
		saveLanguage(language);
		document.documentElement.lang = htmlLanguage(currentLanguage);
		document.documentElement.dataset.sayoriCurrentLanguage = currentLanguage;
		if (typeof window.CustomEvent === "function") {
			window.dispatchEvent(new window.CustomEvent("sayori:ui-language-change", {
				detail: { language: currentLanguage },
			}));
		}
		if (reload && typeof window.location.assign === "function") {
			const targetPath = localizedPath(window.location.pathname, language);
			if (targetPath !== window.location.pathname) {
				window.location.assign(`${targetPath}${window.location.search}${window.location.hash}`);
			} else if (typeof window.location.reload === "function") {
				window.location.reload();
			}
		}
		return language;
	}

	document.addEventListener("click", (event) => {
		const control = event.target.closest?.("a[data-sayori-language], button[data-sayori-language]");
		if (control) {
			const language = control.dataset.sayoriLanguage;
			if (!LANGUAGES.includes(language)) return;
			event.preventDefault?.();
			setLanguage(language);
			return;
		}
		const anchor = event.target.closest?.("a[href]");
		if (!anchor || anchor.hasAttribute?.("hreflang") || anchor.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.button !== undefined && event.button !== 0)) return;
		try {
			const target = new URL(anchor.href, window.location.href);
			if (target.origin !== window.location.origin) return;
			const localized = localizedPath(target.pathname, preferredLanguage);
			if (localized !== target.pathname) anchor.href = `${localized}${target.search}${target.hash}`;
		} catch {}
	});

	document.addEventListener("change", (event) => {
		const control = event.target.closest?.("select[data-sayori-language-select]");
		if (!control || !LANGUAGES.includes(control.value)) return;
		setLanguage(control.value);
	});

	function htmlLanguage(language) {
		return language === "zh-Hans" ? "zh-CN" : language;
	}

	function createSelect() {
		const select = document.createElement("select");
		select.className = "sayori-language-select";
		select.dataset.sayoriLanguageSelect = "true";
		select.setAttribute("aria-label", { "zh-Hans": "语言", "zh-Hant": "語言", en: "Language", ja: "言語", fr: "Langue", ko: "언어", es: "Idioma", de: "Sprache", "pt-BR": "Idioma" }[currentLanguage]);
		for (const language of pageLanguages(window.location.pathname) || SHARED) {
			const option = document.createElement("option");
			option.value = language;
			option.textContent = LABELS[language];
			select.append(option);
		}
		select.value = currentLanguage;
		return select;
	}

	for (const control of document.querySelectorAll("[data-sayori-language]")) control.replaceWith(createSelect());
	const style = document.createElement("style");
	style.textContent = ".sayori-language-select{font:inherit;color:inherit;background:transparent;border:0;cursor:pointer;padding:.15rem .25rem}.sayori-language-select:focus-visible{outline:2px solid currentColor;outline-offset:2px}";
	document.head.append(style);

	window.SayoriI18n = {
		STORAGE_KEY,
		get language() { return currentLanguage; },
		get preferredLanguage() { return preferredLanguage; },
		languages: LANGUAGES,
		labels: LABELS,
		pageLanguages,
		normalizeLanguage,
		createSelect,
		localizedPath,
		ready,
		setLanguage,
	};

})();
