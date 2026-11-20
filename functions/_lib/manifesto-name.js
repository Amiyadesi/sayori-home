export function manifestoNameKey(name) {
	if (typeof name !== "string" || !name || name.trim() !== name || [...name].length > 48) return "";
	const key = name.normalize("NFKC").toLowerCase();
	return /[\p{C}<>&@/\\]|(?:https?:|www\.)/iu.test(key) ? "" : key;
}
