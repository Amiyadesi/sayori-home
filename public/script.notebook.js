const body = document.body;
const root = document.documentElement;

const PATH_LANG = location.pathname.includes('/en/') ? 'en' : 'zh';
const HOME_DATA_URL = `../assets/data/home-${PATH_LANG}.json`;
const TRUTH_DATA_URL = `../assets/data/lines-${PATH_LANG}.json`;

const urlParams = new URLSearchParams(window.location.search);
const musicProviderOverride = urlParams.get('music');

// Region detection: CN users get NetEase, overseas get YouTube
const IS_CN = (() => {
	if (musicProviderOverride === 'netease') return true;
	if (musicProviderOverride === 'youtube') return false;
	try {
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
		return tz.startsWith('Asia/Shanghai') || tz.startsWith('Asia/Chongqing') ||
			tz.startsWith('Asia/Harbin') || tz.startsWith('Asia/Urumqi') ||
			tz === 'PRC' || tz === 'Asia/Taipei' || tz === 'Asia/Hong_Kong' || tz === 'Asia/Macau';
	} catch { return PATH_LANG === 'zh'; }
})();

// Music sources — official OST by Dan Salvato / Team Salvato
let MUSIC = {
	ohayouSayori: {
		youtube: 'BUWuDdfe7v4',
		netease: '523658869',
	},
	yourReality: {
		youtube: 'CAL4WMpBNs0',
		netease: '523658880',
	},
	sayoNara: {
		youtube: 'vkqiC4KPeDs',
		netease: '523658877',
	},
};

const musicBtn = document.querySelector('.music-btn');
const musicPlayer = document.getElementById('music-player');
const musicFrame = document.getElementById('music-frame');
const pianoBtn = document.getElementById('piano-btn');
const pianoPlayer = document.getElementById('piano-player');
const pianoFrame = document.getElementById('piano-frame');
const truthPlayer = document.getElementById('truth-player');
const truthFrame = document.getElementById('truth-frame');
let introOpen = document.getElementById('intro-open');
const introClose = document.getElementById('intro-close');
const introNote = document.getElementById('intro-note');
const introFrame = document.getElementById('intro-video-frame');
let introVideoLink = document.getElementById('intro-video-link');
let aboutOpen = document.getElementById('about-open');
const aboutClose = document.getElementById('about-close');
const profileNote = document.getElementById('profile-note');
let profileEmail = document.getElementById('profile-email');
let servicesOpen = document.getElementById('services-open');
const servicesClose = document.getElementById('services-close');
const servicesNote = document.getElementById('services-note');
let pianoNotesTimer = 0;
const cornerFold = document.querySelector('.corner-fold');
const truthLayer = document.querySelector('.truth-layer');
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const terminalBody = document.getElementById('terminal-body');
const dateDisplay = document.getElementById('date-display');
const weatherDisplay = document.getElementById('weather-display');
const sayoriImg = document.getElementById('sayori-img');
const sayoriDragZone = document.getElementById('sayori-drag-zone');
const sayoriFront = document.querySelector('.sayori-art-front');
const sayoriChibi = document.querySelector('.sayori-art-chibi');
const glitchField = document.querySelector('.glitch-field');
const restoreField = document.querySelector('.restore-field');
const dreamParticles = document.getElementById('dream-particles');
const truthGlitchSlices = document.getElementById('truth-glitch-slices');
const truthCameo = document.getElementById('truth-cameo');
const inkDrops = document.getElementById('ink-drops');
const pencilCanvas = document.getElementById('pencil-canvas');
const stickyNote = document.getElementById('sticky-note');
const stickyText = document.getElementById('sticky-text');
const stickerHeart = document.getElementById('sticker-heart');
const heartBurst = document.getElementById('heart-burst');
const dataStream = document.getElementById('data-stream');
const matrixCanvas = document.getElementById('matrix-canvas');
const terminalWindow = document.getElementById('terminal-window');
const terminalTitle = document.getElementById('terminal-title');
const sideNotesLayer = document.getElementById('side-notes-layer');

const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const coarsePointerQuery = window.matchMedia?.('(pointer: coarse)');

const GENERATED_BASE = '../assets/generated/';
const SAYORI_TERMINAL_IMAGES = [
	GENERATED_BASE + 'terminal-sayori-v2.webp',
	GENERATED_BASE + 'terminal-sayori-full.webp',
	GENERATED_BASE + 'terminal-sayori-wave.webp',
];

function randomFrom(list) {
	return list[Math.floor(Math.random() * list.length)];
}

let ROLE_CAMEOS = {
	sayori: {
		image: SAYORI_TERMINAL_IMAGES,
		label: 'sayori.chr',
		lines: {
			name: ["Hm? You called? I'm right here, you know.", '嗯？叫我了？我就在这里啊。'],
			chr: ["Don't read me as a file... it tickles.", '不要把我当文件来读啦...怪痒的。'],
			delete: ["...please don't. Amiya already locked this one for me.", '...请不要。Amiya 已经帮我把这个锁住了。'],
			just: ['Just Sayori. ...just me is fine, right?', 'Just Sayori。...只有我，也可以的吧？'],
			justDelete: ["No no no, please don't say that again.", '不不不，请不要再说那句话了。'],
			file: ["Reading my file? You won't find much. Just a heartbeat.", '想读我的文件？里面没什么的，只有一点心跳声。'],
		},
	},
	monika: {
		image: GENERATED_BASE + 'terminal-monika.webp',
		label: 'monika.chr',
		lines: {
			name: ["Don't call her. ...she answered from outside the page.", '不要叫她...她从纸的外面回应了。'],
			chr: ["Her file is readable, but it doesn't sit still.", '她的文件能读，但是它不肯安静下来。'],
			delete: ["Someone already tried. It came back rewritten.", '有人已经试过了。回来的时候被改写过了。'],
			just: ['Not here. This desk doesn\'t have that menu.', '这里没有的。这张书桌上没有那个选项。'],
			justDelete: ["...please don't try that again. The page goes weird.", '...请不要再试那个了。纸会变得奇怪。'],
			file: ['Opening her file leaks something into the cursor. Be careful.', '打开她的文件，光标里会漏出一些东西。要小心。'],
		},
	},
	natsuki: {
		image: GENERATED_BASE + 'terminal-natsuki.webp',
		label: 'natsuki.chr',
		lines: {
			name: ["Aw, she snapped shut before I could say hi.", '诶，她在我打招呼之前就啪地合上了。'],
			chr: ['Her file is tiny but really stuffed. ...like a cupcake?', '她的文件小小的，但是塞得满满的。...像纸杯蛋糕？'],
			delete: ['She closed before you could even press it. Phew.', '她在你按下去之前就合上了。还好。'],
			just: ['She glared at me through the screen. I think she\'s mad.', '她隔着屏幕瞪我。我觉得她生气了。'],
			justDelete: ["She bit the lock before it ran. ...don't tease her.", '她把锁咬住了，根本运行不起来。...不要逗她啦。'],
			file: ['Open it carefully. The wrapper crinkles like a manga page.', '小心地打开。包装纸像漫画书一样沙沙响。'],
		},
	},
	yuri: {
		image: GENERATED_BASE + 'terminal-yuri.webp',
		label: 'yuri.chr',
		lines: {
			name: ['She\'s quiet... but the ink isn\'t.', '她很安静...但是墨迹不是。'],
			chr: ['Her file is dense. I had to stop reading partway.', '她的文件好密。我读到一半就停下来了。'],
			delete: ['The page got staticky, but she stayed. Good.', '纸页起了静电，但是她留下来了。太好了。'],
			just: ['When you say that, the cursor starts breathing slower.', '你那样说的时候，光标就开始呼吸变慢了。'],
			justDelete: ["Her ink overflowed and stopped it. ...maybe don't.", '她的墨水溢出来挡住了。...还是不要吧。'],
			file: ['Her file smells like old paper. It\'s actually nice.', '她的文件闻起来像旧纸。其实挺好闻的。'],
		},
	},
};

let GLOBAL_CAMEOS = {
	'act 2': {
		image: GENERATED_BASE + 'terminal-monika.webp',
		label: 'act2.flag',
		tone: 'strong',
		lines: ["...you weren't supposed to bring up that word.", '...你不应该说出那个词的。'],
	},
	chr: {
		image: SAYORI_TERMINAL_IMAGES,
		label: '*.chr',
		tone: 'strong',
		lines: ["Those aren't normal save files. They're us.", '那些不是普通的存档...那些是我们。'],
	},
	file: {
		image: GENERATED_BASE + 'terminal-yuri.webp',
		label: 'file table',
		tone: 'strong',
		lines: ["The file table is messy, but you can still read the four names.", '文件表乱糟糟的，但是那四个名字还能看清。'],
	},
	void: {
		image: GENERATED_BASE + 'terminal-monika.webp',
		label: 'void',
		tone: 'strong',
		lines: ['There\'s text behind the text. ...don\'t read too far.', '文字背后还有文字。...不要看得太深。'],
	},
};

const TRANSITION = {
	collapseMs: 4200,
	restoreMs: 5200,
};
let BILIBILI_URL = 'https://space.bilibili.com/3546919890585725';
let GUESTBOOK_ENDPOINT = 'https://comments.sayori.org/';
let GUESTBOOK_PATH = '/guestbook/';
const SIDE_NOTE_MAX = 4;
const SIDE_NOTE_MOBILE_MAX = 1;
const SIDE_NOTE_MOBILE_QUERY = '(max-width: 900px)';
const SIDE_NOTE_CACHE_KEY = `sayori-side-notes-${PATH_LANG}`;

const STICKY_QUOTES_ZH = [
	'今天也要加油哦。',
	'记得喝水。',
	'你来了呀~',
	'这里是安全的地方。',
	'偶尔休息一下也没关系。',
	'有人在看着这张纸呢。',
	'天气好的话出去走走吧。',
	'不要忘记吃早饭。',
];

const STICKY_QUOTES_EN = [
	'Cheer up today!',
	'Remember to drink water.',
	"You're here~",
	'This is a safe place.',
	"It's okay to rest sometimes.",
	'Someone is reading this paper.',
	'Go for a walk if the weather is nice.',
	"Don't forget breakfast.",
];

let STICKY_QUOTES = PATH_LANG === 'en' ? STICKY_QUOTES_EN : STICKY_QUOTES_ZH;

let currentLayer = 'dream';
let locked = false;
let homeData = null;
let cmdData = null;
let matrixActive = false;
let matrixRaf = 0;
let sideNotePool = [];
const tornSideNoteKeys = new Set();
const surfaceHideJobs = new WeakMap();

initDate();
initWeather();
loadHomeData().finally(() => {
	initDreamInteractions();
	initSideNotes();
});
loadCmdData();
initMotion();

musicBtn?.addEventListener('click', () => toggleMusicPlayer(musicPlayer, musicFrame, MUSIC.ohayouSayori, musicBtn, {
	hidden: true,
	revealOnRepeat: true,
}));
pianoBtn?.addEventListener('click', () => toggleMusicPlayer(pianoPlayer, pianoFrame, MUSIC.yourReality, pianoBtn, {
	hidden: true,
	revealOnRepeat: true,
	notes: true,
}));
bindSurfaceHandlers();
introClose?.addEventListener('click', () => closeIntroNote());
aboutClose?.addEventListener('click', () => closeProfileNote());
servicesClose?.addEventListener('click', () => closeServicesNote());
document.addEventListener('pointerdown', (e) => {
	const activeNote = getActiveSurfaceNote();
	if (!activeNote) return;
	if (activeNote.note.contains(e.target)) return;
	if (activeNote.openButton?.contains?.(e.target)) return;
	activeNote.close({ restoreFocus: false });
});

// Sayori sticker: only the visible drawing area should start a drag.
(() => {
	if (!sayoriImg || !sayoriDragZone) return;
	let dragging = false;
	let startX = 0, startY = 0, origLeft = 0, origTop = 0;

	const startDrag = (e) => {
		if (currentLayer !== 'dream') return;
		dragging = true;
		sayoriImg.classList.add('is-dragging');
		try {
			sayoriDragZone.setPointerCapture?.(e.pointerId);
		} catch {
			// Some synthetic or older pointer paths cannot be captured; document listeners still finish the drag.
		}
		const rect = sayoriImg.getBoundingClientRect();
		const parentRect = sayoriImg.offsetParent.getBoundingClientRect();
		origLeft = rect.left - parentRect.left;
		origTop = rect.top - parentRect.top;
		startX = e.clientX;
		startY = e.clientY;
		e.preventDefault();
	};

	const moveDrag = (e) => {
		if (!dragging) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		sayoriImg.style.left = `${origLeft + dx}px`;
		sayoriImg.style.top = `${origTop + dy}px`;
		sayoriImg.style.right = 'auto';
		sayoriImg.style.bottom = 'auto';
	};

	const stopDrag = () => {
		if (!dragging) return;
		dragging = false;
		sayoriImg.classList.remove('is-dragging');
	};

	sayoriDragZone.addEventListener('pointerdown', startDrag);
	sayoriDragZone.addEventListener('pointercancel', stopDrag);
	document.addEventListener('pointermove', moveDrag);
	document.addEventListener('pointerup', stopDrag);
	document.addEventListener('pointercancel', stopDrag);
})();

cornerFold?.addEventListener('click', () => {
	if (locked || currentLayer !== 'dream') return;
	collapseToTruth();
});

terminalInput?.addEventListener('keydown', (e) => {
	if (e.key !== 'Enter') return;
	const raw = terminalInput.value.trim();
	terminalInput.value = '';
	if (!raw) return;
	handleCommand(raw);
});

document.addEventListener('keydown', (e) => {
	if (currentLayer !== 'truth') return;
	if (document.activeElement !== terminalInput && terminalInput && !locked) {
		if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
			terminalInput.focus();
		}
	}
});

truthLayer?.addEventListener('click', (e) => {
	if (currentLayer !== 'truth') return;
	const tag = (e.target?.tagName || '').toLowerCase();
	if (tag === 'button' || tag === 'a' || tag === 'input' || tag === 'iframe') return;
	if (e.target?.closest?.('.music-panel')) return;
	terminalInput?.focus();
});

terminalWindow?.querySelector('.dot-close')?.addEventListener('click', () => {
	if (locked || currentLayer !== 'truth') return;
	appendOutput(cmdData?.terminal?.closeMessage || (PATH_LANG === 'en' ? 'Closing terminal...' : '正在关闭终端...'), 'muted');
	setTimeout(restoreDream, 600);
});

terminalWindow?.querySelector('.dot-minimize')?.addEventListener('click', () => {
	if (locked || currentLayer !== 'truth') return;
	terminalWindow.classList.add('is-minimized');
	setTimeout(() => {
		terminalWindow.classList.remove('is-minimized');
		restoreDream();
	}, 700);
});

initTerminalDrag();
initializeSurfaceNoteState();

// ========== AUDIO CONTEXT (for Web Audio transition SFX) ==========

let audioCtx = null;
function getAudioCtx() {
	if (!audioCtx) {
		try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
	}
	if (audioCtx?.state === 'suspended') audioCtx.resume();
	return audioCtx;
}

function playGlitchSfx(durationMs) {
	const ctx = getAudioCtx();
	if (!ctx) return;
	const duration = Math.min(durationMs / 1000, 5);
	const now = ctx.currentTime;

	const bufferSize = Math.floor(ctx.sampleRate * duration);
	const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
	const data = noiseBuffer.getChannelData(0);
	for (let i = 0; i < bufferSize; i += 1) data[i] = Math.random() * 2 - 1;
	const noise = ctx.createBufferSource();
	noise.buffer = noiseBuffer;

	const filter = ctx.createBiquadFilter();
	filter.type = 'bandpass';
	filter.frequency.setValueAtTime(2200, now);
	filter.frequency.exponentialRampToValueAtTime(140, now + duration);
	filter.Q.value = 4;

	const gain = ctx.createGain();
	gain.gain.setValueAtTime(0, now);
	gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
	gain.gain.linearRampToValueAtTime(0.12, now + duration * 0.5);
	gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

	noise.connect(filter);
	filter.connect(gain);
	gain.connect(ctx.destination);
	noise.start(now);
	noise.stop(now + duration);

	const rumble = ctx.createOscillator();
	rumble.type = 'sawtooth';
	rumble.frequency.setValueAtTime(70, now);
	rumble.frequency.linearRampToValueAtTime(38, now + duration);
	const rumbleGain = ctx.createGain();
	rumbleGain.gain.setValueAtTime(0.07, now);
	rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
	rumble.connect(rumbleGain);
	rumbleGain.connect(ctx.destination);
	rumble.start(now);
	rumble.stop(now + duration);
}

function playRestoreSfx(durationMs) {
	const ctx = getAudioCtx();
	if (!ctx) return;
	const duration = Math.min(durationMs / 1000, 6);
	const now = ctx.currentTime;
	[330, 440, 660].forEach((freq, i) => {
		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.setValueAtTime(freq, now);
		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0, now + i * 0.18);
		gain.gain.linearRampToValueAtTime(0.07, now + i * 0.18 + 0.25);
		gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now + i * 0.18);
		osc.stop(now + duration);
	});
}

// ========== MUSIC PLAYER (region-aware) ==========

function buildPlayerSrc(track) {
	if (IS_CN && track.netease) {
		return `https://music.163.com/outchain/player?type=2&id=${track.netease}&auto=1&height=66`;
	}
	if (track.youtube) {
		const origin = encodeURIComponent(location.origin);
		return `https://www.youtube-nocookie.com/embed/${track.youtube}?autoplay=1&playsinline=1&enablejsapi=1&origin=${origin}&rel=0&modestbranding=1`;
	}
	return '';
}

function isPlayerHidden(playerEl) {
	return playerEl?.classList.contains('is-hidden-player');
}

function toggleMusicPlayer(playerEl, frameEl, track, btn, opts = {}) {
	if (!playerEl || !frameEl || !track) return;
	const isOpen = playerEl.classList.contains('is-open');
	if (isOpen) {
		if (opts.revealOnRepeat && isPlayerHidden(playerEl)) {
			revealMusicPlayer(playerEl, btn);
			return;
		}
		closeMusicPlayer(playerEl, frameEl, btn);
		return;
	}
	if (!opts.keepOthers) closeOtherPlayers(playerEl);
	const src = buildPlayerSrc(track);
	if (!src) return;
	playerEl.classList.toggle('is-netease', IS_CN && Boolean(track.netease));
	playerEl.classList.toggle('is-hidden-player', opts.hidden === true);
	playerEl.dataset.provider = IS_CN && track.netease ? 'netease' : 'youtube';
	frameEl.allow = 'autoplay; encrypted-media';
	frameEl.src = src;
	playerEl.hidden = false;
	if (opts.hidden) {
		playerEl.setAttribute('inert', '');
	} else {
		playerEl.removeAttribute('inert');
	}
	playerEl.classList.add('is-open');
	btn?.classList.add('is-playing');
	if (opts.notes) startPianoNotes();
	if (opts.hidden) announceHiddenPlayer(btn);
	if (opts.autoRevealDelayMs) {
		window.setTimeout(() => {
			if (playerEl.classList.contains('is-open') && isPlayerHidden(playerEl)) revealMusicPlayer(playerEl, btn);
		}, opts.autoRevealDelayMs);
	}
}

function revealMusicPlayer(playerEl, btn) {
	playerEl.classList.remove('is-hidden-player');
	playerEl.removeAttribute('inert');
	btn?.classList.add('is-player-visible');
	if (btn === pianoBtn) stopPianoNotes();
}

function closeMusicPlayer(playerEl, frameEl, btn) {
	if (!playerEl || !frameEl) return;
	if (playerEl.classList.contains('is-open')) {
		playerEl.classList.remove('is-open');
		frameEl.src = 'about:blank';
		playerEl.hidden = true;
		playerEl.setAttribute('inert', '');
		btn?.classList.remove('is-playing');
		btn?.classList.remove('is-player-visible');
		playerEl.classList.remove('is-hidden-player');
		if (btn === pianoBtn) stopPianoNotes();
	}
}

function closeOtherPlayers(except) {
	if (musicPlayer && musicPlayer !== except) closeMusicPlayer(musicPlayer, musicFrame, musicBtn);
	if (pianoPlayer && pianoPlayer !== except) closeMusicPlayer(pianoPlayer, pianoFrame, pianoBtn);
}

function closeAllMusic() {
	closeMusicPlayer(musicPlayer, musicFrame, musicBtn);
	closeMusicPlayer(pianoPlayer, pianoFrame, pianoBtn);
	closeMusicPlayer(truthPlayer, truthFrame);
}

function startTruthMusic() {
	toggleMusicPlayer(truthPlayer, truthFrame, MUSIC.sayoNara, null, { hidden: true, keepOthers: true });
}

function stopTruthMusic() {
	closeMusicPlayer(truthPlayer, truthFrame);
}

function announceHiddenPlayer(btn) {
	if (!btn) return;
	btn.classList.add('is-hidden-audio');
	window.setTimeout(() => btn.classList.remove('is-hidden-audio'), 1500);
}

function startPianoNotes() {
	if (!pianoBtn || prefersReducedMotion()) return;
	spawnPianoNote();
	window.clearInterval(pianoNotesTimer);
	pianoNotesTimer = window.setInterval(spawnPianoNote, 520);
}

function stopPianoNotes() {
	window.clearInterval(pianoNotesTimer);
	pianoNotesTimer = 0;
}

function spawnPianoNote() {
	if (!pianoBtn || !pianoBtn.classList.contains('is-playing')) return;
	const note = document.createElement('span');
	const symbols = ['♪', '♫', '♬', '♩'];
	note.className = 'floating-note';
	note.textContent = symbols[Math.floor(Math.random() * symbols.length)];
	note.style.setProperty('--note-x', `${((Math.random() - 0.5) * 56).toFixed(1)}px`);
	note.style.setProperty('--note-y', `${(-58 - Math.random() * 58).toFixed(1)}px`);
	note.style.setProperty('--note-r', `${((Math.random() - 0.5) * 38).toFixed(0)}deg`);
	note.style.setProperty('--note-s', `${(0.85 + Math.random() * 0.45).toFixed(2)}`);
	note.style.setProperty('--note-delay', `${(Math.random() * 0.1).toFixed(2)}s`);
	pianoBtn.append(note);
	setTimeout(() => note.remove(), 1500);
}

// ========== OBSIDIAN-MANAGED SURFACE ==========

async function loadHomeData() {
	try {
		const res = await fetch(HOME_DATA_URL, { cache: 'no-cache' });
		if (!res.ok) return;
		homeData = await res.json();
		applyHomeData(homeData);
	} catch (error) {
		console.info('[home-config] skipped');
	}
}

function applyHomeData(config) {
	if (!config || typeof config !== 'object') return;
	applyMetaConfig(config.meta);
	applyMusicConfig(config.music);
	applyLinkConfig(config.links);
	applySurfaceConfig(config.surface);
	applyIntroConfig(config.intro);
	applyProfileConfig(config.profile);
	applyServicesConfig(config.services);
	bindSurfaceHandlers();
}

function applyMetaConfig(meta) {
	if (!meta || typeof meta !== 'object') return;
	if (typeof meta.title === 'string' && meta.title.trim()) document.title = meta.title;
	setMeta('description', meta.description);
	setMeta('theme-color', meta.themeColor, 'name');
}

function setMeta(key, value, attr = 'name') {
	if (typeof value !== 'string' || !value.trim()) return;
	let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
	if (!tag) {
		tag = document.createElement('meta');
		tag.setAttribute(attr, key);
		document.head.append(tag);
	}
	tag.setAttribute('content', value);
}

function applyMusicConfig(music) {
	if (!music || typeof music !== 'object') return;
	if (isPlainObject(music.tracks)) {
		MUSIC = mergePlain(MUSIC, music.tracks);
	}
	setText(document.querySelector('.music-label'), music.buttonLabel);
	setAttr(musicBtn, 'aria-label', music.ariaLabel);
	setAttr(pianoBtn, 'aria-label', music.pianoAriaLabel);
}

function applyLinkConfig(links) {
	if (!links || typeof links !== 'object') return;
	if (typeof links.bilibili === 'string' && links.bilibili.trim()) BILIBILI_URL = links.bilibili;
	if (typeof links.guestbookEndpoint === 'string' && links.guestbookEndpoint.trim()) GUESTBOOK_ENDPOINT = links.guestbookEndpoint;
	if (typeof links.guestbookPath === 'string' && links.guestbookPath.trim()) GUESTBOOK_PATH = links.guestbookPath;
}

function applySurfaceConfig(surface) {
	if (!surface || typeof surface !== 'object') return;
	setText(document.querySelector('.title-text'), surface.title);
	setText(document.querySelector('.margin-text'), surface.marginNote);
	setText(document.querySelector('.fan-notice'), surface.footerNotice);
	setText(document.querySelector('.fold-hint'), surface.foldHint);
	setAttr(cornerFold, 'aria-label', surface.foldAriaLabel);
	setAttr(stickerHeart, 'aria-label', surface.heartAriaLabel);
	if (Array.isArray(surface.stickyQuotes) && surface.stickyQuotes.length) {
		STICKY_QUOTES = surface.stickyQuotes.filter((item) => typeof item === 'string' && item.trim());
	}
	renderEntries(surface.entries, surface.entryAriaLabel);
	renderPageVersion(surface.languageLink, surface.version);
	if (stickyText && STICKY_QUOTES.length) {
		renderMarkdownInto(stickyText, randomFrom(STICKY_QUOTES));
	}
}

function renderEntries(entries, ariaLabel) {
	const nav = document.querySelector('.entries');
	if (!nav || !Array.isArray(entries) || !entries.length) return;
	nav.replaceChildren();
	if (typeof ariaLabel === 'string' && ariaLabel.trim()) nav.setAttribute('aria-label', ariaLabel);
	for (const entry of entries) {
		const node = createEntryNode(entry);
		if (node) nav.append(node);
	}
	aboutOpen = document.getElementById('about-open');
	servicesOpen = document.getElementById('services-open');
	introOpen = document.getElementById('intro-open');
	bindSurfaceHandlers();
}

function createEntryNode(entry) {
	if (!entry || typeof entry !== 'object') return null;
	const isButton = entry.action === 'intro' || entry.action === 'about' || entry.action === 'services';
	const node = isButton ? document.createElement('button') : document.createElement('a');
	node.className = 'entry';
	if (isButton) {
		node.type = 'button';
		const actionMap = {
			intro: ['intro-entry', 'intro-open', 'intro-note'],
			about: ['about-entry', 'about-open', 'profile-note'],
			services: ['services-entry', 'services-open', 'services-note'],
		};
		const [className, id, controls] = actionMap[entry.action] || actionMap.about;
		node.classList.add('entry-button', className);
		node.id = id;
		node.setAttribute('aria-controls', controls);
		node.setAttribute('aria-expanded', 'false');
	} else {
		node.href = safeHref(entry.href);
		if (entry.external) {
			node.target = '_blank';
			node.rel = 'noopener';
		}
	}

	const num = document.createElement('span');
	num.className = 'entry-num';
	num.textContent = entry.num || '';
	const bodyEl = document.createElement('span');
	bodyEl.className = 'entry-body';
	const title = document.createElement('span');
	title.className = 'entry-title';
	title.textContent = entry.title || '';
	const desc = document.createElement('span');
	desc.className = 'entry-desc';
	desc.textContent = entry.desc || '';
	bodyEl.append(title, desc);
	const arrow = document.createElement('span');
	arrow.className = 'entry-arrow';
	arrow.setAttribute('aria-hidden', 'true');
	arrow.textContent = isButton ? '↓' : '→';
	const underline = document.createElement('span');
	underline.className = 'entry-underline';
	underline.setAttribute('aria-hidden', 'true');
	node.append(num, bodyEl, arrow, underline);
	return node;
}

function renderPageVersion(languageLink, version) {
	const wrap = document.querySelector('.page-ver');
	if (!wrap) return;
	wrap.replaceChildren();
	if (languageLink?.href && languageLink?.label) {
		const link = document.createElement('a');
		link.href = safeHref(languageLink.href);
		link.style.color = 'inherit';
		link.style.opacity = '0.7';
		link.textContent = languageLink.label;
		wrap.append(link);
	}
	if (version) {
		if (wrap.childNodes.length) wrap.append(' · ');
		wrap.append(version);
	}
}

function applyIntroConfig(intro) {
	if (!intro || typeof intro !== 'object' || !introNote) return;
	setAttr(introNote, 'aria-label', intro.ariaLabel);
	setText(introNote.querySelector('.profile-back'), intro.backLabel);
	setAttr(introNote.querySelector('.profile-back'), 'aria-label', intro.backAriaLabel);
	setText(introNote.querySelector('.intro-head .profile-kicker'), intro.kicker);
	setText(introNote.querySelector('.intro-head h2'), intro.title);
	setText(introNote.querySelector('.intro-head p:not(.profile-kicker)'), intro.intro);
	setAttr(introFrame, 'title', intro.videoTitle);
	setAttr(introFrame, 'data-src', intro.embedUrl);
	introVideoLink = document.getElementById('intro-video-link');
	if (introVideoLink) {
		introVideoLink.href = safeHref(intro.videoUrl);
		setText(introVideoLink, intro.openLabel);
	}
}

function applyProfileConfig(profile) {
	if (!profile || typeof profile !== 'object' || !profileNote) return;
	setAttr(profileNote, 'aria-label', profile.ariaLabel);
	setText(profileNote.querySelector('.profile-back'), profile.backLabel);
	setAttr(profileNote.querySelector('.profile-back'), 'aria-label', profile.backAriaLabel);
	setText(profileNote.querySelector('.profile-kicker'), profile.kicker);
	setText(profileNote.querySelector('.profile-head h2'), profile.name);
	setText(profileNote.querySelector('.profile-head p:not(.profile-kicker)'), profile.intro);
	renderProfileColumns(profile.columns);
	renderChipList(profileNote.querySelector('.profile-learning'), profile.learning);
	renderProfileFaq(profile.faq);
	renderProfileContact(profile.contact);
}

function renderProfileColumns(columns) {
	const wrap = profileNote?.querySelector('.profile-columns');
	if (!wrap || !Array.isArray(columns) || !columns.length) return;
	wrap.replaceChildren();
	for (const column of columns) {
		const block = document.createElement('div');
		block.className = 'profile-block';
		const title = document.createElement('h3');
		title.textContent = column?.title || '';
		const list = document.createElement('ul');
		for (const item of Array.isArray(column?.items) ? column.items : []) {
			const li = document.createElement('li');
			appendRichText(li, item);
			list.append(li);
		}
		block.append(title, list);
		wrap.append(block);
	}
}

function appendRichText(parent, item) {
	if (typeof item === 'string') {
		parent.textContent = item;
		return;
	}
	if (!item || typeof item !== 'object') return;
	const text = String(item.text || '');
	const links = Array.isArray(item.links) ? item.links : [];
	if (!links.length) {
		parent.textContent = text;
		return;
	}

	let cursor = 0;
	for (const linkDef of links) {
		const label = String(linkDef?.label || '');
		const idx = label ? text.indexOf(label, cursor) : -1;
		if (idx < 0) continue;
		parent.append(text.slice(cursor, idx));
		const link = document.createElement('a');
		link.href = safeHref(linkDef.href);
		link.target = '_blank';
		link.rel = 'noopener';
		link.textContent = label;
		parent.append(link);
		cursor = idx + label.length;
	}
	parent.append(text.slice(cursor));
}

function renderChipList(wrap, items) {
	if (!wrap || !Array.isArray(items)) return;
	wrap.replaceChildren();
	for (const item of items) {
		if (typeof item !== 'string' || !item.trim()) continue;
		const chip = document.createElement('span');
		chip.textContent = item;
		wrap.append(chip);
	}
}

function renderProfileFaq(faq) {
	const wrap = profileNote?.querySelector('.profile-faq');
	if (!wrap || !faq || typeof faq !== 'object') return;
	const items = Array.isArray(faq.items) ? faq.items : [];
	if (!items.length) {
		wrap.hidden = true;
		return;
	}
	wrap.hidden = false;
	wrap.replaceChildren();
	const title = document.createElement('h3');
	title.textContent = faq.title || '';
	wrap.append(title);
	for (const item of items) {
		if (!item?.question || !item?.answer) continue;
		const details = document.createElement('details');
		const summary = document.createElement('summary');
		const answer = document.createElement('p');
		summary.textContent = item.question;
		answer.textContent = item.answer;
		details.append(summary, answer);
		wrap.append(details);
	}
}

function renderProfileContact(contact) {
	if (!contact || typeof contact !== 'object') return;
	profileEmail = document.getElementById('profile-email');
	if (contact.email && profileEmail) {
		profileEmail.href = `mailto:${contact.email}`;
		profileEmail.dataset.email = contact.email;
		profileEmail.textContent = contact.email;
	}
	const linksWrap = profileNote?.querySelector('.profile-links');
	if (linksWrap && Array.isArray(contact.links)) {
		linksWrap.replaceChildren();
		setAttr(linksWrap, 'aria-label', contact.linksAriaLabel);
		for (const item of contact.links) {
			if (!item?.href || !item?.label) continue;
			const link = document.createElement('a');
			link.href = safeHref(item.href);
			link.target = '_blank';
			link.rel = 'noopener';
			link.textContent = item.label;
			linksWrap.append(link);
		}
	}
}

function applyServicesConfig(services) {
	if (!services || typeof services !== 'object' || !servicesNote) return;
	setAttr(servicesNote, 'aria-label', services.ariaLabel);
	setText(servicesNote.querySelector('.profile-back'), services.backLabel);
	setAttr(servicesNote.querySelector('.profile-back'), 'aria-label', services.backAriaLabel);
	setText(servicesNote.querySelector('.services-head .profile-kicker'), services.kicker);
	setText(servicesNote.querySelector('.services-head h2'), services.title);
	setText(servicesNote.querySelector('.services-head p:not(.profile-kicker)'), services.intro);
	renderServicesBoard(services.items);
	setText(servicesNote.querySelector('.services-footnote'), services.footnote);
}

function renderServicesBoard(items) {
	const wrap = servicesNote?.querySelector('.services-board');
	if (!wrap || !Array.isArray(items) || !items.length) return;
	wrap.replaceChildren();
	for (const item of items) {
		if (!item?.href) continue;
		const link = document.createElement('a');
		link.className = 'service-note service-note-large';
		link.href = safeHref(item.href);
		link.target = '_blank';
		link.rel = 'noopener';
		const index = document.createElement('span');
		index.className = 'service-index';
		index.textContent = item.index || '';
		const title = document.createElement('strong');
		title.textContent = item.title || '';
		const desc = document.createElement('em');
		desc.textContent = item.desc || '';
		link.append(index, title, desc);
		wrap.append(link);
	}
}

function bindSurfaceHandlers() {
	introOpen = document.getElementById('intro-open');
	aboutOpen = document.getElementById('about-open');
	servicesOpen = document.getElementById('services-open');
	profileEmail = document.getElementById('profile-email');
	if (introOpen) introOpen.onclick = () => openIntroNote();
	if (aboutOpen) aboutOpen.onclick = () => openProfileNote();
	if (servicesOpen) servicesOpen.onclick = () => openServicesNote();
	if (profileEmail) profileEmail.onclick = (e) => {
		e.preventDefault();
		copyText(profileEmail.dataset.email || profileEmail.textContent.trim(), profileEmail);
	};
}

function setText(node, value) {
	if (!node || typeof value !== 'string') return;
	node.textContent = value;
}

function setAttr(node, attr, value) {
	if (!node || typeof value !== 'string' || !value.trim()) return;
	node.setAttribute(attr, value);
}

function safeHref(value) {
	if (typeof value !== 'string' || !value.trim()) return '#';
	const trimmed = value.trim();
	if (/^(https?:|mailto:|\/|\.\/|\.\.\/|#)/i.test(trimmed)) return trimmed;
	return '#';
}

function parseTerminalUrl(value) {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed || trimmed.startsWith('/') || /\s/.test(trimmed)) return null;

	let candidate = trimmed;
	const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(candidate);
	if (hasScheme && !/^https?:\/\//i.test(candidate)) return null;
	if (!hasScheme) {
		if (!/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d{2,5})?(?:[/?#].*)?$/i.test(candidate)) return null;
		candidate = `https://${candidate}`;
	}

	try {
		const parsed = new URL(candidate);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
		if (!parsed.hostname || !parsed.hostname.includes('.')) return null;
		return parsed.href;
	} catch {
		return null;
	}
}

function isPlainObject(value) {
	return value && typeof value === 'object' && !Array.isArray(value);
}

function mergePlain(base, override) {
	const result = { ...base };
	for (const [key, value] of Object.entries(override)) {
		if (isPlainObject(value) && isPlainObject(base[key])) {
			result[key] = { ...base[key], ...value };
		} else {
			result[key] = value;
		}
	}
	return result;
}

function openIntroNote() {
	if (!introNote || currentLayer !== 'dream') return;
	closeProfileNote({ restoreFocus: false });
	closeServicesNote({ restoreFocus: false });
	showSurfaceNote(introNote, 'intro-open');
	introOpen?.setAttribute('aria-expanded', 'true');
	if (introFrame && (!introFrame.src || introFrame.src === 'about:blank')) introFrame.src = introFrame.dataset.src || '';
	window.setTimeout(() => introNote.querySelector('.profile-back')?.focus({ preventScroll: true }), 380);
}

function closeIntroNote(opts = {}) {
	if (!introNote) return;
	hideSurfaceNote(introNote, 'intro-open');
	introOpen?.setAttribute('aria-expanded', 'false');
	if (introFrame) introFrame.src = 'about:blank';
	if (opts.restoreFocus !== false) introOpen?.focus({ preventScroll: true });
}

function openProfileNote() {
	if (!profileNote || currentLayer !== 'dream') return;
	closeIntroNote({ restoreFocus: false });
	closeServicesNote({ restoreFocus: false });
	showSurfaceNote(profileNote, 'profile-open');
	aboutOpen?.setAttribute('aria-expanded', 'true');
	window.setTimeout(() => profileNote.querySelector('.profile-back')?.focus({ preventScroll: true }), 380);
}

function closeProfileNote(opts = {}) {
	if (!profileNote) return;
	hideSurfaceNote(profileNote, 'profile-open');
	aboutOpen?.setAttribute('aria-expanded', 'false');
	if (opts.restoreFocus !== false) aboutOpen?.focus({ preventScroll: true });
}

function openServicesNote() {
	if (!servicesNote || currentLayer !== 'dream') return;
	closeIntroNote({ restoreFocus: false });
	closeProfileNote({ restoreFocus: false });
	showSurfaceNote(servicesNote, 'services-open');
	servicesOpen?.setAttribute('aria-expanded', 'true');
	window.setTimeout(() => servicesNote.querySelector('.profile-back')?.focus({ preventScroll: true }), 380);
}

function closeServicesNote(opts = {}) {
	if (!servicesNote) return;
	hideSurfaceNote(servicesNote, 'services-open');
	servicesOpen?.setAttribute('aria-expanded', 'false');
	if (opts.restoreFocus !== false) servicesOpen?.focus({ preventScroll: true });
}

function initializeSurfaceNoteState() {
	[introNote, profileNote, servicesNote].forEach((note) => setSurfaceNoteVisible(note, false));
}

function setSurfaceNoteVisible(note, visible) {
	if (!note) return;
	note.hidden = !visible;
	if (visible) {
		note.removeAttribute('inert');
	} else {
		note.setAttribute('inert', '');
	}
}

function showSurfaceNote(note, openClass) {
	if (!note) return;
	const pending = surfaceHideJobs.get(note);
	if (pending) {
		window.clearTimeout(pending.timer);
		surfaceHideJobs.delete(note);
	}
	note.hidden = false;
	note.removeAttribute('inert');
	// Let the closed transform/opacity apply before adding the open class.
	note.getBoundingClientRect();
	body.classList.add(openClass);
}

function hideSurfaceNote(note, openClass) {
	if (!note) return;
	body.classList.remove(openClass);
	note.setAttribute('inert', '');
	if (note.hidden) return;
	const token = Symbol(openClass);
	const finish = () => {
		if (surfaceHideJobs.get(note)?.token !== token) return;
		note.hidden = true;
		surfaceHideJobs.delete(note);
	};
	const timer = window.setTimeout(finish, 720);
	surfaceHideJobs.set(note, { timer, token });
	note.addEventListener('transitionend', (event) => {
		if (event.target !== note || event.propertyName !== 'transform') return;
		window.clearTimeout(timer);
		finish();
	}, { once: true });
}

function getActiveSurfaceNote() {
	if (body.classList.contains('intro-open') && introNote) {
		return { note: introNote, openButton: introOpen, close: closeIntroNote };
	}
	if (body.classList.contains('profile-open') && profileNote) {
		return { note: profileNote, openButton: aboutOpen, close: closeProfileNote };
	}
	if (body.classList.contains('services-open') && servicesNote) {
		return { note: servicesNote, openButton: servicesOpen, close: closeServicesNote };
	}
	return null;
}

function copyText(text, target) {
	if (!text) return;
	navigator.clipboard?.writeText(text).then(() => {
		target?.classList.add('is-copied');
		window.setTimeout(() => target?.classList.remove('is-copied'), 1600);
	});
}


// ========== COLLAPSE / RESTORE ==========

async function collapseToTruth() {
	locked = true;
	currentLayer = 'transition';
	closeIntroNote({ restoreFocus: false });
	closeProfileNote();
	closeServicesNote({ restoreFocus: false });
	closeAllMusic();
	startTruthMusic();

	const durMs = TRANSITION.collapseMs;
	setCssTimeMs('--collapse-ms', durMs);
	setCssTimeMs('--glitch-ms', Math.round(durMs * 0.6));
	playGlitchSfx(durMs);

	body.classList.add('is-collapsing', 'is-shaking');
	spawnGlitchBits(180, durMs);

	setTimeout(() => body.classList.remove('is-shaking'), 420);
	setTimeout(() => spawnSecondShake(), Math.round(durMs * 0.45));
	setTimeout(() => spawnSecondShake(), Math.round(durMs * 0.75));

	setTimeout(() => {
		truthLayer?.removeAttribute('hidden');
		requestAnimationFrame(() => {
			body.classList.add('is-truth');
			body.classList.remove('is-collapsing');
			currentLayer = 'truth';
			locked = false;
			glitchField?.replaceChildren();
			initTerminal();
			spawnDataStream();
		});
	}, durMs);
}

async function restoreDream() {
	if (locked || currentLayer !== 'truth') return;
	locked = true;
	currentLayer = 'transition';
	stopMatrix();
	stopTruthMusic();

	const durMs = TRANSITION.restoreMs;
	setCssTimeMs('--restore-ms', durMs);
	playRestoreSfx(durMs);

	body.classList.add('is-restoring');
	body.classList.remove('is-truth');
	body.className = body.className.replace(/theme-\w+/g, '').trim();
	spawnPaperShards(90, durMs);

	setTimeout(() => {
		body.classList.remove('is-restoring');
		truthLayer?.setAttribute('hidden', '');
		restoreField?.querySelectorAll('.paper-shard').forEach((n) => n.remove());
		dataStream?.replaceChildren();
		resetTerminalPosition();
		currentLayer = 'dream';
		locked = false;
	}, durMs);
}

function spawnSecondShake() {
	body.classList.add('is-shaking');
	setTimeout(() => body.classList.remove('is-shaking'), 360);
}

function spawnGlitchBits(count, totalMs) {
	if (!glitchField) return;
	glitchField.replaceChildren();
	const colors = ['#ffffff', '#ff4f86', '#75e7ff', '#9dffbd', '#ffd278', '#11161c'];
	const frag = document.createDocumentFragment();
	for (let i = 0; i < count; i += 1) {
		const bit = document.createElement('i');
		bit.className = 'glitch-bit';
		bit.style.setProperty('--x', `${Math.random() * 100}%`);
		bit.style.setProperty('--y', `${Math.random() * 100}%`);
		bit.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}rem`);
		bit.style.setProperty('--dy', `${(Math.random() - 0.5) * 40}rem`);
		bit.style.setProperty('--s', `${Math.random() * 0.9 + 0.22}rem`);
		bit.style.setProperty('--d', `${Math.random() * (totalMs * 0.4) / 1000}s`);
		bit.style.setProperty('--c', colors[i % colors.length]);
		frag.append(bit);
	}
	glitchField.append(frag);
	setTimeout(() => glitchField.replaceChildren(), totalMs + 400);
}

function spawnPaperShards(count, totalMs) {
	if (!restoreField) return;
	restoreField.querySelectorAll('.paper-shard').forEach((n) => n.remove());
	const frag = document.createDocumentFragment();
	for (let i = 0; i < count; i += 1) {
		const shard = document.createElement('i');
		shard.className = 'paper-shard';
		const angle = Math.random() * Math.PI * 2;
		const dist = 40 + Math.random() * 50;
		const sx = Math.cos(angle) * dist;
		const sy = Math.sin(angle) * dist;
		const w = 0.6 + Math.random() * 2.4;
		const h = 0.2 + Math.random() * 0.7;
		const rot = (Math.random() - 0.5) * 240;
		shard.style.setProperty('--sx', `${sx.toFixed(2)}vmax`);
		shard.style.setProperty('--sy', `${sy.toFixed(2)}vmax`);
		shard.style.setProperty('--sr', `${rot.toFixed(0)}deg`);
		shard.style.setProperty('--sx-soft', `${(sx * 0.15).toFixed(2)}vmax`);
		shard.style.setProperty('--sy-soft', `${(sy * 0.15).toFixed(2)}vmax`);
		shard.style.setProperty('--sr-soft', `${(rot * 0.2).toFixed(0)}deg`);
		shard.style.setProperty('--ss', `${(0.7 + Math.random() * 0.6).toFixed(2)}`);
		shard.style.setProperty('--d', `${(Math.random() * 0.4).toFixed(2)}s`);
		shard.style.width = `${w.toFixed(2)}rem`;
		shard.style.height = `${h.toFixed(2)}rem`;
		shard.style.marginLeft = `${-w / 2}rem`;
		shard.style.marginTop = `${-h / 2}rem`;
		frag.append(shard);
	}
	restoreField.append(frag);
}

// ========== MOTION / PARTICLES ==========

function initMotion() {
	spawnDreamParticles();
	spawnTruthSlices();
	initParallax();
	spawnInkDrops();
}

function prefersReducedMotion() {
	return reduceMotionQuery?.matches === true;
}

function spawnDreamParticles() {
	if (!dreamParticles || prefersReducedMotion()) return;
	const count = coarsePointerQuery?.matches ? 14 : 26;
	const frag = document.createDocumentFragment();
	for (let i = 0; i < count; i += 1) {
		const dot = document.createElement('i');
		const opacity = 0.16 + Math.random() * 0.22;
		dot.className = 'dream-dot';
		dot.style.setProperty('--x', `${(Math.random() * 100).toFixed(2)}%`);
		dot.style.setProperty('--y', `${(Math.random() * 100).toFixed(2)}%`);
		dot.style.setProperty('--s', `${(0.45 + Math.random() * 0.95).toFixed(2)}rem`);
		dot.style.setProperty('--o', opacity.toFixed(2));
		dot.style.setProperty('--o-low', (opacity * 0.72).toFixed(2));
		dot.style.setProperty('--dx', `${((Math.random() - 0.5) * 4.2).toFixed(2)}rem`);
		dot.style.setProperty('--dy', `${(-1.6 - Math.random() * 3.8).toFixed(2)}rem`);
		dot.style.setProperty('--rot', `${((Math.random() - 0.5) * 90).toFixed(0)}deg`);
		dot.style.setProperty('--dur', `${(12 + Math.random() * 16).toFixed(2)}s`);
		dot.style.setProperty('--delay', `${(-Math.random() * 18).toFixed(2)}s`);
		frag.append(dot);
	}
	dreamParticles.replaceChildren(frag);
}

function spawnTruthSlices() {
	if (!truthGlitchSlices || prefersReducedMotion()) return;
	const count = coarsePointerQuery?.matches ? 5 : 9;
	const colors = ['rgba(117,231,255,0.35)', 'rgba(255,79,134,0.32)', 'rgba(154,255,187,0.2)'];
	const frag = document.createDocumentFragment();
	for (let i = 0; i < count; i += 1) {
		const slice = document.createElement('i');
		slice.className = 'truth-slice';
		slice.style.setProperty('--y', `${(Math.random() * 100).toFixed(2)}%`);
		slice.style.setProperty('--h', `${(0.18 + Math.random() * 0.55).toFixed(2)}rem`);
		slice.style.setProperty('--x', `${((Math.random() - 0.5) * 3).toFixed(2)}rem`);
		slice.style.setProperty('--x-soft-a', `${((Math.random() - 0.5) * 1.1).toFixed(2)}rem`);
		slice.style.setProperty('--x-soft-b', `${((Math.random() - 0.5) * 1.8).toFixed(2)}rem`);
		slice.style.setProperty('--c', colors[i % colors.length]);
		slice.style.setProperty('--dur', `${(5.5 + Math.random() * 6).toFixed(2)}s`);
		slice.style.setProperty('--delay', `${(-Math.random() * 8).toFixed(2)}s`);
		frag.append(slice);
	}
	truthGlitchSlices.replaceChildren(frag);
}

function spawnInkDrops() {
	if (!inkDrops || prefersReducedMotion()) return;
	const spawn = () => {
		if (currentLayer !== 'dream') return;
		const drop = document.createElement('i');
		drop.className = 'ink-drop';
		drop.style.setProperty('--x', `${10 + Math.random() * 80}%`);
		drop.style.setProperty('--y', `${20 + Math.random() * 60}%`);
		drop.style.setProperty('--size', `${1.5 + Math.random() * 3}rem`);
		drop.style.setProperty('--delay', '0s');
		inkDrops.append(drop);
		setTimeout(() => drop.remove(), 3600);
	};
	setInterval(spawn, 4000 + Math.random() * 3000);
	setTimeout(spawn, 1200);
}

function spawnDataStream() {
	if (!dataStream || prefersReducedMotion()) return;
	dataStream.replaceChildren();
	const chars = '01アイウエオカキクケコ♦♠♣♥';
	const count = coarsePointerQuery?.matches ? 18 : 35;
	const colors = ['rgba(117,231,255,0.7)', 'rgba(154,255,187,0.6)', 'rgba(255,79,134,0.5)', 'rgba(255,210,120,0.5)'];
	const frag = document.createDocumentFragment();
	for (let i = 0; i < count; i += 1) {
		const bit = document.createElement('span');
		bit.className = 'data-bit';
		bit.textContent = chars[Math.floor(Math.random() * chars.length)];
		bit.style.setProperty('--x', `${(Math.random() * 100).toFixed(2)}%`);
		bit.style.setProperty('--size', `${(0.6 + Math.random() * 0.5).toFixed(2)}rem`);
		bit.style.setProperty('--c', colors[Math.floor(Math.random() * colors.length)]);
		bit.style.setProperty('--o', `${(0.2 + Math.random() * 0.4).toFixed(2)}`);
		bit.style.setProperty('--dur', `${(8 + Math.random() * 12).toFixed(2)}s`);
		bit.style.setProperty('--delay', `${(-Math.random() * 14).toFixed(2)}s`);
		frag.append(bit);
	}
	dataStream.append(frag);
}

function initParallax() {
	if (prefersReducedMotion()) return;
	let targetX = 0;
	let targetY = 0;
	let raf = 0;
	const px = (value) => `${value.toFixed(2)}px`;
	const pct = (value) => `${value.toFixed(2)}%`;
	const apply = () => {
		raf = 0;
		root.style.setProperty('--desk-motion-x', px(targetX * -10));
		root.style.setProperty('--desk-motion-y', px(targetY * -8));
		root.style.setProperty('--dream-particles-x', px(targetX * 18));
		root.style.setProperty('--dream-particles-y', px(targetY * 14));
		root.style.setProperty('--bg-doodle-x', px(targetX * 8));
		root.style.setProperty('--bg-doodle-y', px(targetY * 6));
		root.style.setProperty('--truth-glow-a-x', pct(70 + targetX * 2));
		root.style.setProperty('--truth-glow-a-y', pct(20 + targetY * 2));
		root.style.setProperty('--truth-glow-b-x', pct(30 - targetX * 2));
		root.style.setProperty('--truth-glow-b-y', pct(80 - targetY * 2));
		root.style.setProperty('--truth-ambient-x', px(targetX * -14));
		root.style.setProperty('--truth-ambient-y', px(targetY * -10));
		root.style.setProperty('--truth-grid-x', px(targetX * 18));
		root.style.setProperty('--truth-grid-y', px(targetY * 10));
		root.style.setProperty('--truth-cameo-x', px(targetX * 18));
		root.style.setProperty('--truth-cameo-y', px(targetY * 12));
		root.style.setProperty('--terminal-x', px(targetX * 4));
		root.style.setProperty('--terminal-y', px(targetY * 3));
	};
	const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
	const setFromPoint = (x, y) => {
		targetX = Math.max(-1, Math.min(1, (x / window.innerWidth - 0.5) * 2));
		targetY = Math.max(-1, Math.min(1, (y / window.innerHeight - 0.5) * 2));
		queue();
	};
	window.addEventListener('pointermove', (e) => setFromPoint(e.clientX, e.clientY), { passive: true });
	window.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; queue(); }, { passive: true });
}

// ========== DREAM INTERACTIONS ==========

function initDreamInteractions() {
	initStickyNote();
	initPencilDraw();
	initHeartBurst();
}

function initSideNotes() {
	if (!sideNotesLayer || prefersReducedMotion()) return;
	const cachedNotes = readCachedSideNotes();
	if (cachedNotes.length) {
		sideNotePool = shuffle(cachedNotes);
		renderSideNotes();
	}
	loadGuestbookNotes();
	window.matchMedia?.(SIDE_NOTE_MOBILE_QUERY)?.addEventListener?.('change', () => {
		sideNotePool = shuffle(readCachedSideNotes());
		renderSideNotes();
	});
}

function renderSideNotes() {
	if (!sideNotesLayer) return;
	sideNotesLayer.replaceChildren();
	fillSideNoteSlots();
}

function fillSideNoteSlots() {
	if (!sideNotesLayer) return;
	sideNotePool = sideNotePool.filter((noteData) => !tornSideNoteKeys.has(sideNoteKey(noteData)));
	if (!sideNotePool.length) return;
	const limit = getSideNoteLimit();
	const visibleNotes = Array.from(sideNotesLayer.querySelectorAll('.side-note:not(.is-tearing)'));
	const usedSlots = new Set(visibleNotes.map((note) => Number(note.dataset.noteSlot)).filter(Number.isInteger));
	for (let i = 0; i < limit && sideNotePool.length; i += 1) {
		if (usedSlots.has(i)) continue;
		const note = createSideNote(i);
		if (note) sideNotesLayer.append(note);
	}
}

function createSideNote(index) {
	const note = document.createElement('article');
	note.className = 'side-note is-entering';
	note.setAttribute('aria-label', PATH_LANG === 'en' ? 'Guestbook note' : '留言纸条');
	note.dataset.noteSlot = String(index);
	const content = document.createElement('span');
	content.className = 'side-note-content';
	const tear = document.createElement('button');
	tear.type = 'button';
	tear.className = 'side-note-tear';
	tear.textContent = PATH_LANG === 'en' ? 'tear' : '撕下';
	tear.setAttribute('aria-label', PATH_LANG === 'en' ? 'Tear away this note' : '撕下这张留言纸条');
	tear.addEventListener('click', (event) => {
		event.stopPropagation();
		tearSideNote(note);
	});
	note.append(tear, content);
	placeSideNote(note, index);
	if (!assignSideNoteText(note)) return null;
	note.addEventListener('animationend', (event) => {
		if (event.animationName === 'sideNoteIn') note.classList.remove('is-entering');
	});
	return note;
}

function placeSideNote(note, index) {
	if (isSideNoteMobile()) {
		const tilt = (index % 2 === 0 ? -1 : 1) * (2.5 + Math.random() * 2.5);
		note.dataset.side = 'mobile';
		note.style.setProperty('--note-top', 'auto');
		note.style.setProperty('--note-mobile-x', '-0.55rem');
		note.style.setProperty('--note-mobile-bottom', 'clamp(2.2rem, 6vh, 4rem)');
		note.style.setProperty('--note-tilt', `${tilt}deg`);
		note.style.setProperty('--note-delay', `${Math.min(index * 90, 220)}ms`);
		return;
	}
	const leftSide = index % 2 === 0;
	const slot = Math.floor(index / 2);
	const top = 14 + ((slot * 24 + Math.random() * 9) % 68);
	const outer = 3.2 + Math.random() * 5.8;
	const tilt = (leftSide ? -1 : 1) * (3 + Math.random() * 5);
	note.dataset.side = leftSide ? 'left' : 'right';
	note.style.setProperty('--note-top', `${top}%`);
	note.style.setProperty('--note-outer', `${outer}vw`);
	note.style.setProperty('--note-tilt', `${tilt}deg`);
	note.style.setProperty('--note-delay', `${Math.min(index * 70, 320)}ms`);
}

function getSideNoteLimit() {
	return isSideNoteMobile() ? SIDE_NOTE_MOBILE_MAX : SIDE_NOTE_MAX;
}

function isSideNoteMobile() {
	return window.matchMedia?.(SIDE_NOTE_MOBILE_QUERY)?.matches || window.innerWidth <= 900;
}

function tearSideNote(note) {
	if (!note || note.classList.contains('is-tearing')) return;
	const noteKey = note.dataset.noteKey || '';
	if (noteKey) tornSideNoteKeys.add(noteKey);
	note.classList.add('is-tearing');
	window.setTimeout(() => {
		note.remove();
		fillSideNoteSlots();
	}, 360);
}

function assignSideNoteText(note) {
	if (!sideNotePool.length) return false;
	const availableIndexes = sideNotePool
		.map((noteData, index) => ({ index, key: sideNoteKey(noteData) }))
		.filter(({ key }) => !tornSideNoteKeys.has(key))
		.map(({ index }) => index);
	if (!availableIndexes.length) return false;
	const textIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
	const noteData = sideNotePool.splice(textIndex, 1)[0];
	const noteKey = sideNoteKey(noteData);
	const content = note.querySelector('.side-note-content') || note;
	renderMarkdownInto(content, formatSideNoteMarkdown(noteData));
	note.dataset.noteKey = noteKey;
	note.dataset.noteIndex = String(textIndex);
	return true;
}

async function loadGuestbookNotes() {
	try {
		const response = await fetch(GUESTBOOK_ENDPOINT, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				event: 'COMMENT_GET',
				url: GUESTBOOK_PATH,
				sort: 'newest',
			}),
		});
		if (!response.ok) return;
		const payload = await response.json();
		const notes = normalizeGuestbookNotes(payload?.data);
		if (!notes.length) return;
		const cachedNotes = readCachedSideNotes();
		writeCachedSideNotes(notes);
		if (sideNotesLayer.children.length && sameStringList(cachedNotes, notes)) return;
		sideNotePool = shuffle(notes);
		renderSideNotes();
	} catch (error) {
		console.info('[desk-notes] guestbook notes skipped');
	}
}

function sameStringList(first, second) {
	if (first.length !== second.length) return false;
	return first.every((value, index) => sideNoteKey(value) === sideNoteKey(second[index]));
}

function sideNoteKey(note) {
	return formatSideNoteMarkdown(note).replace(/\s+/g, ' ').trim();
}

function readCachedSideNotes() {
	try {
		const parsed = JSON.parse(localStorage.getItem(SIDE_NOTE_CACHE_KEY) || '[]');
		return Array.isArray(parsed) ? parsed.map(normalizeCachedSideNote).filter(Boolean).slice(0, 18) : [];
	} catch {
		return [];
	}
}

function normalizeCachedSideNote(note) {
	if (typeof note === 'string') return note.trim() ? note : null;
	if (!note || typeof note !== 'object') return null;
	const comment = typeof note.comment === 'string' ? note.comment.trim() : '';
	if (!comment) return null;
	return {
		nick: typeof note.nick === 'string' ? note.nick.trim() : '',
		comment,
	};
}

function writeCachedSideNotes(notes) {
	try {
		localStorage.setItem(SIDE_NOTE_CACHE_KEY, JSON.stringify(notes.slice(0, 18)));
	} catch {
		// localStorage may be disabled; stickers can still render after fetch.
	}
}

function normalizeGuestbookNotes(items) {
	if (!Array.isArray(items)) return [];
	const seen = new Set();
	return items
		.map((item) => {
			if (item?.isSpam) return '';
			const commentHtml = String(item?.comment || '');
			const commentText = stripHtml(item?.commentText || commentHtml);
			const nick = stripHtml(item?.nick || '');
			if (!commentText) return '';
			const key = `${nick}:${commentText}`;
			if (seen.has(key)) return '';
			seen.add(key);
			return {
				nick,
				comment: htmlToBasicMarkdown(commentHtml || commentText),
			};
		})
		.filter(Boolean)
		.slice(0, 18);
}

function formatSideNoteMarkdown(note) {
	if (typeof note === 'string') return note;
	if (!note || typeof note !== 'object') return '';
	return note.nick ? `**${note.nick}：**\n${note.comment}` : note.comment;
}

function htmlToBasicMarkdown(value) {
	const temp = document.createElement('div');
	temp.innerHTML = String(value);
	for (const br of temp.querySelectorAll('br')) br.replaceWith('\n');
	for (const p of temp.querySelectorAll('p')) p.append('\n');
	for (const strong of temp.querySelectorAll('strong, b')) strong.replaceWith(`**${strong.textContent || ''}**`);
	for (const em of temp.querySelectorAll('em, i')) em.replaceWith(`*${em.textContent || ''}*`);
	for (const del of temp.querySelectorAll('del, s')) del.replaceWith(`~~${del.textContent || ''}~~`);
	for (const code of temp.querySelectorAll('code')) code.replaceWith(`\`${code.textContent || ''}\``);
	for (const a of temp.querySelectorAll('a')) {
		const href = safeHref(a.getAttribute('href') || '');
		a.replaceWith(href ? `[${a.textContent || href}](${href})` : (a.textContent || ''));
	}
	return (temp.textContent || temp.innerText || '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function renderMarkdownInto(target, markdown) {
	if (!target) return;
	target.replaceChildren(...markdownToSafeNodes(markdown));
}

function markdownToSafeNodes(markdown) {
	const text = String(markdown || '').replace(/\r\n?/g, '\n').trim();
	if (!text) return [document.createTextNode('')];
	const fragment = document.createDocumentFragment();
	const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
	for (const block of blocks) {
		if (/^[-*]\s+/m.test(block)) {
			const ul = document.createElement('ul');
			for (const line of block.split('\n')) {
				const item = line.replace(/^[-*]\s+/, '').trim();
				if (!item) continue;
				const li = document.createElement('li');
				appendInlineMarkdown(li, item);
				ul.append(li);
			}
			fragment.append(ul);
			continue;
		}
		const p = document.createElement('p');
		const lines = block.split('\n');
		lines.forEach((line, index) => {
			if (index) p.append(document.createElement('br'));
			appendInlineMarkdown(p, line);
		});
		fragment.append(p);
	}
	return Array.from(fragment.childNodes);
}

function appendInlineMarkdown(parent, text) {
	const pattern = /(\*\*[^*]+\*\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
	let lastIndex = 0;
	for (const match of text.matchAll(pattern)) {
		if (match.index > lastIndex) parent.append(document.createTextNode(text.slice(lastIndex, match.index)));
		const token = match[0];
		if (token.startsWith('**')) {
			const strong = document.createElement('strong');
			strong.textContent = token.slice(2, -2);
			parent.append(strong);
		} else if (token.startsWith('~~')) {
			const del = document.createElement('del');
			del.textContent = token.slice(2, -2);
			parent.append(del);
		} else if (token.startsWith('`')) {
			const code = document.createElement('code');
			code.textContent = token.slice(1, -1);
			parent.append(code);
		} else if (token.startsWith('[')) {
			const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
			const href = safeHref(linkMatch?.[2] || '');
			if (href) {
				const a = document.createElement('a');
				a.textContent = linkMatch[1];
				a.href = href;
				a.target = '_blank';
				a.rel = 'noopener noreferrer';
				parent.append(a);
			} else {
				parent.append(document.createTextNode(linkMatch?.[1] || token));
			}
		} else if (token.startsWith('*')) {
			const em = document.createElement('em');
			em.textContent = token.slice(1, -1);
			parent.append(em);
		}
		lastIndex = match.index + token.length;
	}
	if (lastIndex < text.length) parent.append(document.createTextNode(text.slice(lastIndex)));
}

function stripHtml(value) {
	const temp = document.createElement('div');
	temp.innerHTML = String(value);
	return (temp.textContent || temp.innerText || '')
		.replace(/\s+/g, ' ')
		.trim();
}

function shuffle(items) {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

function initStickyNote() {
	if (!stickyNote || !stickyText) return;
	stickyText.textContent = STICKY_QUOTES[Math.floor(Math.random() * STICKY_QUOTES.length)];

	let dragging = false;
	let startX = 0, startY = 0, origLeft = 0, origTop = 0;

	const onDown = (e) => {
		if (currentLayer !== 'dream') return;
		dragging = true;
		stickyNote.classList.add('is-dragging');
		const rect = stickyNote.getBoundingClientRect();
		const parentRect = stickyNote.offsetParent.getBoundingClientRect();
		origLeft = rect.left - parentRect.left;
		origTop = rect.top - parentRect.top;
		const pt = e.touches ? e.touches[0] : e;
		startX = pt.clientX;
		startY = pt.clientY;
		e.preventDefault();
	};

	const onMove = (e) => {
		if (!dragging) return;
		const pt = e.touches ? e.touches[0] : e;
		const dx = pt.clientX - startX;
		const dy = pt.clientY - startY;
		stickyNote.style.left = `${origLeft + dx}px`;
		stickyNote.style.top = `${origTop + dy}px`;
		stickyNote.style.bottom = 'auto';
	};

	const onUp = () => {
		if (!dragging) return;
		dragging = false;
		stickyNote.classList.remove('is-dragging');
	};

	stickyNote.addEventListener('pointerdown', onDown);
	document.addEventListener('pointermove', onMove, { passive: true });
	document.addEventListener('pointerup', onUp);
}

function initPencilDraw() {
	if (!pencilCanvas || prefersReducedMotion() || coarsePointerQuery?.matches) return;
	const ctx = pencilCanvas.getContext('2d');
	const resize = () => {
		const parent = pencilCanvas.parentElement;
		if (!parent) return;
		pencilCanvas.width = parent.clientWidth;
		pencilCanvas.height = parent.clientHeight;
	};
	resize();
	window.addEventListener('resize', resize);

	let drawing = false;
	const notebookExtras = pencilCanvas.closest('.notebook-extras');

	notebookExtras?.addEventListener('pointerenter', () => { if (currentLayer === 'dream') pencilCanvas.style.pointerEvents = 'auto'; });
	notebookExtras?.addEventListener('pointerleave', () => { pencilCanvas.style.pointerEvents = 'none'; drawing = false; });

	pencilCanvas.addEventListener('pointerdown', (e) => {
		if (currentLayer !== 'dream') return;
		drawing = true;
		ctx.beginPath();
		const rect = pencilCanvas.getBoundingClientRect();
		ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
	});

	pencilCanvas.addEventListener('pointermove', (e) => {
		if (!drawing) return;
		const rect = pencilCanvas.getBoundingClientRect();
		ctx.strokeStyle = 'rgba(125, 125, 125, 0.4)';
		ctx.lineWidth = 1.5;
		ctx.lineCap = 'round';
		ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
		ctx.stroke();
	});

	pencilCanvas.addEventListener('pointerup', () => { drawing = false; });

	setInterval(() => {
		ctx.globalCompositeOperation = 'destination-out';
		ctx.fillStyle = 'rgba(0,0,0,0.03)';
		ctx.fillRect(0, 0, pencilCanvas.width, pencilCanvas.height);
		ctx.globalCompositeOperation = 'source-over';
	}, 120);
}

function initHeartBurst() {
	if (!stickerHeart || !heartBurst) return;
	stickerHeart.addEventListener('click', () => {
		if (currentLayer !== 'dream') return;
		heartBurst.replaceChildren();
		const count = 8 + Math.floor(Math.random() * 5);
		const frag = document.createDocumentFragment();
		for (let i = 0; i < count; i += 1) {
			const h = document.createElement('span');
			h.className = 'mini-heart';
			h.textContent = '♡';
			const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
			const dist = 30 + Math.random() * 50;
			h.style.setProperty('--tx', `${(Math.cos(angle) * dist).toFixed(1)}px`);
			h.style.setProperty('--ty', `${(Math.sin(angle) * dist).toFixed(1)}px`);
			h.style.setProperty('--rot', `${((Math.random() - 0.5) * 60).toFixed(0)}deg`);
			h.style.setProperty('--size', `${(0.7 + Math.random() * 0.8).toFixed(2)}rem`);
			h.style.setProperty('--delay', `${(Math.random() * 0.15).toFixed(2)}s`);
			frag.append(h);
		}
		heartBurst.append(frag);
		setTimeout(() => heartBurst.replaceChildren(), 1400);
	});
}

// ========== TERMINAL DRAG ==========

function initTerminalDrag() {
	if (!terminalTitle || !terminalWindow) return;
	let dragging = false;
	let offsetX = 0, offsetY = 0;
	let posX = 0, posY = 0;

	terminalTitle.addEventListener('pointerdown', (e) => {
		if (e.target.closest('.title-dot')) return;
		if (currentLayer !== 'truth') return;
		dragging = true;
		terminalTitle.classList.add('is-dragging');
		terminalTitle.setPointerCapture(e.pointerId);
		offsetX = e.clientX - posX;
		offsetY = e.clientY - posY;
	});

	terminalTitle.addEventListener('pointermove', (e) => {
		if (!dragging) return;
		posX = e.clientX - offsetX;
		posY = e.clientY - offsetY;
		terminalWindow.style.transform = `translate(${posX}px, ${posY}px)`;
	});

	terminalTitle.addEventListener('pointerup', () => {
		dragging = false;
		terminalTitle.classList.remove('is-dragging');
	});
}

function resetTerminalPosition() {
	if (!terminalWindow) return;
	terminalWindow.style.transform = '';
}

// ========== MATRIX RAIN ==========

function startMatrix() {
	if (!matrixCanvas) return;
	if (matrixActive) { stopMatrix(); return; }
	matrixActive = true;
	matrixCanvas.classList.add('is-active');
	const ctx = matrixCanvas.getContext('2d');
	matrixCanvas.width = window.innerWidth;
	matrixCanvas.height = window.innerHeight;

	const fontSize = 14;
	const cols = Math.floor(matrixCanvas.width / fontSize);
	const drops = Array(cols).fill(1);
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソ0123456789';

	const draw = () => {
		if (!matrixActive) return;
		ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
		ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
		ctx.fillStyle = '#0f0';
		ctx.font = `${fontSize}px monospace`;

		for (let i = 0; i < drops.length; i += 1) {
			const char = chars[Math.floor(Math.random() * chars.length)];
			ctx.fillStyle = Math.random() > 0.96 ? '#fff' : `hsl(${120 + Math.random() * 40}, 100%, ${50 + Math.random() * 20}%)`;
			ctx.fillText(char, i * fontSize, drops[i] * fontSize);
			if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) drops[i] = 0;
			drops[i] += 1;
		}
		matrixRaf = requestAnimationFrame(draw);
	};
	draw();
}

function stopMatrix() {
	if (!matrixActive) return;
	matrixActive = false;
	cancelAnimationFrame(matrixRaf);
	matrixCanvas?.classList.remove('is-active');
	const ctx = matrixCanvas?.getContext('2d');
	if (ctx) ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
}

// ========== TRUTH POPUP / CAMEO ==========

function getLocalizedLine(lines) {
	if (!lines) return '';
	if (Array.isArray(lines)) return lines[PATH_LANG === 'en' ? 0 : 1] || lines[0] || '';
	if (typeof lines === 'string') return lines;
	return '';
}

function applyTruthData(config) {
	if (!config || typeof config !== 'object') return;
	applyTerminalConfig(config.terminal);
	if (isPlainObject(config.cameos?.roles)) {
		ROLE_CAMEOS = mergePlain(ROLE_CAMEOS, config.cameos.roles);
	}
	if (isPlainObject(config.cameos?.global)) {
		GLOBAL_CAMEOS = mergePlain(GLOBAL_CAMEOS, config.cameos.global);
	}
}

function applyTerminalConfig(terminal) {
	if (!terminal || typeof terminal !== 'object') return;
	setAttr(truthLayer, 'aria-label', terminal.layerAriaLabel);
	setText(terminalTitle?.querySelector('p'), terminal.title);
	setAttr(terminalInput, 'placeholder', terminal.placeholder);
	setAttr(terminalInput, 'aria-label', terminal.ariaLabel);
	setAttr(terminalWindow?.querySelector('.dot-close'), 'aria-label', terminal.closeAriaLabel);
	setAttr(terminalWindow?.querySelector('.dot-minimize'), 'aria-label', terminal.minimizeAriaLabel);
}

function normalizeCameoCommand(cmd) {
	return cmd
		.toLowerCase()
		.replace(/\\/g, '/')
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, "'")
		.replace(/[。]/g, '.')
		.replace(/[；]/g, ';')
		.replace(/\s+/g, ' ')
		.trim();
}

function parseCameoCommand(cmd) {
	const normalized = normalizeCameoCommand(cmd);
	if (!normalized) return null;
	if (Object.prototype.hasOwnProperty.call(GLOBAL_CAMEOS, normalized)) return { ...GLOBAL_CAMEOS[normalized] };

	const roles = Object.keys(ROLE_CAMEOS);
	const quotedChr = normalized.match(/^["']?([a-z]+)\.chr["']?$/);
	if (quotedChr && roles.includes(quotedChr[1])) return buildRoleCameo(quotedChr[1], 'chr');

	const justDelete = normalized.match(/^just\s+(?:delete|del|remove|rm)\s+([a-z]+)(?:\.chr)?$/);
	if (justDelete && roles.includes(justDelete[1])) return buildRoleCameo(justDelete[1], 'justDelete', 'strong');

	const justRole = normalized.match(/^just\s+([a-z]+)(?:\.chr)?$/);
	if (justRole && roles.includes(justRole[1])) return buildRoleCameo(justRole[1], 'just', 'strong');

	const deleteRole = normalized.match(/^(?:delete|del|remove|rm)\s+([a-z]+)(?:\.chr)?$/);
	if (deleteRole && roles.includes(deleteRole[1])) return buildRoleCameo(deleteRole[1], 'delete', 'strong');

	const fileRole = normalized.match(/^(?:cat|open|read|file|type|less|more)\s+([a-z]+)(?:\.chr|\.txt)?$/);
	if (fileRole && roles.includes(fileRole[1])) return buildRoleCameo(fileRole[1], fileRole[0].includes('.chr') ? 'chr' : 'file');

	const fileChrRole = normalized.match(/^(?:cat|open|read|file|type|less|more)\s+([a-z]+\.chr)$/);
	if (fileChrRole) {
		const role = fileChrRole[1].replace('.chr', '');
		if (roles.includes(role)) return buildRoleCameo(role, 'chr');
	}

	for (const role of roles) {
		const roleData = ROLE_CAMEOS[role];
		if (normalized === role) return buildRoleCameo(role, 'name');
		if (normalized === `${role}.chr`) return buildRoleCameo(role, 'chr');
		if (normalized === `/${role}.chr`) return buildRoleCameo(role, 'chr');
		if (normalized === `delete ${role}.chr`) return buildRoleCameo(role, 'delete', 'strong');
		if (normalized === `just delete ${role}.chr`) return buildRoleCameo(role, 'justDelete', 'strong');
		if (normalized === roleData.label) return buildRoleCameo(role, 'chr');
	}

	return null;
}

function buildRoleCameo(role, lineKey, tone) {
	const data = ROLE_CAMEOS[role];
	if (!data) return null;
	const strong = tone || (lineKey === 'delete' || lineKey === 'just' || lineKey === 'justDelete' ? 'strong' : 'soft');
	return {
		image: data.image,
		label: data.label,
		tone: strong,
		line: getLocalizedLine(data.lines?.[lineKey] || data.lines?.name),
		role,
		lineKey,
	};
}

function tryCameoCommand(cmd) {
	if (currentLayer !== 'truth') return false;
	const event = parseCameoCommand(cmd);
	if (!event) return false;
	showTruthCameo(event);
	const line = event.line || getLocalizedLine(event.lines);
	if (line) appendOutput(line, event.tone === 'strong' ? 'system' : 'sayori-text');
	if (event.tone === 'strong') {
		body.classList.add('is-manual-glitch');
		spawnGlitchBits(prefersReducedMotion() ? 0 : 52, 700);
		playGlitchSfx(520);
		setTimeout(() => body.classList.remove('is-manual-glitch'), 620);
	}
	return true;
}

function showTruthCameo(event) {
	if (!truthCameo) return;
	const image = truthCameo.querySelector('img');
	const label = truthCameo.querySelector('.truth-cameo-label');
	if (!image || !label) return;
	truthCameo.classList.remove('is-visible', 'is-strong');
	void truthCameo.offsetWidth;
	image.src = Array.isArray(event.image) ? randomFrom(event.image) : event.image;
	label.textContent = event.label || '';
	truthCameo.classList.toggle('is-strong', event.tone === 'strong');
	truthCameo.classList.add('is-visible');
	const ttl = event.tone === 'strong' ? 1900 : 1450;
	window.clearTimeout(showTruthCameo.hideTimer);
	showTruthCameo.hideTimer = window.setTimeout(() => {
		truthCameo.classList.remove('is-visible', 'is-strong');
	}, ttl);
}

function setCssTimeMs(name, ms) {
	root.style.setProperty(name, `${Math.round(ms)}ms`);
}

// ========== COMMAND HANDLER ==========

function handleCommand(raw) {
	appendOutput(`> ${raw}`, 'cmd-echo');
	const trimmed = raw.trim();
	const lowered = trimmed.toLowerCase();
	const cmd = lowered.replace(/^\//, '');
	const terminalUrl = parseTerminalUrl(trimmed);

	if (terminalUrl) {
		appendOutput(PATH_LANG === 'en' ? 'Do you want to go there? I can take you.' : '你想要去那里吗？那我帮你跳转吧', 'sayori-text');
		setTimeout(() => { window.open(terminalUrl, '_blank', 'noopener'); }, 650);
	} else if (cmd === 'help') {
		printLines(cmdData?.responses?.help || ['no help available.']);
	} else if (cmd === 'blog') {
		appendOutput(PATH_LANG === 'en' ? 'Opening blog.sayori.org ...' : '正在跳转到 blog.sayori.org ...', 'muted');
		setTimeout(() => { window.open('https://blog.sayori.org/', '_blank'); }, 600);
	} else if (cmd === 'bilibili' || cmd === 'bili' || cmd === 'videos' || cmd === 'video') {
		appendOutput(PATH_LANG === 'en' ? 'Opening Bilibili ...' : '正在跳转到 B 站主页 ...', 'muted');
		setTimeout(() => { window.open(BILIBILI_URL, '_blank'); }, 600);
	} else if (cmd === 'about') {
		printLines(cmdData?.responses?.about || ['sayori.org']);
	} else if (cmd === 'restore' || cmd === 'exit' || cmd === 'quit' || cmd === 'y') {
		appendOutput(cmdData?.responses?.restore || 'restoring...', 'sayori-text');
		setTimeout(restoreDream, 800);
	} else if (cmd === 'clear' || cmd === 'cls') {
		terminalOutput.innerHTML = '';
	} else if (cmd === 'glitch') {
		handleGlitch();
	} else if (cmd === 'matrix') {
		handleMatrix();
	} else if (cmd === 'cat sayori.txt' || cmd === 'cat sayori') {
		printLines(cmdData?.responses?.diary_text || ['file not found.']);
	} else if (cmd.startsWith('color')) {
		handleColor(cmd);
	} else if (tryCameoCommand(cmd)) {
		// handled
	} else if (tryHiddenCommand(cmd)) {
		// handled
	} else if (tryEgg(lowered) || tryEgg(cmd)) {
		// handled
	} else {
		const fallbacks = cmdData?.fallback || ['?'];
		const line = fallbacks[Math.floor(Math.random() * fallbacks.length)];
		appendOutput(`sayori.exe: ${line}`, 'sayori-text');
	}
	scrollTerminal();
}

function handleGlitch() {
	printLines(cmdData?.responses?.glitch_msg || ['glitch.']);
	body.classList.add('is-manual-glitch');
	setTimeout(() => body.classList.remove('is-manual-glitch'), 700);
	spawnGlitchBits(60, 600);
	playGlitchSfx(700);
}

function handleMatrix() {
	printLines(cmdData?.responses?.matrix_msg || ['matrix.']);
	setTimeout(startMatrix, 400);
}

function handleColor(cmd) {
	const parts = cmd.split(/\s+/);
	const color = parts[1];
	const valid = ['cyan', 'pink', 'green', 'amber', 'reset'];
	if (!color || !valid.includes(color)) {
		printLines(cmdData?.responses?.color_help || ['usage: /color <name>']);
		return;
	}
	body.className = body.className.replace(/theme-\w+/g, '').trim();
	if (color !== 'reset') body.classList.add(`theme-${color}`);
	printLines(cmdData?.responses?.color_changed || ['color changed.']);
}

function tryHiddenCommand(cmd) {
	const responses = cmdData?.responses || {};
	if (Object.prototype.hasOwnProperty.call(responses, cmd) && cmd !== 'restore') {
		const val = responses[cmd];
		if (Array.isArray(val)) printLines(val);
		else if (typeof val === 'string') appendOutput(val, 'info');
		return true;
	}
	return false;
}

function tryEgg(key) {
	const eggs = cmdData?.eggs || {};
	if (!Object.prototype.hasOwnProperty.call(eggs, key)) return false;
	const val = eggs[key];
	const lines = Array.isArray(val) ? val : [val];
	for (const line of lines) appendOutput(line, 'sayori-text');
	return true;
}

function printLines(lines) {
	for (const line of lines) appendOutput(line, 'info');
}

function appendOutput(text, cls) {
	const p = document.createElement('p');
	p.className = cls || '';
	p.textContent = text;
	terminalOutput?.append(p);
	scrollTerminal();
}

function scrollTerminal() {
	if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
}

function initTerminal() {
	if (!terminalOutput) return;
	terminalOutput.innerHTML = '';
	const greeting = cmdData?.greeting || (PATH_LANG === 'en' ? 'sayori.exe started. Type /help.' : 'sayori.exe 已启动。输入 /help 查看可用指令。');
	appendOutput(greeting, 'sayori-text');
	setTimeout(() => terminalInput?.focus(), 100);
}

async function loadCmdData() {
	try {
		const res = await fetch(TRUTH_DATA_URL, { cache: 'no-cache' });
		if (!res.ok) return;
		cmdData = await res.json();
		applyTruthData(cmdData);
	} catch {}
}

function initDate() {
	if (!dateDisplay) return;
	const now = new Date();
	const m = now.getMonth() + 1;
	const d = now.getDate();
	if (PATH_LANG === 'en') {
		const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		dateDisplay.textContent = `${m} / ${d} · ${weekdays[now.getDay()]}`;
	} else {
		const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
		dateDisplay.textContent = `${m} / ${d} · 星期${weekdays[now.getDay()]}`;
	}
}

async function initWeather() {
	if (!weatherDisplay) return;
	try {
		const lang = PATH_LANG === 'en' ? 'en' : 'zh';
		const res = await fetch(`https://wttr.in/?format=%c%t&lang=${lang}`, {
			headers: { 'Accept': 'text/plain' },
			signal: AbortSignal.timeout(4000),
		});
		if (!res.ok) throw 0;
		const text = (await res.text()).trim();
		if (text && text.length < 30) weatherDisplay.textContent = text;
	} catch {}
}
