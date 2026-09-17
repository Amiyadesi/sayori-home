export const LOCALES = new Set(["zh-Hans", "zh-Hant", "en"]);

export function localeFromCountry(country) {
	const code = String(country || "").toUpperCase();
	if (code === "CN") return "zh-Hans";
	if (code === "HK" || code === "MO" || code === "TW") return "zh-Hant";
	return "en";
}

export function readCookie(request, name) {
	const cookie = request.headers.get("cookie") || "";
	for (const part of cookie.split(";")) {
		const [key, ...value] = part.trim().split("=");
		if (key === name) return decodeURIComponent(value.join("="));
	}
	return null;
}

export function localeCookie(locale, permanent = false) {
	return [
		`${permanent ? "sayori_locale" : "sayori_locale_auto"}=${encodeURIComponent(locale)}`,
		"Domain=.sayori.org",
		"Path=/",
		"SameSite=Lax",
		"Secure",
		...(permanent ? ["Max-Age=31536000"] : []),
	].join("; ");
}

export function requestLocale(request) {
	const manual = readCookie(request, "sayori_locale");
	if (LOCALES.has(manual)) return { locale: manual, setCookie: null };
	const automatic = readCookie(request, "sayori_locale_auto");
	if (LOCALES.has(automatic)) return { locale: automatic, setCookie: null };
	const locale = localeFromCountry(request.cf?.country || request.headers.get("cf-ipcountry"));
	return { locale, setCookie: localeCookie(locale) };
}
