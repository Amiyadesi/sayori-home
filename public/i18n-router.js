(() => {
	"use strict";

	const STORAGE_KEY = "sayori:ui-language";
	const config = window.SAYORI_I18N || {};
	const LANGUAGES = ["zh-Hans", "zh-Hant", "en"];
	const LABELS = { "zh-Hans": "简体中文", "zh-Hant": "繁體中文", en: "English" };
	const PREFIXES = [["/zh-hant", "zh-Hant"], ["/en", "en"]];

	function normalizeLanguage(value) {
		const input = String(value || "").toLowerCase();
		if (["zh-hant", "zh-tw", "zh-hk", "tw"].includes(input)) return "zh-Hant";
		if (["zh-hans", "zh-cn", "zh", "cn"].includes(input)) return "zh-Hans";
		return "en";
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
		document.cookie = `sayori_locale=${encodeURIComponent(value)}; Domain=.sayori.org; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
		document.cookie = "sayori_locale_auto=; Domain=.sayori.org; Path=/; Max-Age=0; SameSite=Lax; Secure";
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

	function readQueryLanguage() {
		try {
			const url = new URL(window.location.href);
			const value = url.searchParams.get("lang");
			if (!value || !["zh", "zh-hans", "zh-hant", "en"].includes(value.toLowerCase())) return null;
			url.searchParams.delete("lang");
			window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
			return normalizeLanguage(value);
		} catch {
			return null;
		}
	}

	const routeLanguage = (() => {
		const path = window.location.pathname;
		if (path === "/en" || path.startsWith("/en/")) return "en";
		if (path === "/zh-hant" || path.startsWith("/zh-hant/")) return "zh-Hant";
		return null;
	})();
	const browserLanguage = normalizeLanguage(
		navigator.languages?.[0] || navigator.language || config.defaultLanguage || "zh-CN",
	);
	const queryLanguage = config.initialLanguage ? null : readQueryLanguage();
	let currentLanguage = normalizeLanguage(config.initialLanguage || routeLanguage || queryLanguage || readStoredLanguage() || browserLanguage);
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
		currentLanguage = language;
		saveLanguage(language);
		document.documentElement.lang = htmlLanguage(language);
		document.documentElement.dataset.sayoriCurrentLanguage = language;
		if (typeof window.CustomEvent === "function") {
			window.dispatchEvent(new window.CustomEvent("sayori:ui-language-change", {
				detail: { language },
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
		if (!anchor || anchor.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.button !== undefined && event.button !== 0)) return;
		try {
			const target = new URL(anchor.href, window.location.href);
			if (target.origin !== window.location.origin) return;
			const localized = localizedPath(target.pathname, currentLanguage);
			if (localized !== target.pathname) anchor.href = `${localized}${target.search}${target.hash}`;
		} catch {}
	});

	document.addEventListener("change", (event) => {
		const control = event.target.closest?.("select[data-sayori-language-select]");
		if (!control || !LANGUAGES.includes(control.value)) return;
		setLanguage(control.value);
	});

	function htmlLanguage(language) {
		return language === "zh-Hans" ? "zh-CN" : language === "zh-Hant" ? "zh-Hant" : "en";
	}

	function createSelect() {
		const select = document.createElement("select");
		select.className = "sayori-language-select";
		select.dataset.sayoriLanguageSelect = "true";
		select.setAttribute("aria-label", "Language");
		for (const language of LANGUAGES) {
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
		normalizeLanguage,
		createSelect,
		localizedPath,
		ready,
		setLanguage,
	};

})();