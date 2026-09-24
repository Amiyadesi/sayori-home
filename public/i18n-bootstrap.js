(() => {
	"use strict";

	const STORAGE_KEY = "sayori:ui-language";
	const MANUAL_COOKIE = "sayori_locale";
	const AUTO_COOKIE = "sayori_locale_auto";

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

	let query = "";
	try {
		const url = new URL(location.href);
		const raw = url.searchParams.get("lang");
		if (raw && ["zh", "zh-hans", "zh-hant", "en"].includes(raw.toLowerCase())) {
			query = normalize(raw);
			save(query);
			// Keep ?lang= visible so EN/中文 are not same-URL self-links.
		}
	} catch {}

	let legacy = "";
	try { legacy = localStorage.getItem(STORAGE_KEY) || ""; } catch {}
	const manual = cookie(MANUAL_COOKIE);
	if (!manual && legacy) save(normalize(legacy));
	const language = query || normalize(cookie(MANUAL_COOKIE) || cookie(AUTO_COOKIE) || legacy || navigator.languages?.[0] || navigator.language);
	const htmlLanguage = language === "zh-Hans" ? "zh-CN" : language === "zh-Hant" ? "zh-Hant" : "en";

	document.documentElement.lang = htmlLanguage;
	document.documentElement.dataset.sayoriCurrentLanguage = language;
	if (language !== "zh-Hans") document.documentElement.dataset.sayoriI18nPending = "true";
	window.SAYORI_I18N = { defaultLanguage: "en", initialLanguage: language, pendingUntilReady: language !== "zh-Hans" };
})();
