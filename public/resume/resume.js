const root = document.documentElement;
const ui = JSON.parse(document.getElementById("resume-ui")?.textContent || "{}");
const desktop = document.querySelector(".desktop");
const tray = document.querySelector(".tray");
const menuItems = [...document.querySelectorAll(".menu-item")];
const desktopQuery = matchMedia("(min-width: 720px) and (min-height: 540px)");
const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
const MOTION_KEY = "sayori:resume-motion";
const INTRO_KEY = "sayori:resume-intro-seen";
const PRIMARY = ["whoami", "awards"];
const GHOST_DELAYS = [150, 300];
const windows = new Map();
const openOrder = [];
let zTop = 20;
let selected = 0;
let introTimer = 0;

const store = {
	get(key) { try { return localStorage.getItem(key); } catch { return null; } },
	set(key, value) { try { localStorage.setItem(key, value); } catch {} },
	remove(key) { try { localStorage.removeItem(key); } catch {} },
};
const reduced = () => root.classList.contains("reduce-motion");
const isDesktop = () => root.classList.contains("desktop-mode");
const isInline = (id) => !isDesktop() && PRIMARY.includes(id);

function createControls(section) {
	const controls = document.createElement("div");
	controls.className = "win-controls";
	for (const [kind, glyph] of [["minimize", "—"], ["maximize", "□"], ["close", "×"]]) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "win-control";
		button.dataset.control = kind;
		button.textContent = glyph;
		button.setAttribute("aria-label", ui.controls?.[kind] || kind);
		button.title = ui.controls?.[kind] || kind;
		controls.append(button);
	}
	section.querySelector(".win-bar").append(controls);
}

for (const section of document.querySelectorAll(".win[data-window]")) {
	section.tabIndex = -1;
	createControls(section);
	windows.set(section.id, {
		id: section.id,
		el: section,
		placed: false,
		ghosts: [],
		trail: [],
		chip: null,
	});
}

function applyMotion() {
	const preference = store.get(MOTION_KEY);
	const reduce = preference ? preference === "reduce" : motionQuery.matches;
	root.classList.toggle("reduce-motion", reduce);
	document.querySelector('[data-action="motion"]')?.setAttribute("aria-pressed", String(reduce));
}

function applyMode() {
	const wasDesktop = isDesktop();
	root.classList.toggle("desktop-mode", desktopQuery.matches);
	if (wasDesktop === isDesktop()) return;
	for (const win of windows.values()) {
		win.el.style.left = win.el.style.top = win.el.style.zIndex = "";
		win.placed = false;
		win.el.classList.remove("is-max", "is-minimized");
		removeChip(win);
		hideGhosts(win);
		if (!isDesktop() && PRIMARY.includes(win.id)) win.el.classList.remove("is-open");
	}
	root.classList.remove("sheet-open");
	if (isDesktop()) {
		for (const id of PRIMARY) open(id, { focus: false, animate: false, history: false });
		for (const id of [...openOrder]) if (!PRIMARY.includes(id)) place(windows.get(id));
	} else {
		openOrder.length = 0;
		for (const win of windows.values()) win.el.classList.remove("is-open");
	}
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

function place(win, anchor) {
	const { el } = win;
	const vw = innerWidth;
	const vh = innerHeight;
	const titleRight = document.querySelector(".title")?.getBoundingClientRect().right || 0;
	const left = Math.max(titleRight + 32, vw * 0.3);
	const width = el.offsetWidth;
	const height = Math.min(el.offsetHeight, vh - 120);
	let x;
	let y;
	if (win.id === "whoami") {
		x = left;
		y = clamp(vh * 0.06, 24, 72);
	} else if (win.id === "awards") {
		x = vw - width - clamp(vw * 0.04, 24, 72);
		y = clamp(vh * 0.38, 120, vh - height - 72);
	} else if (anchor) {
		const box = anchor.getBoundingClientRect();
		x = box.left + 36;
		y = box.top + 28;
	} else {
		const step = openOrder.filter((id) => !PRIMARY.includes(id)).length % 6;
		x = left + 40 + step * 30;
		y = 56 + step * 30;
	}
	moveTo(win, clamp(x, 8, vw - width - 8), clamp(y, 8, vh - height - 64));
	win.placed = true;
}

function moveTo(win, x, y) {
	win.x = Math.round(x);
	win.y = Math.round(y);
	win.el.style.left = `${win.x}px`;
	win.el.style.top = `${win.y}px`;
}

function front(win) {
	zTop += 1;
	win.el.style.zIndex = String(zTop);
	for (const ghost of win.ghosts) ghost.style.zIndex = String(zTop - 1);
	const index = openOrder.indexOf(win.id);
	if (index >= 0) openOrder.splice(index, 1);
	openOrder.push(win.id);
}

function originFor(id) {
	const menu = document.querySelector(`.menu-item[data-open="${id}"]`);
	if (menu) return menu;
	const parent = windows.get(id)?.el.dataset.parent;
	return parent ? document.querySelector(`#${parent} [data-open="${id}"]`) : null;
}

function open(id, { focus = true, animate = true, history: push = true, anchor = null } = {}) {
	const win = windows.get(id);
	if (!win) return;
	if (isInline(id)) {
		win.el.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
		if (focus) win.el.focus({ preventScroll: true });
		return;
	}
	const { el } = win;
	if (win.chip) removeChip(win);
	el.classList.remove("is-minimized");
	if (el.classList.contains("is-open")) {
		if (isDesktop()) {
			front(win);
			if (!reduced()) flash(el);
		}
	} else {
		el.classList.add("is-open");
		if (isDesktop()) {
			if (!win.placed) place(win, anchor);
			front(win);
			if (animate && !reduced()) {
				el.classList.add("is-opening");
				el.addEventListener("animationend", () => el.classList.remove("is-opening"), { once: true });
				flyGhosts(win, anchor || originFor(id));
			}
		} else {
			openOrder.push(id);
			root.classList.add("sheet-open");
		}
	}
	if (push && location.hash !== `#${id}`) history.pushState({ resumeWindow: id }, "", `#${id}`);
	if (focus) el.focus({ preventScroll: true });
}

function flash(el) {
	el.classList.remove("is-flash");
	void el.offsetWidth;
	el.classList.add("is-flash");
	el.addEventListener("animationend", () => el.classList.remove("is-flash"), { once: true });
}

function close(id, { restoreFocus = true } = {}) {
	const win = windows.get(id);
	if (!win || isInline(id)) return;
	win.el.classList.remove("is-open", "is-max", "is-minimized");
	removeChip(win);
	hideGhosts(win);
	const index = openOrder.indexOf(id);
	if (index >= 0) openOrder.splice(index, 1);
	if (!isDesktop() && !openOrder.length) root.classList.remove("sheet-open");
	if (location.hash === `#${id}`) history.replaceState(null, "", `${location.pathname}${location.search}`);
	if (restoreFocus) (originFor(id) || menuItems[0])?.focus({ preventScroll: true });
}

function minimize(win) {
	if (!isDesktop()) return close(win.id);
	win.el.classList.add("is-minimized");
	hideGhosts(win);
	const chip = document.createElement("button");
	chip.type = "button";
	chip.className = "tray-item";
	chip.textContent = win.el.querySelector(".win-file")?.textContent || win.id;
	chip.addEventListener("click", () => open(win.id, { history: false }));
	win.chip = chip;
	tray.append(chip);
	tray.hidden = false;
	tray.setAttribute("aria-label", ui.tray || "");
	const next = openOrder.filter((id) => id !== win.id && !windows.get(id).el.classList.contains("is-minimized")).pop();
	(next ? windows.get(next).el : menuItems[0])?.focus({ preventScroll: true });
}

function removeChip(win) {
	win.chip?.remove();
	win.chip = null;
	if (!tray.children.length) tray.hidden = true;
}

function toggleMax(win) {
	const max = win.el.classList.toggle("is-max");
	const button = win.el.querySelector('[data-control="maximize"]');
	const label = ui.controls?.[max ? "restore" : "maximize"] || "";
	button.setAttribute("aria-label", label);
	button.title = label;
	front(win);
}

function ensureGhosts(win) {
	if (win.ghosts.length) return;
	for (let index = 0; index < GHOST_DELAYS.length; index += 1) {
		const ghost = document.createElement("div");
		ghost.className = "win-ghost";
		ghost.setAttribute("aria-hidden", "true");
		desktop.insertBefore(ghost, win.el);
		win.ghosts.push(ghost);
	}
}

function sizeGhosts(win) {
	for (const ghost of win.ghosts) {
		ghost.style.width = `${win.el.offsetWidth}px`;
		ghost.style.height = `${win.el.offsetHeight}px`;
		ghost.style.zIndex = String(Number(win.el.style.zIndex || zTop) - 1);
	}
}

function hideGhosts(win) {
	for (const ghost of win.ghosts) ghost.classList.remove("is-visible");
	win.trail.length = 0;
	cancelAnimationFrame(win.frame);
}

function sample(trail, time) {
	if (!trail.length) return null;
	if (time <= trail[0].t) return trail[0];
	for (let index = trail.length - 1; index >= 0; index -= 1) {
		const a = trail[index];
		if (a.t <= time) {
			const b = trail[index + 1];
			if (!b) return a;
			const k = (time - a.t) / (b.t - a.t || 1);
			return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
		}
	}
	return trail[trail.length - 1];
}

function record(win, time = performance.now()) {
	win.trail.push({ t: time, x: win.x, y: win.y });
	while (win.trail.length > 2 && time - win.trail[1].t > 600) win.trail.shift();
}

function animateGhosts(win, until) {
	cancelAnimationFrame(win.frame);
	const step = (now) => {
		win.ghosts.forEach((ghost, index) => {
			const point = sample(win.trail, now - GHOST_DELAYS[index]);
			if (point) ghost.style.transform = `translate(${point.x}px, ${point.y}px)`;
		});
		if (win.dragging || now < until()) win.frame = requestAnimationFrame(step);
		else hideGhosts(win);
	};
	win.frame = requestAnimationFrame(step);
}

function flyGhosts(win, origin) {
	if (!origin) return;
	ensureGhosts(win);
	sizeGhosts(win);
	const box = origin.getBoundingClientRect();
	const now = performance.now();
	win.trail.length = 0;
	win.trail.push({ t: now, x: box.left, y: box.top - win.el.offsetHeight / 3 }, { t: now + 200, x: win.x, y: win.y });
	for (const ghost of win.ghosts) ghost.classList.add("is-visible");
	const end = now + 200 + GHOST_DELAYS[GHOST_DELAYS.length - 1] + 160;
	animateGhosts(win, () => end);
	setTimeout(() => { for (const ghost of win.ghosts) ghost.classList.remove("is-visible"); }, end - now - 140);
}

function startDrag(win, event) {
	if (!isDesktop() || win.el.classList.contains("is-max") || event.button !== 0) return;
	event.preventDefault();
	front(win);
	const start = { x: event.clientX, y: event.clientY, left: win.x, top: win.y };
	win.dragging = true;
	win.el.classList.add("is-dragging");
	const bar = event.currentTarget;
	bar.setPointerCapture(event.pointerId);
	const animated = !reduced();
	if (animated) {
		ensureGhosts(win);
		sizeGhosts(win);
		win.trail.length = 0;
		record(win);
		for (const ghost of win.ghosts) ghost.classList.add("is-visible");
		animateGhosts(win, () => win.settle || 0);
	}
	const move = (next) => {
		moveTo(win,
			clamp(start.left + next.clientX - start.x, 8 - win.el.offsetWidth / 2, innerWidth - win.el.offsetWidth / 2),
			clamp(start.top + next.clientY - start.y, 0, innerHeight - 48));
		if (animated) record(win);
	};
	const stop = () => {
		bar.removeEventListener("pointermove", move);
		bar.removeEventListener("pointerup", stop);
		bar.removeEventListener("pointercancel", stop);
		win.dragging = false;
		win.el.classList.remove("is-dragging");
		if (!animated) return;
		const now = performance.now();
		win.trail.push({ t: now, x: win.x, y: win.y });
		win.settle = now + GHOST_DELAYS[GHOST_DELAYS.length - 1] + 120;
		setTimeout(() => { for (const ghost of win.ghosts) ghost.classList.remove("is-visible"); }, GHOST_DELAYS[GHOST_DELAYS.length - 1]);
	};
	bar.addEventListener("pointermove", move);
	bar.addEventListener("pointerup", stop);
	bar.addEventListener("pointercancel", stop);
}

for (const win of windows.values()) {
	win.el.querySelector(".win-bar").addEventListener("pointerdown", (event) => {
		if (event.target.closest("button")) return;
		startDrag(win, event);
	});
	win.el.addEventListener("pointerdown", () => { if (isDesktop() && win.el.classList.contains("is-open")) front(win); });
	win.el.querySelector(".win-controls").addEventListener("click", (event) => {
		const control = event.target.closest("[data-control]")?.dataset.control;
		if (control === "close") close(win.id);
		if (control === "minimize") minimize(win);
		if (control === "maximize") toggleMax(win);
	});
}

function select(index, { focus = false } = {}) {
	selected = (index + menuItems.length) % menuItems.length;
	menuItems.forEach((item, position) => item.classList.toggle("is-selected", position === selected));
	if (focus) menuItems[selected].focus({ preventScroll: true });
}

menuItems.forEach((item, index) => {
	item.addEventListener("pointerenter", () => select(index));
	item.addEventListener("focus", () => select(index));
});

document.addEventListener("click", (event) => {
	if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
	const language = event.target.closest("[data-sayori-resume-language]");
	if (language && window.SayoriI18n?.setLanguage) {
		event.preventDefault();
		window.SayoriI18n.setLanguage(language.dataset.sayoriResumeLanguage);
		return;
	}
	const trigger = event.target.closest("[data-open]");
	if (!trigger) return;
	const id = trigger.dataset.open;
	if (!windows.has(id)) return;
	if (isInline(id) && !isDesktop()) return;
	event.preventDefault();
	if (root.classList.contains("intro-run")) finishIntro();
	const parent = trigger.closest(".win");
	open(id, { anchor: parent && parent.id !== id ? trigger : null });
});

document.addEventListener("click", (event) => {
	const action = event.target.closest("[data-action]")?.dataset.action;
	if (action === "motion") {
		store.set(MOTION_KEY, reduced() ? "full" : "reduce");
		applyMotion();
	} else if (action === "print") {
		window.print();
	} else if (action === "replay") {
		store.remove(INTRO_KEY);
		for (const id of [...openOrder]) close(id, { restoreFocus: false });
		runIntro({ force: true });
	}
});

function topWindow() {
	for (let index = openOrder.length - 1; index >= 0; index -= 1) {
		const win = windows.get(openOrder[index]);
		if (win && !win.el.classList.contains("is-minimized") && !isInline(win.id)) return win;
	}
	return null;
}

function inEditable(target) {
	return target.closest?.("input, textarea, select, [contenteditable='true']");
}

document.addEventListener("keydown", (event) => {
	if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
	if (event.key === "Escape") {
		const win = topWindow();
		if (win) {
			event.preventDefault();
			close(win.id);
		}
		return;
	}
	if (inEditable(event.target)) return;
	const onMenu = document.activeElement === document.body || event.target.closest?.(".title");
	if (!onMenu) return;
	if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
		event.preventDefault();
		select(selected + 1, { focus: true });
	} else if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
		event.preventDefault();
		select(selected - 1, { focus: true });
	} else if ((event.key === "Enter" || event.key === " ") && document.activeElement === document.body) {
		event.preventDefault();
		menuItems[selected].click();
	}
});

function hashWindow() {
	const id = decodeURIComponent(location.hash.slice(1));
	return windows.has(id) ? id : "";
}

addEventListener("popstate", () => {
	const id = hashWindow();
	const top = topWindow();
	if (top && top.id !== id && !PRIMARY.includes(top.id)) close(top.id, { restoreFocus: false });
	if (id) open(id, { history: false });
});

function runIntro({ force = false } = {}) {
	clearTimeout(introTimer);
	if (!force && (reduced() || store.get(INTRO_KEY) || hashWindow() || !isDesktop())) {
		finishIntro();
		return;
	}
	if (reduced()) {
		finishIntro();
		return;
	}
	for (const id of PRIMARY) close(id, { restoreFocus: false });
	root.classList.add("intro-run");
	const skip = (event) => {
		if (event.type === "keydown" && ["Shift", "Control", "Alt", "Meta", "Tab"].includes(event.key)) return;
		finishIntro();
	};
	addEventListener("keydown", skip, { once: true });
	addEventListener("pointerdown", skip, { once: true });
	introTimer = setTimeout(() => {
		removeEventListener("keydown", skip);
		removeEventListener("pointerdown", skip);
		finishIntro();
	}, 1500);
}

function finishIntro() {
	clearTimeout(introTimer);
	const playing = root.classList.contains("intro-run");
	root.classList.remove("intro-run");
	store.set(INTRO_KEY, "1");
	if (!isDesktop()) {
		const id = hashWindow();
		if (id && !PRIMARY.includes(id)) open(id, { history: false, focus: false });
		return;
	}
	open("whoami", { focus: false, history: false, animate: playing });
	setTimeout(() => {
		open("awards", { focus: false, history: false, animate: playing });
		const id = hashWindow();
		if (id && !PRIMARY.includes(id)) open(id, { history: false });
	}, playing ? 140 : 0);
}

let parallaxFrame = 0;
addEventListener("pointermove", (event) => {
	if (!isDesktop() || reduced() || parallaxFrame) return;
	parallaxFrame = requestAnimationFrame(() => {
		parallaxFrame = 0;
		root.style.setProperty("--parallax", ((event.clientX / innerWidth) * 2 - 1).toFixed(3));
	});
}, { passive: true });

document.addEventListener("visibilitychange", () => root.classList.toggle("is-paused", document.hidden));

let padFrame = 0;
const padState = {};
function pollPad() {
	padFrame = 0;
	const pad = [...(navigator.getGamepads?.() || [])].find(Boolean);
	if (!pad || !document.hasFocus()) return;
	const pressed = (index) => Boolean(pad.buttons[index]?.pressed);
	const edge = (index) => {
		const now = pressed(index);
		const fired = now && !padState[index];
		padState[index] = now;
		return fired;
	};
	if (edge(12)) select(selected - 1, { focus: true });
	if (edge(13)) select(selected + 1, { focus: true });
	if (edge(0)) {
		if (root.classList.contains("intro-run")) finishIntro();
		else menuItems[selected].click();
	}
	if (edge(1)) {
		const win = topWindow();
		if (win) close(win.id);
	}
	padFrame = requestAnimationFrame(pollPad);
}
addEventListener("gamepadconnected", () => { if (!padFrame) padFrame = requestAnimationFrame(pollPad); });
addEventListener("focus", () => { if (!padFrame && navigator.getGamepads?.().some(Boolean)) padFrame = requestAnimationFrame(pollPad); });

addEventListener("resize", () => {
	if (!isDesktop()) return;
	for (const id of openOrder) {
		const win = windows.get(id);
		moveTo(win, clamp(win.x, 8, innerWidth - win.el.offsetWidth - 8), clamp(win.y, 8, innerHeight - 64));
	}
}, { passive: true });

applyMotion();
motionQuery.addEventListener?.("change", applyMotion);
root.classList.toggle("desktop-mode", desktopQuery.matches);
desktopQuery.addEventListener?.("change", applyMode);
select(0);
runIntro();
