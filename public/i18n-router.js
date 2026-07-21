(() => {
	"use strict";

	const STORAGE_KEY = "sayori:ui-language";
	const config = window.SAYORI_I18N || {};

	function normalizeLanguage(value) {
		return /^zh(?:-|_|$)/i.test(String(value || "")) ? "zh" : "en";
	}

	function readStoredLanguage() {
		try {
			const value = localStorage.getItem(STORAGE_KEY);
			return value === "zh" || value === "en" ? value : null;
		} catch {
			return null;
		}
	}

	function saveLanguage(value) {
		try {
			localStorage.setItem(STORAGE_KEY, value);
		} catch {
			// The current page can still use the selected language without storage.
		}
	}

	function readQueryLanguage() {
		try {
			const url = new URL(window.location.href);
			const value = url.searchParams.get("lang");
			if (value !== "zh" && value !== "en") return null;
			url.searchParams.delete("lang");
			window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
			return value;
		} catch {
			return null;
		}
	}

	const browserLanguage = normalizeLanguage(
		navigator.languages?.[0] || navigator.language || config.defaultLanguage || "zh",
	);
	const queryLanguage = readQueryLanguage();
	let currentLanguage = queryLanguage || readStoredLanguage() || browserLanguage;
	if (queryLanguage) saveLanguage(queryLanguage);

	document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
	document.documentElement.dataset.sayoriLanguage = currentLanguage;
	if (config.pendingUntilReady) {
		document.documentElement.dataset.sayoriI18nPending = "true";
	}

	let readyTimer = null;
	function ready() {
		delete document.documentElement.dataset.sayoriI18nPending;
		if (readyTimer !== null && typeof clearTimeout === "function") clearTimeout(readyTimer);
		readyTimer = null;
	}

	if (config.pendingUntilReady && typeof setTimeout === "function") {
		readyTimer = setTimeout(ready, 3000);
	}

	function setLanguage(value, { reload = config.reloadOnChange !== false } = {}) {
		const language = normalizeLanguage(value);
		currentLanguage = language;
		saveLanguage(language);
		document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
		document.documentElement.dataset.sayoriLanguage = language;
		if (typeof window.CustomEvent === "function") {
			window.dispatchEvent(new CustomEvent("sayori:ui-language-change", {
				detail: { language },
			}));
		}
		if (reload && typeof window.location.reload === "function") window.location.reload();
		return language;
	}

	document.addEventListener("click", (event) => {
		const control = event.target.closest?.("[data-sayori-language]");
		if (!control) return;
		const language = control.dataset.sayoriLanguage;
		if (language !== "zh" && language !== "en") return;
		event.preventDefault?.();
		setLanguage(language);
	});

	window.SayoriI18n = {
		STORAGE_KEY,
		get language() {
			return currentLanguage;
		},
		normalizeLanguage,
		ready,
		setLanguage,
	};
})();
