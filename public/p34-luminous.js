import {
  WORLD_COOKIE_KEY,
  readWorldCookie,
  advanceEncounterState,
  serializeWorldState,
  createWorldSession,
} from './p34-living.js?v=20261104-luminous';
import { createMotion, segmentGraphemes } from './p34-motion.js?v=20261104-luminous';
import { discover } from './p34-story.js?v=20261104-luminous';
import { startBreakoutGame } from './p34-breakout.js?v=20261104-luminous';
import { readBreakoutCookie } from './p34-breakout-state.js?v=20261104-luminous';

const STYLE_HREF = '/p34-luminous.css?v=20261104-luminous';

/**
 * Resolves participating Home/Blog/Store links with ?paper=0617.
 * Preserves canonical and current-origin domains without hardcoded preview ports.
 * External links (GitHub, itch.io, Bilibili, GeoScore, etc.) remain untouched.
 */
export function transformParticipatingHref(originalHref, contextLocation = (typeof location !== 'undefined' ? location : null)) {
  if (!originalHref || typeof originalHref !== 'string') return originalHref;
  const trimmed = originalHref.trim();
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('javascript:')
  ) {
    return originalHref;
  }

  const baseHref = contextLocation?.href || 'https://sayori.org/';
  const currentOrigin = contextLocation?.origin || 'https://sayori.org';

  let url;
  try {
    url = new URL(trimmed, baseHref);
  } catch {
    return originalHref;
  }

  const host = url.hostname.toLowerCase();
  const isSameOrigin = Boolean(currentOrigin && url.origin === currentOrigin);
  const isFormalHome = host === 'sayori.org' || host === 'www.sayori.org' || host === 'sayori.local';
  const isFormalBlog = host === 'blog.sayori.org' || host === 'blog.sayori.local';
  const isFormalStore = host === 'store.sayori.org' || host === 'store.sayori.local';

  const isParticipating = isSameOrigin || isFormalHome || isFormalBlog || isFormalStore;
  if (!isParticipating) {
    return originalHref;
  }

  url.searchParams.set('paper', '0617');
  return url.href;
}

const COPY = {
  zh: {
    pageTitle: '字行与光路 · 透光工作台',
    horizonName: '透光工作台',
    blogPill: '去读随笔 ↗',
    soundOff: '声效：关',
    soundOn: '声效：开',
    poseBtn: '换个光线角度',
    topReturn: '← 返回原主页',
    heroHeadline: '把窗边移到这里',
    engageOpen: '聊聊这里的事 ▾',
    engageClose: '收起话题 ▴',
    speechFirst: '等一下，我刚把这扇透光窗挪过来，桌角的三棱镜还没放稳。',
    speechReturn: '你又翻到这一面啦，光路都替你留着。',
    speechFromBlog: '刚从随笔那边过来吗？这边的天光刚调好。',
    prismTitle: '三棱折光镇纸',
    prismDroppedState: '稍微歪了一点 · 轻触扶正',
    prismAlignedState: '已放稳 · 光路通畅',
    playBtn: '开始打弹球',
    workTitle: '正在摆弄的试作品',
    expTitle: '光弦张力',
    expState: '清透青',
    expModeCyan: '清透青',
    expModeBlue: '晴空蓝',
    expModeGold: '晨光金',
    expPluck: '拨弦',
    windTitle: '字间吹风',
    windState0: '自然行距',
    windState1: '微风错开',
    windState2: '宽幅留白',
    windLine1: '把一句话轻轻提起来，',
    windLine2: '旁边的句子就会自己让开一点。',
    windLine3: '空出来的那块地方，刚好够坐一会儿。',
    windBtn: '吹一阵风',
    tintTitle: '天窗滤片',
    tintStateClear: '晴空透光',
    tintStateSea: '浅海折光',
    tintStateDusk: '傍晚斜角',
    tintBtnClear: '晴空透光',
    tintBtnSea: '浅海折光',
    tintBtnDusk: '傍晚斜角',
    notesHeading: '留在这边的手记与草稿',
    notesBlogLink: '去随笔集 ↗',
    notes: [
      {
        id: 'light-folds',
        date: '11 / 02',
        title: '三棱镜与挡板随记',
        excerpt: '试着让光束顺着桌面切过去，球落下来的时候用挡板往上一托，整页字行都会跟着轻轻回弹。',
        action: '去随笔那边看看 ↗',
        href: 'https://blog.sayori.org/notes/prism-and-paddle/?paper=0617',
        speech: '那边记着我调三棱镜和挡板角度时的随笔。',
      },
      {
        id: 'half-torn',
        date: '10 / 21',
        title: '夹在页边的未完草稿',
        excerpt: '有几句改了好几遍也没定下来，干脆先折进页边收着，留给明天再改。',
        extraHidden: '页边字条：不用每次都塞满，今天先留一个空位吧。',
        action: '展开页边字条 ▾',
        actionOpen: '收起页边字条 ▴',
        speech: '这张只是随手夹在这儿的半页草稿，还没写成正式文章呢。',
      },
      {
        id: 'borrowed-margin',
        date: '10 / 15',
        title: '傍晚的暖金边光',
        excerpt: '太阳偏西的时候，三棱镜折出来的第三道光会变成暖金色，刚好落在桌沿。',
        action: '碰一下三棱镜 ↗',
        targetKind: 'prism',
        speech: '多碰几下桌角的三棱镜，就能转到那道暖金色的折射角啦。',
      },
    ],
    piece1Title: '草稿背面',
    piece1Body: '顺着天光留一点斜角，风才吹得进来。',
    piece1Flipped: '背面画着弹球草图——连撞五下的时候，我会顺手替你拼好一处撞裂的边角。',
    piece1Btn: '翻看背面',
    piece2Title: '桌角便签',
    piece3Btn: '换一张',
    drawerTitle: '原站入口与工具',
    drawerOpenBtn: '展开 ▾',
    drawerCloseBtn: '收起 ▴',
    seamBtn: '◇ 页角折痕里的字条',
    seamHidden: '折痕背面写着半行小字。',
    seamRevealed: '「球快掉下去的时候，拿便签在底下垫一下应该来得及。」',
  },
  en: {
    pageTitle: 'Lines & Light · Luminous Atelier',
    horizonName: 'Luminous Atelier',
    blogPill: 'Read Notes ↗',
    soundOff: 'Sound: Off',
    soundOn: 'Sound: On',
    poseBtn: 'Shift Light Angle',
    topReturn: '← Normal Home',
    heroHeadline: 'Moved the Window Edge Here',
    engageOpen: 'Talk for a bit ▾',
    engageClose: 'Hide prompts ▴',
    speechFirst: 'Hold on—I just slid this window over here, and the corner prism is still tilted.',
    speechReturn: 'You flipped back to this side—I kept the light paths open for you.',
    speechFromBlog: 'Just came over from my notes? The daylight here is freshly tuned.',
    prismTitle: 'Refraction Prism Paperweight',
    prismDroppedState: 'Slightly tilted · Tap to align',
    prismAlignedState: 'Set steady · Clear beam',
    playBtn: 'Play Breakout',
    workTitle: 'Active Experiments',
    expTitle: 'Light Chord',
    expState: 'Clear Cyan',
    expModeCyan: 'Clear Cyan',
    expModeBlue: 'Sky Blue',
    expModeGold: 'Warm Gold',
    expPluck: 'Pluck',
    windTitle: 'Wind Between Lines',
    windState0: 'Natural',
    windState1: 'Breeze',
    windState2: 'Wide Air',
    windLine1: 'Lift a single sentence gently,',
    windLine2: 'and the neighboring lines step aside on their own.',
    windLine3: 'The open space left behind is just enough to sit for a while.',
    windBtn: 'Let Wind Through',
    tintTitle: 'Daylight Filter',
    tintStateClear: 'Clear Sky',
    tintStateSea: 'Shallow Sea',
    tintStateDusk: 'Evening Gold',
    tintBtnClear: 'Clear Sky',
    tintBtnSea: 'Shallow Sea',
    tintBtnDusk: 'Evening Gold',
    notesHeading: 'Jottings & Drafts Here',
    notesBlogLink: 'All Notes on Blog ↗',
    notes: [
      {
        id: 'light-folds',
        date: '11 / 02',
        title: 'Prism & Paddle Jotting',
        excerpt: 'Angled the beam across the desk—when the orb drops and catches the paddle, the lines across the page spring back softly.',
        action: 'See the note on the blog ↗',
        href: 'https://blog.sayori.org/notes/prism-and-paddle/?paper=0617',
        speech: 'I kept my longer note on tuning the prism and paddle over there.',
      },
      {
        id: 'half-torn',
        date: '10 / 21',
        title: 'Unfinished Margin Draft',
        excerpt: 'Rewrote a few lines several times without settling on them, so I folded the scrap into the margin for tomorrow.',
        extraHidden: 'Margin slip: No need to pack every line—leave an open spot for today.',
        action: 'Unfold margin slip ▾',
        actionOpen: 'Fold slip back ▴',
        speech: 'Just an unfinished half-page scrap I tucked here—not a published article.',
      },
      {
        id: 'borrowed-margin',
        date: '10 / 15',
        title: 'Warm Gold at Dusk',
        excerpt: 'When the sun dips low, the third beam from the prism turns warm gold right along the desk edge.',
        action: 'Tap the prism ↗',
        targetKind: 'prism',
        speech: 'Tap the corner prism a couple of times to catch that warm gold angle.',
      },
    ],
    piece1Title: 'Back of the Sketch',
    piece1Body: 'Leave an angled channel for daylight so the breeze gets through.',
    piece1Flipped: 'Breakout sketch on the back—chain five bounces and I will mend a fractured corner for you.',
    piece1Btn: 'Flip Over',
    piece2Title: 'Corner Slip',
    piece3Btn: 'Next Slip',
    drawerTitle: 'Original Site & Tools',
    drawerOpenBtn: 'Open ▾',
    drawerCloseBtn: 'Close ▴',
    seamBtn: '◇ Margin crease note',
    seamHidden: 'Half a line is penciled inside the fold.',
    seamRevealed: '“If the orb is about to drop, sliding a note underneath should catch it in time.”',
  },
};

function getCopy() {
  const lang = document.documentElement.lang || '';
  return lang.toLowerCase().startsWith('en') ? COPY.en : COPY.zh;
}

/**
 * Collects all visible, non-overlapping `[data-p34-target]` surfaces with both
 * viewport and document-space coordinates (`getBoundingClientRect()` + `window.scrollY`).
 */
export function collectBreakoutTargets(scope = document) {
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const nodes = [...scope.querySelectorAll('[data-p34-target]')].filter(
    el => !el.hidden && !el.closest('[hidden]')
  );
  const topLevelNodes = nodes.filter(node => !nodes.some(other => other !== node && other.contains(node)));
  return topLevelNodes
    .map(el => {
      const rect = el.getBoundingClientRect();
      return {
        element: el,
        type: el.dataset.p34Target || 'surface',
        viewportRect: rect,
        x: rect.left + scrollX,
        y: rect.top + scrollY,
        width: rect.width,
        height: rect.height,
      };
    })
    .filter(item => item.width > 8 && item.height > 8);
}

/**
 * Lightweight hit -> body deformation -> spring recovery + luminous radial refraction ring.
 */
export function deformSurface(motion, el, options = {}) {
  if (!el || !motion) return Promise.resolve();
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return Promise.resolve();
  const cx = Number.isFinite(options.x) ? options.x : rect.left + rect.width * 0.5;
  const cy = Number.isFinite(options.y) ? options.y : rect.top + rect.height * 0.35;
  const dx = Number.isFinite(options.dx) ? options.dx : 0;
  const dy = Number.isFinite(options.dy) ? options.dy : 7;
  const tilt = Number.isFinite(options.tilt) ? options.tilt : -1.4;
  const accent = options.color || '#45D4F2';

  if (!motion.reduced() && !document.hidden) {
    const ring = document.createElement('span');
    ring.className = 'p34-refract-ring';
    ring.setAttribute('aria-hidden', 'true');
    ring.style.left = `${cx}px`;
    ring.style.top = `${cy}px`;
    ring.style.borderColor = accent;
    document.body.append(ring);
    void motion.animate(
      ring,
      [
        { transform: 'translate(-50%, -50%) scale(0.22)', opacity: 0.92 },
        { transform: 'translate(-50%, -50%) scale(1.15)', opacity: 0.55, offset: 0.52 },
        { transform: 'translate(-50%, -50%) scale(1.75)', opacity: 0 },
      ],
      { duration: 520, easing: 'cubic-bezier(.16, .84, .28, 1)' }
    ).then(() => ring.remove());
  }

  const baseRotate = getComputedStyle(el).rotate;
  const restRotate = baseRotate && baseRotate !== 'none' ? baseRotate : '0deg';
  return motion.animate(
    el,
    [
      { translate: '0px 0px', scale: '1 1', rotate: restRotate },
      { translate: `${dx}px ${dy}px`, scale: '1.028 0.962', rotate: `${tilt}deg`, offset: 0.18 },
      { translate: `${(-dx * 0.42).toFixed(1)}px ${(-dy * 0.42).toFixed(1)}px`, scale: '0.988 1.018', rotate: `${(-tilt * 0.45).toFixed(2)}deg`, offset: 0.48 },
      { translate: `${(dx * 0.14).toFixed(1)}px ${(dy * 0.14).toFixed(1)}px`, scale: '1.005 0.997', rotate: `${(tilt * 0.12).toFixed(2)}deg`, offset: 0.76 },
      { translate: '0px 0px', scale: '1 1', rotate: restRotate },
    ],
    { duration: options.duration || 620, easing: 'cubic-bezier(.22, 1, .36, 1)' }
  );
}

const activeMounts = new WeakMap();

function mountSubpageAnomaly() {
  const root = document.documentElement;
  if (activeMounts.has(root)) return activeMounts.get(root);

  const controller = new AbortController();
  const { signal } = controller;
  const modifiedLinks = [];
  const adaptedSet = new WeakSet();

  root.classList.add('p34-world');
  root.dataset.p34Site = 'subpage';
  root.dataset.p34Active = 'true';

  let style = document.querySelector('link[data-p34-luminous-style], link[data-p34-living-style]');
  if (!style) {
    style = document.createElement('link');
    style.rel = 'stylesheet';
    style.dataset.p34LuminousStyle = '';
    document.head.append(style);
  }
  if (!style.href.includes('p34-luminous.css')) {
    style.href = STYLE_HREF;
  }

  function adaptSubpageAnchors(scope = document) {
    const links = scope.querySelectorAll ? scope.querySelectorAll('a[href]') : [];
    for (const a of links) {
      if (adaptedSet.has(a)) continue;
      const orig = a.getAttribute('href');
      const origTarget = a.getAttribute('target');
      const transformed = transformParticipatingHref(orig);
      adaptedSet.add(a);
      if (transformed !== orig) {
        a.setAttribute('href', transformed);
        modifiedLinks.push({ el: a, href: orig, target: origTarget });
      }
    }
  }

  // Adapt existing links and observe any links rendered asynchronously by subpage scripts
  adaptSubpageAnchors(document);
  let observer = null;
  if (typeof MutationObserver !== 'undefined' && document.body) {
    observer = new MutationObserver(() => adaptSubpageAnchors(document));
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function cleanupSubpage() {
    observer?.disconnect();
    root.classList.remove('p34-world');
    delete root.dataset.p34Site;
    delete root.dataset.p34Active;
    controller.abort();
    for (const rec of modifiedLinks) {
      if (rec.href === null) rec.el.removeAttribute('href');
      else rec.el.setAttribute('href', rec.href);
      if (rec.target === null) rec.el.removeAttribute('target');
      else rec.el.setAttribute('target', rec.target);
    }
    modifiedLinks.length = 0;
    activeMounts.delete(root);
  }

  const sendBackSubpage = () => {
    const url = new URL(location.href);
    url.searchParams.delete('paper');
    url.searchParams.delete('p34s');
    history.replaceState(null, '', url);
    cleanupSubpage();
  };

  window.addEventListener('p34:send-back', sendBackSubpage, { signal });
  window.addEventListener('paper:return', sendBackSubpage, { signal });
  activeMounts.set(root, cleanupSubpage);
  return cleanupSubpage;
}

export function mountLuminousHome() {
  if (typeof location === 'undefined' || new URLSearchParams(location.search).get('paper') !== '0617') {
    return () => {};
  }
  const root = document.documentElement;
  if (activeMounts.has(root)) return activeMounts.get(root);

  const isHomeRoot = Boolean(document.querySelector('.entries')) ||
    ['/', '/index.html', '/en/', '/en/index.html', '/zh-hant/', '/zh-hant/index.html'].includes(location.pathname);
  if (!isHomeRoot) {
    return mountSubpageAnomaly();
  }

  const controller = new AbortController();
  const { signal } = controller;
  const motion = createMotion(signal);
  const main = document.querySelector('#main-content, main');
  if (!main) throw new Error('Project 34 needs the original main element');

  const original = document.createDocumentFragment();
  const parked = [];
  const borrowed = [];
  const modifiedLinks = [];
  const timers = new Set();
  const originalTitle = document.title;
  const originalURL = location.href;
  const originalState = history.state;
  const normalFrame = main.closest('.desk-surface, .desk-shell');
  const mainMark = document.createComment('normal main position');
  const { cookie, getStory, setStory } = createWorldSession();

  let page = null;
  let activeBreakoutCleanup = null;
  let mounted = false;
  let leaving = false;
  let destroyed = false;

  function adaptLink(linkEl) {
    if (!linkEl || !linkEl.getAttribute) return;
    const origHref = linkEl.getAttribute('href');
    const origTarget = linkEl.getAttribute('target');
    if (!origHref) return;
    const nextHref = transformParticipatingHref(origHref);
    if (nextHref !== origHref) {
      linkEl.setAttribute('href', nextHref);
      modifiedLinks.push({ el: linkEl, href: origHref, target: origTarget });
    }
  }

  function restoreLinks() {
    for (const rec of modifiedLinks) {
      if (rec.href === null) rec.el.removeAttribute('href');
      else rec.el.setAttribute('href', rec.href);
      if (rec.target === null) rec.el.removeAttribute('target');
      else rec.el.setAttribute('target', rec.target);
    }
    modifiedLinks.length = 0;
  }

  const listen = (el, type, fn, options = {}) => el?.addEventListener(type, fn, { signal, ...options });
  function later(fn, ms) {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!signal.aborted && !destroyed) fn();
    }, ms);
    timers.add(id);
    return id;
  }

  function park(el) {
    if (!el || !el.isConnected || main.contains(el) || el.contains(main)) return;
    const mark = document.createComment('normal website');
    el.before(mark);
    el.remove();
    parked.push([el, mark]);
  }

  function borrowNode(el) {
    if (!el || !el.parentNode) return null;
    const anchor = document.createComment('p34-borrowed-node');
    const prevStyle = el.getAttribute('style');
    const prevTarget = el.getAttribute('data-p34-target');
    const prevSlot = el.getAttribute('data-p34-slot');
    el.before(anchor);
    const record = {
      el,
      restore() {
        el.getAnimations?.().forEach(a => a.cancel());
        if (prevStyle === null) el.removeAttribute('style');
        else el.setAttribute('style', prevStyle);
        if (prevTarget === null) el.removeAttribute('data-p34-target');
        else el.setAttribute('data-p34-target', prevTarget);
        if (prevSlot === null) el.removeAttribute('data-p34-slot');
        else el.setAttribute('data-p34-slot', prevSlot);
        if (anchor.parentNode) anchor.replaceWith(el);
      },
    };
    borrowed.push(record);
    return el;
  }

  function sourcePoints() {
    const points = [];
    for (const el of document.querySelectorAll('.entry-title, .page-title, .letter-title, .margin-text, h1, h2')) {
      const r = el.getBoundingClientRect();
      if (!r.width || r.top > innerHeight || r.bottom < 0) continue;
      const chars = segmentGraphemes(el.textContent.trim());
      const limit = Math.min(chars.length, 8);
      for (let i = 0; i < limit; i++) {
        points.push({
          x: r.x + (r.width * (i + 0.5)) / limit,
          y: r.y + r.height / 2,
          char: chars[i],
        });
      }
    }
    return points.slice(0, 64);
  }

  function restore() {
    if (!mounted) return;
    restoreLinks();
    if (activeBreakoutCleanup) {
      activeBreakoutCleanup();
      activeBreakoutCleanup = null;
    }
    const servicesNote = document.getElementById('services-note');
    const servicesOpen = document.getElementById('services-open');
    if (document.body.classList.contains('services-open')) {
      document.body.classList.remove('services-open');
    }
    if (servicesNote) {
      servicesNote.hidden = true;
      servicesNote.setAttribute('inert', '');
    }
    if (servicesOpen) {
      servicesOpen.setAttribute('aria-expanded', 'false');
    }

    for (let i = borrowed.length - 1; i >= 0; i--) {
      borrowed[i].restore();
    }
    borrowed.length = 0;

    if (page) {
      page.remove();
      page = null;
    }
    main.replaceChildren(original);
    for (const [el, mark] of parked) {
      mark.replaceWith(el);
    }
    parked.length = 0;
    if (mainMark.parentNode) mainMark.replaceWith(main);
    main.classList.remove('p34-host');
    root.classList.remove('p34-world', 'p34-ready', 'p34-playing', 'p34-talking');
    for (const key of ['p34Scene', 'p34Chapter', 'p34Mood', 'p34Site', 'p34Active', 'p34Pose', 'p34Tint', 'p34Moment']) {
      delete root.dataset[key];
    }
    document.title = originalTitle;
    mounted = false;
  }

  async function sendBack() {
    if (leaving || !mounted) return;
    leaving = true;
    const speechEl = page?.querySelector('.p34-speech-line');
    const headlineEl = page?.querySelector('.p34-hero-owner');
    const fromRect = (headlineEl || main).getBoundingClientRect();
    if (speechEl) {
      speechEl.textContent = getCopy() === COPY.en
        ? 'Okay—folding the windows back into the original notebook desk now.'
        : '好，稍等一下，我把这几扇透光窗折回原来的书桌。';
    }
    if (page) {
      await motion.animate(
        page,
        [
          { opacity: 1, translate: '0px 0px' },
          { opacity: 0, translate: '0px -16px' },
        ],
        { duration: 380 }
      );
    }
    if (destroyed) return;
    restore();

    const url = new URL(originalURL);
    url.searchParams.delete('paper');
    url.searchParams.delete('p34s');
    if (/^#(?:space|blog|play|note-|p34-)/.test(url.hash)) url.hash = '';
    history.replaceState(originalState, '', url);

    const target = main.querySelector('.page-title, .letter-title, h1');
    if (target) {
      const toRect = target.getBoundingClientRect();
      void motion.animate(
        target,
        [
          { translate: `${fromRect.x - toRect.x}px ${fromRect.y - toRect.y}px`, scale: '0.88' },
          { translate: '0px 0px', scale: '1' },
        ],
        { duration: 760 }
      );
    }
    const prevTabIndex = main.getAttribute('tabindex');
    main.tabIndex = -1;
    main.focus({ preventScroll: true });
    if (prevTabIndex === null) main.removeAttribute('tabindex');
    else main.setAttribute('tabindex', prevTabIndex);

    const resume = () => {
      if (new URLSearchParams(location.search).get('paper') !== '0617') return;
      window.removeEventListener('popstate', resume);
      cleanup();
      root.dataset.p34Entry = 'morph';
      mountLuminousHome();
    };
    window.addEventListener('popstate', resume);
    window.addEventListener('pagehide', () => window.removeEventListener('popstate', resume), { once: true });
    later(cleanup, 840);
  }

  function enter() {
    if (destroyed || mounted) return;
    const copy = getCopy();

    const beforePaper = main.getBoundingClientRect();
    const titleOriginEl = main.querySelector('.page-title, .letter-title, h1');
    const titleOriginRect = titleOriginEl?.getBoundingClientRect();
    const sources = sourcePoints();

    const dateText = main.querySelector('#date-display')?.textContent?.trim() || '';
    const weatherText = main.querySelector('#weather-display')?.textContent?.trim() || '';
    const initialSticky = main.querySelector('#sticky-text')?.textContent?.trim() || (copy === COPY.en ? 'Leave a little room for something new.' : '留一小块地方给新东西。');

    // Borrow the actual 6 .entry DOM nodes from .entries (preserving children & listeners for restore & secondary drawer)
    const liveEntries = [...main.querySelectorAll('.entries > .entry')];
    const borrowedEntries = liveEntries.map(el => borrowNode(el)).filter(Boolean);

    const liveServicesNote = document.getElementById('services-note');
    const borrowedServicesNote = liveServicesNote ? borrowNode(liveServicesNote) : null;
    const livePageVer = main.querySelector('.page-footer .page-ver') || document.querySelector('.page-ver');
    const borrowedPageVer = livePageVer ? borrowNode(livePageVer) : null;

    // Advance encounter state using existing world session & cookie contract
    const encounter = advanceEncounterState(readWorldCookie(document.cookie), 'home');
    let story = getStory();
    const first = !story.met || encounter.encounterType === 'home-first';
    story = setStory({
      ...story,
      met: 1,
      chapter: story.chapter === 'arrive' ? 'explore' : story.chapter,
    });
    cookie(WORLD_COOKIE_KEY, serializeWorldState(encounter.state));

    // Park original content & move main to body host
    original.append(...main.childNodes);
    main.before(mainMark);
    document.body.append(main);
    park(normalFrame);
    document.querySelectorAll('.sayori-sketch, .desk-piano, .desk-odd-object, .side-notes-layer, .sticker-heart, .desk-foot').forEach(park);

    main.classList.add('p34-host');
    root.classList.add('p34-world');
    root.dataset.p34Site = 'home';
    root.dataset.p34Active = 'true';
    root.dataset.p34Pose = 'default';
    root.dataset.p34Tint = 'clear';
    mounted = true;

    const initialSpeech = encounter.encounterType === 'home-from-blog'
      ? copy.speechFromBlog
      : first
        ? copy.speechFirst
        : copy.speechReturn;

    document.title = copy.pageTitle;

    const horizonMeta = [dateText !== '--/--' ? dateText : '', weatherText].filter(Boolean).join(' · ');
    const breakoutStats = readBreakoutCookie();
    const bestBadgeText = breakoutStats.runs > 0
      ? (copy === COPY.en
          ? `Best ${breakoutStats.bestScore} · ${breakoutStats.runs} run${breakoutStats.runs > 1 ? 's' : ''}`
          : `最高 ${breakoutStats.bestScore} 分 · 已玩 ${breakoutStats.runs} 局`)
      : '';

    page = document.createElement('div');
    page.className = 'p34-page';
    page.innerHTML = `
      <div class="p34-sky-architecture" aria-hidden="true">
        <div class="p34-window-aperture p34-aperture-main"></div>
        <div class="p34-window-aperture p34-aperture-wing"></div>
        <svg class="p34-orbit-svg" viewBox="0 0 1440 960" preserveAspectRatio="none">
          <ellipse cx="1040" cy="230" rx="360" ry="180" transform="rotate(-14 1040 230)" stroke="rgba(69, 212, 242, 0.30)" stroke-width="1.3" stroke-dasharray="8 10" />
          <path d="M60 760 C420 620 760 820 1360 400" stroke="rgba(69, 212, 242, 0.24)" stroke-width="1.2" />
        </svg>
      </div>

      <div class="p34-shell">
        <header class="p34-horizon">
          <div class="p34-horizon-identity">
            <span class="p34-horizon-dot" aria-hidden="true"></span>
            <span class="p34-horizon-name">${copy.horizonName}</span>
            ${horizonMeta ? `<span>${horizonMeta}</span>` : ''}
          </div>
          <div class="p34-horizon-actions">
            <a href="https://blog.sayori.org/?paper=0617" class="p34-blog-pill">${copy.blogPill}</a>
            <button type="button" class="p34-text-action p34-sound-toggle" data-p34-action="toggle-sound" aria-pressed="false">${copy.soundOff}</button>
            <button type="button" class="p34-text-action" data-p34-action="cycle-pose">${copy.poseBtn}</button>
            <span class="p34-lang-slot"></span>
            <button type="button" class="p34-return-link" data-p34-action="send-back">${copy.topReturn}</button>
          </div>
        </header>

        <section class="p34-hero-stage" aria-label="${copy.heroHeadline}">
          <div class="p34-hero-open">
            <h1 class="p34-hero-title" tabindex="-1" data-p34-target="title">
              <span class="p34-hero-owner">${copy.heroHeadline}</span>
            </h1>

            <div class="p34-voice-stage" data-p34-target="voice">
              <p class="p34-speech-line" aria-live="polite">${initialSpeech}</p>
              <div class="p34-voice-actions">
                <button type="button" class="p34-engage-btn" data-p34-action="toggle-replies" aria-expanded="false">${copy.engageOpen}</button>
              </div>
              <div class="p34-context-replies" hidden></div>
            </div>
          </div>

          <div class="p34-hero-focal">
            <div class="p34-focal-prism" data-p34-target="decor" ${first ? 'data-p34-dropped="true"' : ''}>
              <div class="p34-prism-sculpture" data-p34-action="touch-object" role="button" tabindex="0" aria-label="${copy.prismTitle}">
                <svg class="p34-prism-svg" viewBox="0 0 320 180" aria-hidden="true">
                  <defs>
                    <linearGradient id="p34-glass-face-front" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
                      <stop offset="60%" stop-color="#E2F5FC" stop-opacity="0.75" />
                      <stop offset="100%" stop-color="#45D4F2" stop-opacity="0.45" />
                    </linearGradient>
                    <linearGradient id="p34-glass-face-side" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.85" />
                      <stop offset="100%" stop-color="#1E8ECA" stop-opacity="0.30" />
                    </linearGradient>
                    <linearGradient id="p34-beam-glow" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%" stop-color="#45D4F2" stop-opacity="0.95" />
                      <stop offset="40%" stop-color="#DDF5FC" stop-opacity="0.80" />
                      <stop offset="100%" stop-color="#45D4F2" stop-opacity="0.0" />
                    </linearGradient>
                    <filter id="p34-caustic-blur" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" />
                    </filter>
                  </defs>
                  <polygon data-p34-caustic points="190,75 320,15 320,150 190,95" fill="url(#p34-beam-glow)" filter="url(#p34-caustic-blur)" opacity="0.65" />
                  <line x1="20" y1="95" x2="140" y2="82" stroke="rgba(255, 255, 255, 0.95)" stroke-width="2.6" stroke-linecap="round" />
                  <polygon points="140,82 186,28 172,126" fill="url(#p34-glass-face-front)" stroke="#45D4F2" stroke-width="1.6" stroke-linejoin="round" />
                  <polygon points="186,28 228,78 172,126" fill="url(#p34-glass-face-side)" stroke="#1E8ECA" stroke-width="1.6" stroke-linejoin="round" />
                  <polygon points="140,82 186,28 228,78" fill="rgba(255, 255, 255, 0.72)" />
                  <line x1="186" y1="28" x2="172" y2="126" stroke="#FFB76D" stroke-width="1.8" stroke-linecap="round" opacity="0.85" />
                  <line x1="172" y1="126" x2="228" y2="78" stroke="#FF856F" stroke-width="1.4" stroke-linecap="round" opacity="0.65" />
                  <line data-p34-ray-cyan x1="210" y1="72" x2="315" y2="44" stroke="#45D4F2" stroke-width="2.6" stroke-linecap="round" />
                  <line data-p34-ray-gold x1="215" y1="84" x2="318" y2="92" stroke="#FFB76D" stroke-width="2.2" stroke-linecap="round" />
                </svg>
                <div class="p34-prism-inline-hint">
                  <span class="p34-prism-dot" aria-hidden="true"></span>
                  <span class="p34-prism-state" data-p34-obj-state>${first ? copy.prismDroppedState : copy.prismAlignedState}</span>
                </div>
              </div>
            </div>

            <div class="p34-play-invitation" data-p34-target="launcher">
              <button type="button" class="p34-play-btn" data-p34-action="start-breakout">
                <span class="p34-play-orb" aria-hidden="true"></span>
                <span>${copy.playBtn}</span>
              </button>
              <span class="p34-play-best-badge" data-p34-best-badge ${bestBadgeText ? '' : 'hidden'}>${bestBadgeText}</span>
            </div>
          </div>
        </section>

        <section class="p34-workbench-zone" aria-labelledby="p34-work-heading">
          <div class="p34-section-head">
            <h2 class="p34-section-title" id="p34-work-heading">${copy.workTitle}</h2>
          </div>

          <div class="p34-creations-grid">
            <article class="p34-experiment-bench" data-p34-target="experiment">
              <div class="p34-bench-head">
                <h3 class="p34-bench-title">${copy.expTitle}</h3>
                <span class="p34-bench-state" data-p34-exp-state>${copy.expState}</span>
              </div>
              <div class="p34-exp-stage">
                <svg class="p34-exp-svg" data-p34-action="run-experiment" viewBox="0 0 520 88" aria-hidden="true">
                  <path data-p34-exp-wave d="M 12 44 Q 140 8 260 44 T 508 44" fill="none" stroke="#45D4F2" stroke-width="2.8" stroke-linecap="round" />
                  <path data-p34-exp-echo d="M 12 44 Q 140 76 260 44 T 508 44" fill="none" stroke="rgba(255, 183, 109, 0.65)" stroke-width="1.5" stroke-dasharray="5 6" stroke-linecap="round" />
                  <circle data-p34-exp-node cx="260" cy="44" r="6.5" fill="#1E8ECA" />
                </svg>
                <div class="p34-exp-controls">
                  <div class="p34-exp-modes" role="group" aria-label="${copy.expTitle}">
                    <button type="button" class="p34-exp-mode-btn" data-exp-mode="cyan" aria-pressed="true">${copy.expModeCyan}</button>
                    <button type="button" class="p34-exp-mode-btn" data-exp-mode="blue" aria-pressed="false">${copy.expModeBlue}</button>
                    <button type="button" class="p34-exp-mode-btn" data-exp-mode="gold" aria-pressed="false">${copy.expModeGold}</button>
                  </div>
                  <button type="button" class="p34-exp-pluck-btn" data-p34-action="run-experiment">${copy.expPluck}</button>
                </div>
              </div>
            </article>

            <div class="p34-side-creations">
              <article class="p34-wind-piece" data-p34-target="card" data-wind-step="0">
                <div class="p34-bench-head">
                  <h3 class="p34-bench-title">${copy.windTitle}</h3>
                  <span class="p34-bench-state" data-p34-wind-state>${copy.windState0}</span>
                </div>
                <div class="p34-wind-lines" data-p34-wind-lines>
                  <p class="p34-wind-line">${copy.windLine1}</p>
                  <p class="p34-wind-line">${copy.windLine2}</p>
                  <p class="p34-wind-line">${copy.windLine3}</p>
                </div>
                <button type="button" class="p34-loose-btn" data-p34-action="cycle-wind">${copy.windBtn}</button>
              </article>

              <article class="p34-filter-piece" data-p34-target="card">
                <div class="p34-bench-head">
                  <h3 class="p34-bench-title">${copy.tintTitle}</h3>
                  <span class="p34-bench-state" data-p34-tint-state>${copy.tintStateClear}</span>
                </div>
                <div class="p34-exp-modes" role="group" aria-label="${copy.tintTitle}">
                  <button type="button" class="p34-exp-mode-btn" data-tint-mode="clear" aria-pressed="true">${copy.tintBtnClear}</button>
                  <button type="button" class="p34-exp-mode-btn" data-tint-mode="sea" aria-pressed="false">${copy.tintBtnSea}</button>
                  <button type="button" class="p34-exp-mode-btn" data-tint-mode="dusk" aria-pressed="false">${copy.tintBtnDusk}</button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section class="p34-notes-zone" aria-labelledby="p34-notes-heading">
          <div class="p34-section-head">
            <h2 class="p34-section-title" id="p34-notes-heading">${copy.notesHeading}</h2>
            <a href="https://blog.sayori.org/?paper=0617" class="p34-section-link">${copy.notesBlogLink}</a>
          </div>
          <div class="p34-notes-grid"></div>
        </section>

        <section class="p34-loose-workspace" aria-label="${copy.piece1Title}">
          <article class="p34-loose-draft" data-p34-target="piece">
            <h3 class="p34-loose-title">${copy.piece1Title}</h3>
            <p class="p34-loose-body" data-p34-piece1-text>${copy.piece1Body}</p>
            <button type="button" class="p34-loose-btn" data-p34-action="flip-piece">${copy.piece1Btn}</button>
          </article>

          <div class="p34-loose-archives" data-p34-target="piece">
            <h3 class="p34-loose-title">${copy.piece2Title}</h3>
            <div class="p34-sticky-line">
              <p class="p34-sticky-quote" data-p34-sticky-quote>「${initialSticky}」</p>
              <button type="button" class="p34-loose-btn" data-p34-action="next-quote">${copy.piece3Btn}</button>
            </div>
          </div>

          <div class="p34-orig-drawer" id="p34-orig-drawer">
            <div class="p34-orig-drawer-bar" data-p34-target="piece">
              <div class="p34-orig-drawer-info">
                <h3 class="p34-loose-title">${copy.drawerTitle}</h3>
              </div>
              <button type="button" class="p34-return-link" data-p34-action="toggle-orig-drawer" aria-expanded="false">${copy.drawerOpenBtn}</button>
            </div>
            <div class="p34-orig-drawer-body" hidden>
              <nav class="p34-nav-constellation" aria-label="${copy.drawerTitle}"></nav>
              <div class="p34-services-host"></div>
            </div>
          </div>

          <div class="p34-footer-row">
            <div class="p34-seam-note" data-p34-target="detail">
              <button type="button" class="p34-seam-btn" data-p34-action="discover-seam" aria-expanded="false">${copy.seamBtn}</button>
              <p class="p34-seam-reveal" data-p34-seam-text>${copy.seamHidden}</p>
            </div>
          </div>
        </section>
      </div>
    `;

    main.append(page);

    // Insert borrowed language selector (.page-ver) into horizon bar
    const langSlot = page.querySelector('.p34-lang-slot');
    if (borrowedPageVer && langSlot) {
      langSlot.replaceWith(borrowedPageVer);
    }

    // Mount borrowed original .entry nodes inside the tucked secondary drawer
    const navConstellation = page.querySelector('.p34-nav-constellation');
    const slotOrder = [0, 3, 2, 1, 4, 5];
    const orderedEntries = [];

    if (borrowedEntries.length >= 6) {
      for (const idx of slotOrder) {
        const entryEl = borrowedEntries[idx];
        if (!entryEl) continue;
        entryEl.dataset.p34Slot = String(idx + 1);
        entryEl.dataset.p34Target = 'nav';
        orderedEntries.push(entryEl);
      }
    } else if (borrowedEntries.length > 0) {
      borrowedEntries.forEach((entryEl, idx) => {
        entryEl.dataset.p34Slot = String(idx + 1);
        entryEl.dataset.p34Target = 'nav';
        orderedEntries.push(entryEl);
      });
    }

    for (const entryEl of orderedEntries) {
      if (entryEl.tagName === 'A') adaptLink(entryEl);
      navConstellation.append(entryEl);
    }

    // Mount borrowed #services-note inside .p34-services-host so #services-open operates it directly
    const servicesHost = page.querySelector('.p34-services-host');
    if (borrowedServicesNote && servicesHost) {
      servicesHost.append(borrowedServicesNote);
    }

    // Populate her 3 interactive essay/draft notes
    const notesGrid = page.querySelector('.p34-notes-grid');
    copy.notes.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = 'p34-note-card';
      card.dataset.p34Target = 'note';
      card.dataset.noteIndex = String(index);
      const actionMarkup = item.href
        ? `<a href="${item.href}" class="p34-note-action-link">${item.action}</a>`
        : `<button type="button" class="p34-note-action-btn" data-p34-action="inspect-note" data-note-index="${index}">${item.action}</button>`;
      const extraMarkup = item.extraHidden
        ? `<p class="p34-note-extra" data-note-extra hidden>${item.extraHidden}</p>`
        : '';
      card.innerHTML = `
        <div class="p34-note-meta">
          <time class="p34-note-date">${item.date}</time>
        </div>
        <h3 class="p34-note-title">${item.title}</h3>
        <p class="p34-note-excerpt">${item.excerpt}</p>
        ${extraMarkup}
        <div class="p34-note-foot">${actionMarkup}</div>
      `;
      notesGrid.append(card);
    });

    // Adapt all participating links across the atelier
    page.querySelectorAll('a[href]').forEach(a => adaptLink(a));

    // Element references for progressive updates
    const ownerEl = page.querySelector('.p34-hero-owner');
    const speechEl = page.querySelector('.p34-speech-line');
    const engageBtn = page.querySelector('[data-p34-action="toggle-replies"]');
    const repliesBox = page.querySelector('.p34-context-replies');
    const focalPrism = page.querySelector('.p34-focal-prism');
    const objStateEl = page.querySelector('[data-p34-obj-state]');
    const rayCyan = page.querySelector('[data-p34-ray-cyan]');
    const rayGold = page.querySelector('[data-p34-ray-gold]');
    const expBench = page.querySelector('.p34-experiment-bench');
    const expStateEl = page.querySelector('[data-p34-exp-state]');
    const expWave = page.querySelector('[data-p34-exp-wave]');
    const expNode = page.querySelector('[data-p34-exp-node]');
    const windPiece = page.querySelector('.p34-wind-piece');
    const windStateEl = page.querySelector('[data-p34-wind-state]');
    const filterPiece = page.querySelector('.p34-filter-piece');
    const tintStateEl = page.querySelector('[data-p34-tint-state]');
    const playInviteEl = page.querySelector('.p34-play-invitation');
    const bestBadgeEl = page.querySelector('[data-p34-best-badge]');
    const piece1Text = page.querySelector('[data-p34-piece1-text]');
    const stickyQuoteEl = page.querySelector('[data-p34-sticky-quote]');
    const origDrawerBtn = page.querySelector('[data-p34-action="toggle-orig-drawer"]');
    const origDrawerBody = page.querySelector('.p34-orig-drawer-body');
    const seamBtn = page.querySelector('[data-p34-action="discover-seam"]');
    const seamTextEl = page.querySelector('[data-p34-seam-text]');
    const soundBtn = page.querySelector('.p34-sound-toggle');

    const poses = ['default', 'refract', 'gather'];
    let poseIndex = 0;
    let prismStep = 0;
    let windStep = 0;
    let pieceFlipped = false;
    let quoteIndex = 0;
    let replyTopic = 'initial';

    const stickyPool = copy === COPY.en
      ? [initialSticky, 'Words on this page can be lifted so the breeze passes through.', 'Leave an angled channel for daylight.', 'When daylight bends through the prism, even the shadow turns cyan.']
      : [initialSticky, '把一句话轻轻提起来，旁边的句子就会让开。', '留出一点斜角，风才吹得进来。', '光线折过三棱镜的时候，连影子都是青色的。'];

    function movableModules() {
      return [
        page.querySelector('.p34-hero-title'),
        page.querySelector('.p34-voice-stage'),
        focalPrism,
        playInviteEl,
        expBench,
        windPiece,
        filterPiece,
        ...page.querySelectorAll('.p34-note-card'),
        page.querySelector('.p34-loose-draft'),
        page.querySelector('.p34-loose-archives'),
        page.querySelector('.p34-orig-drawer-bar'),
      ].filter(Boolean);
    }

    function speak(text, mode = 'fade') {
      if (!speechEl) return;
      motion.cancelText(speechEl);
      speechEl.getAnimations?.().forEach(a => a.cancel());
      if (mode === 'assemble') {
        void motion.assemble(speechEl, text);
      } else if (mode === 'decode') {
        void motion.decode(speechEl, text);
      } else {
        speechEl.textContent = text;
        void motion.animate(
          speechEl,
          [
            { opacity: 0.25, translate: '0px 6px' },
            { opacity: 1, translate: '0px 0px' },
          ],
          { duration: 340 }
        );
      }
    }

    function getContextualChoices(topic) {
      if (copy === COPY.en) {
        if (topic === 'moved') {
          return [
            { id: 'why-blank', label: 'Why leave so much space between the lines?' },
            { id: 'touch-prism', label: 'Tap the corner prism' },
            { id: 'test-pulse', label: 'Play a round of breakout' },
            { id: 'return-normal', label: 'Fold back to the normal page' },
          ];
        }
        return [
          { id: 'what-doing', label: 'What were you adjusting by the window?' },
          { id: 'shift-layout', label: 'Shift the daylight angle' },
          { id: 'test-pulse', label: 'Play a round of breakout' },
          { id: 'return-normal', label: 'Fold back to the normal page' },
        ];
      }
      if (topic === 'moved') {
        return [
          { id: 'why-blank', label: '为什么在字行之间留这么多空隙？' },
          { id: 'touch-prism', label: '碰一下桌角的三棱镇纸' },
          { id: 'test-pulse', label: '在整页打一局弹球' },
          { id: 'return-normal', label: '先折回原来的主页' },
        ];
      }
      return [
        { id: 'what-doing', label: '刚才你在窗边调什么？' },
        { id: 'shift-layout', label: '换个光线切进来的角度' },
        { id: 'test-pulse', label: '来打一局弹球吧' },
        { id: 'return-normal', label: '先折回原来的主页' },
      ];
    }

    function renderContextualReplies(topic = replyTopic) {
      replyTopic = topic;
      if (!repliesBox) return;
      const choices = getContextualChoices(topic);
      repliesBox.replaceChildren(
        ...choices.map(item => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'p34-reply-option';
          btn.dataset.p34Reply = item.id;
          btn.textContent = item.label;
          return btn;
        })
      );
    }

    renderContextualReplies('initial');

    function toggleOrigDrawer(forceOpen) {
      if (!origDrawerBody || !origDrawerBtn) return;
      const nextOpen = forceOpen !== undefined ? Boolean(forceOpen) : origDrawerBody.hidden;
      origDrawerBody.hidden = !nextOpen;
      origDrawerBtn.setAttribute('aria-expanded', String(nextOpen));
      origDrawerBtn.textContent = nextOpen ? copy.drawerCloseBtn : copy.drawerOpenBtn;
      if (nextOpen) {
        void motion.animate(
          origDrawerBody,
          [
            { opacity: 0, translate: '0px -8px' },
            { opacity: 1, translate: '0px 0px' },
          ],
          { duration: 280 }
        );
      }
    }

    function cyclePose(customSpeech) {
      poseIndex = (poseIndex + 1) % poses.length;
      const nextPose = poses[poseIndex];
      void motion.layout(movableModules(), () => {
        root.dataset.p34Pose = nextPose;
      }, 18);
      if (customSpeech) {
        speak(customSpeech, 'assemble');
      } else {
        speak(
          copy === COPY.en
            ? 'There—I shifted the window spans so the daylight cuts through at a fresh angle.'
            : '好啦，我把这几扇视窗的宽窄重新错开了一点，天光切进来的角度也不一样了。',
          'assemble'
        );
      }
    }

    function handleTouchObject() {
      if (!focalPrism) return;
      const wasDropped = focalPrism.dataset.p34Dropped === 'true';
      if (wasDropped) {
        delete focalPrism.dataset.p34Dropped;
        prismStep = 1;
        if (objStateEl) objStateEl.textContent = copy.prismAlignedState;
        void deformSurface(motion, focalPrism, { dy: -8, tilt: 2.2, color: '#45D4F2' });
        motion.tone(2, true);
        speak(
          copy === COPY.en
            ? 'Thanks! It clicked right back into place.'
            : '咔哒——刚好放稳啦，谢谢你帮我扶正！'
        );
        return;
      }

      prismStep = (prismStep + 1) % 3;
      const states = copy === COPY.en
        ? ['Set steady · Clear beam', 'Dual beam · Wide refraction', 'Warm gold rim · Evening angle']
        : ['已放稳 · 光路通畅', '双束分光 · 宽幅折射', '暖金边光 · 傍晚斜角'];
      const lines = copy === COPY.en
        ? [
            'Back to the clear baseline—clean and weightless.',
            'Tilted the prism—watch the split beam widen across the desk.',
            'Added a touch of warm gold refraction along the edge.',
          ]
        : [
            '转回最清爽的基准角度啦，整张工作台通透多了。',
            '把棱镜稍微拨偏了一点，你看折出来的光束变宽了！',
            '换成了带一点暖金色的折射角，像傍晚照进窗框的光。',
          ];
      if (objStateEl) objStateEl.textContent = states[prismStep];
      if (rayCyan) rayCyan.setAttribute('y2', prismStep === 1 ? '32' : prismStep === 2 ? '68' : '54');
      if (rayGold) rayGold.setAttribute('y2', prismStep === 1 ? '118' : prismStep === 2 ? '88' : '104');
      void deformSurface(motion, focalPrism, {
        dx: prismStep === 1 ? 6 : -4,
        dy: -6,
        tilt: prismStep === 1 ? 2.4 : -1.8,
        color: prismStep === 2 ? '#FFB76D' : '#45D4F2',
      });
      motion.tone((prismStep + 3) % 6, true);
      speak(lines[prismStep]);
    }

    function runExperiment(mode = null) {
      if (mode) {
        for (const btn of page.querySelectorAll('[data-exp-mode]')) {
          btn.setAttribute('aria-pressed', String(btn.dataset.expMode === mode));
        }
      }
      const activeBtn = page.querySelector('[data-exp-mode][aria-pressed="true"]');
      const currentMode = activeBtn?.dataset.expMode || 'cyan';
      const configs = {
        cyan: {
          wave: 'M 12 44 Q 140 4 260 44 T 508 44',
          color: '#45D4F2',
          cx: '260',
          state: copy.expModeCyan,
          line: copy === COPY.en
            ? 'Clear cyan rings out light and quick.'
            : '清透青的音色最轻，弹一下就散开了。',
        },
        blue: {
          wave: 'M 12 44 Q 130 80 260 44 T 508 44',
          color: '#1E8ECA',
          cx: '340',
          state: copy.expModeBlue,
          line: copy === COPY.en
            ? 'Sky blue is tuned firmer—a crisp rebound.'
            : '晴空蓝绷得紧一点，回音很干脆。',
        },
        gold: {
          wave: 'M 12 44 Q 160 -6 260 44 T 508 44',
          color: '#FFB76D',
          cx: '185',
          state: copy.expModeGold,
          line: copy === COPY.en
            ? 'Warm gold lingers a bit longer, like evening light.'
            : '晨光金慢悠悠的，像傍晚照进来的光。',
        },
      };
      const cfg = configs[currentMode] || configs.cyan;
      if (expWave) {
        expWave.setAttribute('d', cfg.wave);
        expWave.setAttribute('stroke', cfg.color);
      }
      if (expNode) {
        expNode.setAttribute('cx', cfg.cx);
        expNode.setAttribute('fill', cfg.color);
      }
      if (expStateEl) expStateEl.textContent = cfg.state;
      void deformSurface(motion, expBench, { dy: 8, tilt: currentMode === 'blue' ? -1.1 : 1.8, color: cfg.color });
      motion.tone(currentMode === 'gold' ? 4 : 1, true);
      speak(cfg.line);
    }

    function cycleWind() {
      windStep = (windStep + 1) % 3;
      if (windPiece) windPiece.dataset.windStep = String(windStep);
      const states = [copy.windState0, copy.windState1, copy.windState2];
      if (windStateEl) windStateEl.textContent = states[windStep];
      if (windPiece) {
        void deformSurface(motion, windPiece, { dx: windStep === 1 ? 6 : -4, dy: -5, tilt: windStep === 1 ? 1.5 : -1.2 });
      }
      motion.tone(windStep + 2, true);
      const lines = copy === COPY.en
        ? [
            'Settled the lines back to a calm cadence.',
            'See how the middle line steps aside when a breeze passes through?',
            'Opened extra breathing room between the lines.',
          ]
        : [
            '把字行收拢回最自然的节奏啦。',
            '你看，把第一句轻轻提起来，中间那行字就会往旁边让开一点。',
            '把行距再拉开一点，留出来的空白就像有风吹过去一样。',
          ];
      speak(lines[windStep]);
    }

    function applyTint(mode) {
      for (const btn of page.querySelectorAll('[data-tint-mode]')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.tintMode === mode));
      }
      root.dataset.p34Tint = mode;
      const map = {
        clear: {
          state: copy.tintStateClear,
          color: '#45D4F2',
          line: copy === COPY.en
            ? 'Switched to the clear sky filter—crisp daylight across the desk.'
            : '调回晴空透光滤片啦，整张工作台都是清透的冷白光线。',
        },
        sea: {
          state: copy.tintStateSea,
          color: '#1E8ECA',
          line: copy === COPY.en
            ? 'Tilted in the shallow-sea filter—a cool cyan shimmer along the window edges.'
            : '换上了浅海折光滤片，窗框边多了一层淡淡的青蓝色水光。',
        },
        dusk: {
          state: copy.tintStateDusk,
          color: '#FFB76D',
          line: copy === COPY.en
            ? 'Slid in the evening filter—warm gold edges meeting the cool cyan glass.'
            : '切到了傍晚斜角滤片，冷白玻璃边上染了一圈暖金色。',
        },
      };
      const cfg = map[mode] || map.clear;
      if (tintStateEl) tintStateEl.textContent = cfg.state;
      if (filterPiece) void deformSurface(motion, filterPiece, { dy: -5, tilt: 1.4, color: cfg.color });
      motion.tone(mode === 'dusk' ? 4 : 3, true);
      speak(cfg.line);
    }

    function updateBreakoutBadge() {
      if (!bestBadgeEl) return;
      const stats = readBreakoutCookie();
      if (stats.runs > 0) {
        bestBadgeEl.hidden = false;
        bestBadgeEl.textContent = copy === COPY.en
          ? `Best ${stats.bestScore} · ${stats.runs} run${stats.runs > 1 ? 's' : ''}`
          : `最高 ${stats.bestScore} 分 · 已玩 ${stats.runs} 局`;
      }
    }

    function launchBreakout() {
      if (activeBreakoutCleanup) return;
      root.classList.add('p34-playing');
      const lang = document.documentElement.lang || '';
      activeBreakoutCleanup = startBreakoutGame({
        page,
        motion,
        speak: text => speak(text),
        onExit: () => {
          root.classList.remove('p34-playing');
          activeBreakoutCleanup = null;
          updateBreakoutBadge();
          speak(
            copy === COPY.en
              ? 'Put the paddle away and restored every cleaved piece.'
              : '球板收好啦，撞开的折角和字行也都恢复原样了。'
          );
          const startBreakoutBtn = page.querySelector('[data-p34-action="start-breakout"]');
          startBreakoutBtn?.focus?.({ preventScroll: true });
        },
        lang,
      });
    }

    // Wire page-wide interactions
    listen(page, 'click', e => {
      const actionEl = e.target.closest('[data-p34-action], [data-exp-mode], [data-tint-mode], [data-p34-reply]');
      if (!actionEl) return;

      if (actionEl.dataset.expMode) {
        runExperiment(actionEl.dataset.expMode);
        return;
      }

      if (actionEl.dataset.tintMode) {
        applyTint(actionEl.dataset.tintMode);
        return;
      }

      if (actionEl.dataset.p34Reply) {
        const replyId = actionEl.dataset.p34Reply;
        if (replyId === 'what-doing') {
          speak(
            copy === COPY.en
              ? 'I pushed the right window frame outward a bit so the beam from the prism can spread across the desk.'
              : '刚把右边的窗框往外推了一点，好让三棱镜折出来的光束能顺着桌面铺开。'
          );
          renderContextualReplies('moved');
        } else if (replyId === 'shift-layout') {
          cyclePose();
          renderContextualReplies('moved');
        } else if (replyId === 'why-blank') {
          cycleWind();
          renderContextualReplies('initial');
        } else if (replyId === 'return-normal') {
          void sendBack();
        } else if (replyId === 'touch-prism') {
          handleTouchObject();
        } else if (replyId === 'test-pulse') {
          launchBreakout();
        }
        return;
      }

      const action = actionEl.dataset.p34Action;
      switch (action) {
        case 'toggle-sound': {
          const next = !motion.sound;
          motion.setSound(next);
          if (soundBtn) {
            soundBtn.setAttribute('aria-pressed', String(next));
            soundBtn.textContent = next ? copy.soundOn : copy.soundOff;
          }
          break;
        }
        case 'cycle-pose':
          cyclePose();
          break;
        case 'send-back':
          void sendBack();
          break;
        case 'toggle-replies': {
          if (!repliesBox || !engageBtn) break;
          const open = repliesBox.hidden;
          repliesBox.hidden = !open;
          engageBtn.setAttribute('aria-expanded', String(open));
          engageBtn.textContent = open ? copy.engageClose : copy.engageOpen;
          if (open) {
            void motion.animate(
              repliesBox,
              [
                { opacity: 0, translate: '0px -6px' },
                { opacity: 1, translate: '0px 0px' },
              ],
              { duration: 240 }
            );
          }
          break;
        }
        case 'toggle-orig-drawer':
          toggleOrigDrawer();
          break;
        case 'touch-object':
          handleTouchObject();
          break;
        case 'run-experiment':
          runExperiment();
          break;
        case 'cycle-wind':
          cycleWind();
          break;
        case 'start-breakout':
          launchBreakout();
          break;
        case 'inspect-note': {
          const idx = Number(actionEl.dataset.noteIndex || 0);
          const noteItem = copy.notes[idx];
          const noteCard = actionEl.closest('.p34-note-card');
          if (!noteItem) break;
          speak(noteItem.speech);
          if (noteCard) {
            const extraEl = noteCard.querySelector('[data-note-extra]');
            if (extraEl) {
              const willShow = extraEl.hidden;
              extraEl.hidden = !willShow;
              actionEl.textContent = willShow ? (noteItem.actionOpen || noteItem.action) : noteItem.action;
            }
            void deformSurface(motion, noteCard, { dy: -6, tilt: 1.5 });
          }
          if (noteItem.targetKind === 'prism') {
            handleTouchObject();
          }
          break;
        }
        case 'flip-piece': {
          pieceFlipped = !pieceFlipped;
          const card = page.querySelector('.p34-loose-draft');
          if (piece1Text) {
            piece1Text.textContent = pieceFlipped ? copy.piece1Flipped : copy.piece1Body;
          }
          if (card) void deformSurface(motion, card, { dy: -5, tilt: pieceFlipped ? 1.6 : -1.6 });
          speak(
            pieceFlipped
              ? (copy === COPY.en ? 'You flipped over my sketch note—chain five bounces in breakout and I will mend a fractured piece for you.' : '被你翻到背面啦——打弹球连撞五下的时候，我真的会出手帮你把撞裂的边角拼回去。')
              : (copy === COPY.en ? 'Flipped the sketch back to the front.' : '把这张草稿翻回正面啦。')
          );
          break;
        }
        case 'next-quote': {
          quoteIndex = (quoteIndex + 1) % stickyPool.length;
          const nextQuote = `「${stickyPool[quoteIndex]}」`;
          if (stickyQuoteEl) void motion.assemble(stickyQuoteEl, nextQuote);
          speak(
            copy === COPY.en
              ? 'Swapped in another slip from the corner.'
              : '替你换了一张夹在桌角的便签。'
          );
          break;
        }
        case 'discover-seam': {
          const res = discover(getStory(), 'mirror-page');
          setStory(res.story);
          if (seamBtn) seamBtn.setAttribute('aria-expanded', 'true');
          if (seamTextEl) void motion.decode(seamTextEl, copy.seamRevealed);
          void deformSurface(motion, page.querySelector('.p34-seam-note'), { dy: -5, tilt: 1.4, color: '#FFB76D' });
          motion.tone(4, true);
          speak(
            copy === COPY.en
              ? 'You found it—I jotted that down in the corner while practicing rebounds.'
              : '被你翻到啦——那是我练习接球时随手记在页角的。'
          );
          break;
        }
        default:
          break;
      }
    });

    // Keyboard activation for the prism sculpture
    const prismBtn = page.querySelector('.p34-prism-sculpture');
    if (prismBtn) {
      listen(prismBtn, 'keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTouchObject();
        }
      });
    }

    // Observe clicks on the real #services-open button inside the secondary drawer
    const liveServicesBtn = document.getElementById('services-open');
    if (liveServicesBtn) {
      listen(liveServicesBtn, 'click', () => {
        later(() => {
          const expanded = liveServicesBtn.getAttribute('aria-expanded') === 'true';
          if (expanded) {
            speak(
              copy === COPY.en
                ? 'Unfolded the tools sub-drawer.'
                : '把「软件与服务」也展开啦。'
            );
          }
        }, 40);
      });
    }

    root.classList.add('p34-ready');

    // First-encounter / morph transition from normal layout using WAAPI/FLIP & letter assembly
    if (root.dataset.p34Entry !== 'quiet') {
      const afterPaper = main.getBoundingClientRect();
      if (beforePaper.width && afterPaper.width) {
        void motion.animate(
          main,
          [
            {
              translate: `${beforePaper.x - afterPaper.x}px ${beforePaper.y - afterPaper.y}px`,
              scale: `${(beforePaper.width / afterPaper.width).toFixed(3)} ${(beforePaper.height / afterPaper.height).toFixed(3)}`,
            },
            { translate: '0px 0px', scale: '1 1' },
          ],
          { duration: 960 }
        );
      }

      if (titleOriginRect && titleOriginRect.width && ownerEl) {
        const toTitle = ownerEl.getBoundingClientRect();
        void motion.animate(
          ownerEl,
          [
            {
              translate: `${titleOriginRect.x - toTitle.x}px ${titleOriginRect.y - toTitle.y}px`,
              scale: '0.84',
              opacity: 0.35,
            },
            { translate: '0px 0px', scale: '1', opacity: 1 },
          ],
          { duration: 920 }
        );
      }

      if (speechEl) {
        void motion.assemble(speechEl, speechEl.textContent, sources);
        void motion.liftGlyphs(sources, speechEl);
      }

      if (first && focalPrism) {
        later(() => {
          void motion.animate(
            focalPrism,
            [
              { translate: '0px -16px', rotate: '2.2deg', scale: '1.02' },
              { translate: '0px 8px', rotate: '-3.6deg', scale: '1.02 0.97', offset: 0.58 },
              { translate: '0px 0px', rotate: '0deg', scale: '1' },
            ],
            { duration: 760 }
          );
        }, 420);
      }
    }
  }

  let styleReady = false;
  let surfaceReady = !document.querySelector('.notebook-page') || document.body?.dataset.surfaceReady === 'true';

  function tryEnter() {
    if (!styleReady || !surfaceReady || destroyed || mounted) return;
    later(enter, root.dataset.p34Entry === 'quiet' ? 0 : 120);
  }

  if (!surfaceReady) {
    listen(
      window,
      'sayori:surface-ready',
      () => {
        surfaceReady = true;
        tryEnter();
      },
      { once: true }
    );
  }

  let style = document.querySelector('link[data-p34-luminous-style], link[data-p34-living-style]');
  if (!style) {
    style = document.createElement('link');
    style.rel = 'stylesheet';
    style.dataset.p34LuminousStyle = '';
    document.head.append(style);
  }
  if (!style.href.includes('p34-luminous.css')) {
    style.href = STYLE_HREF;
  }
  if (style.sheet) {
    styleReady = true;
    tryEnter();
  } else {
    listen(
      style,
      'load',
      () => {
        styleReady = true;
        tryEnter();
      },
      { once: true }
    );
  }
  listen(
    style,
    'error',
    () => {
      throw new Error('Project 34 luminous stylesheet did not load');
    },
    { once: true }
  );

  listen(window, 'p34:send-back', () => void sendBack());
  listen(window, 'paper:return', () => void sendBack());

  function cleanup() {
    if (destroyed) return;
    destroyed = true;
    restore();
    controller.abort();
    timers.forEach(clearTimeout);
    timers.clear();
    delete root.dataset.p34Entry;
    activeMounts.delete(root);
  }

  listen(window, 'pagehide', cleanup, { once: true });
  activeMounts.set(root, cleanup);
  return cleanup;
}

export { mountLuminousHome as mountLivingWorld };
