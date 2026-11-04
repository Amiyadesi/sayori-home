import {
  WORLD_COOKIE_KEY,
  readWorldCookie,
  advanceEncounterState,
  serializeWorldState,
  createWorldSession,
} from './p34-living.js?v=20261104-pixelfx';
import { createMotion, segmentGraphemes } from './p34-motion.js?v=20261104-pixelfx';
import { discover } from './p34-story.js?v=20261104-pixelfx';
import { startBreakoutGame } from './p34-breakout.js?v=20261104-pixelfx';
import { readBreakoutCookie } from './p34-breakout-state.js?v=20261104-pixelfx';
import { createParticleStage } from './p34-fx.js?v=20261104-pixelfx';

const STYLE_HREF = '/p34-luminous.css?v=20261104-pixelfx';

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
    pageTitle: '嘿，你来啦。', blog: '我写的',
    headline: ['诶？', '有人来了！'], again: ['噢！', '是你呀。'],
    first: '等一下，那个还没放稳——', returning: '这次想先碰哪个？',
    fromBlog: '看完了？来，换我给你看点好玩的。',
    play: '打乱这里', pull: '拉一下', talk: '找我？', close: '先这样',
    lower: ['再', '来', '一', '下', '！'], secret: '这里也藏着东西。',
  },
  en: {
    pageTitle: 'Oh! You are here.', blog: 'My scribbles',
    headline: ['Oh!', 'Someone’s here!'], again: ['Hey!', 'You’re back.'],
    first: 'Wait, that one isn’t attached yet—', returning: 'What shall we poke first?',
    fromBlog: 'Done reading? Come on, let me show you something.',
    play: 'Make a mess', pull: 'Pull me', talk: 'Hey?', close: 'Later',
    lower: ['O', 'N', 'C', 'E', '!'], secret: 'Something is hiding here, too.',
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
 * Hit -> crisp body recoil -> spring recovery + staged PixelFX burst.
 */
export function deformSurface(motion, el, options = {}) {
  if (!el || !motion) return Promise.resolve();
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return Promise.resolve();
  const cx = Number.isFinite(options.x) ? options.x : rect.left + rect.width * 0.5;
  const cy = Number.isFinite(options.y) ? options.y : rect.top + rect.height * 0.42;
  const dx = Number.isFinite(options.dx) ? options.dx : 0;
  const dy = Number.isFinite(options.dy) ? options.dy : 9;
  const tilt = Number.isFinite(options.tilt) ? options.tilt : -2.1;
  const accent = options.color || '#5470FF';

  if (options.fx) {
    const pal = accent === '#FFE747' ? 'gold' : accent === '#E66CEB' ? 'arcane' : 'blue';
    if (options.fxMode === 'spark') {
      options.fx.directionalSpark(cx, cy, options.aimAngle ?? -Math.PI / 3, { palette: pal });
    } else {
      options.fx.collectBurst(cx, cy, { palette: pal, scale: options.fxScale || 0.95 });
    }
  } else if (!motion.reduced() && !document.hidden) {
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
        { transform: 'translate(-50%, -50%) scale(0.22)', opacity: 0.94 },
        { transform: 'translate(-50%, -50%) scale(1.22)', opacity: 0.58, offset: 0.5 },
        { transform: 'translate(-50%, -50%) scale(1.9)', opacity: 0 },
      ],
      { duration: 480, easing: 'cubic-bezier(.16, .84, .28, 1)' }
    ).then(() => ring.remove());
  }

  const baseRotate = getComputedStyle(el).rotate;
  const restRotate = baseRotate && baseRotate !== 'none' ? baseRotate : '0deg';
  return motion.animate(
    el,
    [
      { translate: '0px 0px', scale: '1 1', rotate: restRotate },
      { translate: `${dx}px ${dy}px`, scale: '1.036 0.952', rotate: `${tilt}deg`, offset: 0.16 },
      { translate: `${(-dx * 0.45).toFixed(1)}px ${(-dy * 0.45).toFixed(1)}px`, scale: '0.985 1.024', rotate: `${(-tilt * 0.48).toFixed(2)}deg`, offset: 0.46 },
      { translate: `${(dx * 0.16).toFixed(1)}px ${(dy * 0.16).toFixed(1)}px`, scale: '1.006 0.996', rotate: `${(tilt * 0.14).toFixed(2)}deg`, offset: 0.76 },
      { translate: '0px 0px', scale: '1 1', rotate: restRotate },
    ],
    { duration: options.duration || 580, easing: 'cubic-bezier(.22, 1, .36, 1)' }
  );
}

const activeMounts = new WeakMap();

export function mountLuminousHome() {
  if (typeof location === 'undefined' || new URLSearchParams(location.search).get('paper') !== '0617') {
    return () => {};
  }
  const root = document.documentElement;
  if (activeMounts.has(root)) return activeMounts.get(root);

  const controller = new AbortController();
  const { signal } = controller;
  const motion = createMotion(signal);
  const fx = createParticleStage({ signal, motion });
  const main = document.querySelector('#main-content, main');
  if (!main) throw new Error('Project 34 needs the original main element');

  const original = document.createDocumentFragment();
  const parked = [];
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
    timers.forEach(clearTimeout);
    timers.clear();
    fx.clearAll();
    restoreLinks();
    if (activeBreakoutCleanup) {
      activeBreakoutCleanup();
      activeBreakoutCleanup = null;
    }

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
    const headlineEl = page?.querySelector('.p34-head-word');
    const fromRect = (headlineEl || main).getBoundingClientRect();
    if (speechEl) {
      speechEl.textContent = getCopy() === COPY.en
        ? 'Sure. See you on this side again?'
        : '好。下次还来这边找我？';
    }
    if (page) {
      await motion.animate(
        page,
        [
          { opacity: 1, translate: '0px 0px' },
          { opacity: 0, translate: '0px -14px' },
        ],
        { duration: 260 }
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
          { translate: `${fromRect.x - toRect.x}px ${fromRect.y - toRect.y}px`, scale: '0.92' },
          { translate: '0px 0px', scale: '1' },
        ],
        { duration: 480 }
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
    later(cleanup, 540);
  }

  function enter() {
    if (destroyed || mounted) return;
    const copy = getCopy();

    const beforePaper = main.getBoundingClientRect();
    const titleOriginEl = main.querySelector('.page-title, .letter-title, h1');
    const titleOriginRect = titleOriginEl?.getBoundingClientRect();
    const sources = sourcePoints();

    const encounter = advanceEncounterState(readWorldCookie(document.cookie), 'home');
    let story = getStory();
    const first = !story.met || encounter.encounterType === 'home-first';
    story = setStory({
      ...story,
      met: 1,
      chapter: story.chapter === 'arrive' ? 'explore' : story.chapter,
    });
    cookie(WORLD_COOKIE_KEY, serializeWorldState(encounter.state));

    // Park all normal content intact in its fragment/comment anchors for clean restore
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
    mounted = true;

    const initialSpeech = encounter.encounterType === 'home-from-blog'
      ? copy.fromBlog
      : first
        ? copy.first
        : copy.returning;

    document.title = copy.pageTitle;


    const en = copy === COPY.en;
    const headline = first ? copy.headline : copy.again;
    page = document.createElement('div');
    page.className = 'p34-page';
    page.innerHTML = `
      <header class="p34-horizon">
        <button type="button" class="p34-signature" data-p34-action="shuffle" aria-label="${en ? 'Rearrange my page' : '换个摆法'}">34<span aria-hidden="true">.</span></button>
        <a class="p34-blog-link" href="https://blog.sayori.org/?paper=0617">${copy.blog}<span aria-hidden="true">↗</span></a>
      </header>
      <section class="p34-playground" aria-label="${en ? 'Her corner of the web' : '她的网页'}">
        <svg class="p34-ribbon" viewBox="0 0 1200 900" preserveAspectRatio="none" aria-hidden="true"><path d="M-80 640 C120 930 430 810 370 620 S180 420 210 295 S550 160 680 340 S1140 560 1300 60"/><path class="p34-ribbon-dotted" d="M740 -40 C610 120 820 350 1010 290 S1230 630 1020 910"/></svg>
        <h1 class="p34-headline"><button type="button" class="p34-head-word" data-p34-target="title" data-p34-action="poke-word">${headline[0]}</button><button type="button" class="p34-head-word" data-p34-target="title" data-p34-action="poke-word">${headline[1]}</button></h1>
        <div class="p34-loop-home">
          <svg class="p34-tether" viewBox="-280 -280 560 560" aria-hidden="true"><path d="M0 0 Q0 -80 0 -190"/></svg>
          <button type="button" class="p34-pull-loop" data-p34-target="experiment" aria-label="${en ? 'Pull the loop and let go' : '拽住这个圈，松手试试'}">
            <svg viewBox="0 0 240 240" aria-hidden="true"><defs><linearGradient id="p34-loop-fill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FFB4F5"/><stop offset=".5" stop-color="#E66CEB"/><stop offset="1" stop-color="#A542E7"/></linearGradient></defs><path fill-rule="evenodd" d="M126 12 C208 -4 251 100 213 178 C182 246 58 243 22 176 C-13 112 39 29 126 12Z M126 74 C87 77 59 119 77 148 C93 177 150 180 167 147 C184 114 164 70 126 74Z" fill="url(#p34-loop-fill)"/><path d="M41 89 C63 46 105 31 143 35" fill="none" stroke="#FFE0FB" stroke-width="7" stroke-linecap="round"/><path d="M78 149 C107 191 166 174 177 141" fill="none" stroke="#6523A8" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/></svg>
            <span class="p34-pull-label">${copy.pull}<span aria-hidden="true">↙</span></span>
          </button>
        </div>
        <div class="p34-voice-place">
          <p class="p34-speech-line" aria-live="polite">${initialSpeech}</p>
          <button type="button" class="p34-talk-trigger" data-p34-action="toggle-replies" aria-expanded="false" aria-controls="p34-home-answers"><span aria-hidden="true">···</span><span class="p34-talk-label">${copy.talk}</span></button>
          <div id="p34-home-answers" class="p34-context-replies" hidden></div>
        </div>
        <div class="p34-play-invitation" data-p34-target="work">
          <svg class="p34-play-orbit" viewBox="0 0 250 250" aria-hidden="true"><ellipse cx="125" cy="125" rx="120" ry="50" transform="rotate(-28 125 125)"/></svg>
          <button type="button" class="p34-play-btn" data-p34-action="start-breakout"><span aria-hidden="true">↗</span><strong>${copy.play}</strong></button>
          <span class="p34-best-badge" data-p34-best-badge hidden></span>
        </div>
        <button type="button" class="p34-loose-mark p34-question" data-p34-target="detail" data-p34-action="question" aria-label="${en ? 'Question mark' : '问号'}">?</button>
        <button type="button" class="p34-loose-mark p34-bang" data-p34-target="detail" data-p34-action="bang" aria-label="${en ? 'Exclamation mark' : '感叹号'}">!</button>
        <a class="p34-down" href="#p34-spill" aria-label="${en ? 'Look down here' : '往下看看'}">↓</a>
      </section>
      <section class="p34-spill" id="p34-spill" aria-label="${en ? 'Unfinished business' : '还没收拾的地方'}">
        <svg class="p34-spill-loop" viewBox="0 0 1100 650" preserveAspectRatio="none" aria-hidden="true"><path d="M-40 250 C230 -20 900 -30 920 180 S120 610 150 410 S830 300 1150 610"/></svg>
        <div class="p34-loose-words">${copy.lower.map((word,i) => `<button type="button" class="p34-loose-word" data-p34-target="title" data-p34-action="loose-word" style="--i:${i}">${word}</button>`).join('')}</div>
        <button type="button" class="p34-marble" data-p34-action="marble" data-p34-target="detail" aria-label="${en ? 'Unwrap this ball' : '碰一下这颗球'}"><span aria-hidden="true">≈</span></button>
        <button type="button" class="p34-zipper" data-p34-action="discover-seam" aria-label="${en ? 'Pull the loose end' : '拉开这条缝'}" aria-expanded="false"><svg viewBox="0 0 420 70" aria-hidden="true"><path d="M5 20 Q100 45 200 22 T380 25"/><circle cx="394" cy="26" r="12"/></svg></button>
        <div class="p34-seam-reveal" hidden><p>${en ? 'Okay, you found my spare button.' : '好吧，被你翻到备用按钮了。'}</p><button type="button" data-p34-action="shuffle">${en ? 'Don’t press it' : '不许按'}</button></div>
        <small class="p34-bottom-scribble" data-p34-target="detail">${en ? 'not finished. not tidying up.' : '还没做完。不收拾。'}</small>
      </section>`;
    main.append(page);
    page.querySelectorAll('a[href]').forEach(adaptLink);
    const words = [...page.querySelectorAll('.p34-head-word')];
    const speechEl = page.querySelector('.p34-speech-line');
    const talkTrigger = page.querySelector('.p34-talk-trigger');
    const answers = page.querySelector('.p34-context-replies');
    const star = page.querySelector('.p34-pull-loop');
    const tether = page.querySelector('.p34-tether path');
    const launcher = page.querySelector('.p34-play-invitation');
    const looseWords = [...page.querySelectorAll('.p34-loose-word')];
    const moving = [...words, page.querySelector('.p34-loop-home'), page.querySelector('.p34-voice-place'), launcher, ...page.querySelectorAll('.p34-loose-mark'), ...looseWords];
    let shuffleStep = 0;
    let touched = 0;
    let dodges = 0;
    let dragging = null;
    let releaseClick = false;

    function speak(text, animate = false) {
      motion.cancelText(speechEl);
      speechEl.getAnimations().forEach(a => a.cancel());
      if (animate) void motion.decode(speechEl, text);
      else speechEl.textContent = text;
    }
    function center(el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    function bump(el, x = 0, y = -18, angle = -4) {
      void deformSurface(motion, el, { dx:x, dy:y, tilt:angle });
    }
    function scatterFrom(el, palette = 'arcane') {
      const o = center(el);
      const targets = [...words, ...looseWords].filter(target => {
        const r = target.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight;
      }).map((target, i) => ({ ...center(target), onHit: () => {
        bump(target, i % 2 ? 24 : -20, -16, i % 2 ? 6 : -6);
        motion.tone(i % 5, true);
      } }));
      fx.homingVolley(o.x, o.y, targets, { palette });
    }
    function shuffle() {
      if (activeBreakoutCleanup) return;
      shuffleStep = (shuffleStep + 1) % 3;
      void motion.layout(moving, () => { page.dataset.shuffle = String(shuffleStep); }, 22);
      const c = center(star);
      fx.manaNova(c.x, c.y, { palette: shuffleStep === 1 ? 'gold' : 'cyan', scale: 1.15 });
      speak(en ? ['Much better.', 'Wait. Like THIS.', 'No, no. Move over.'][shuffleStep] : ['这回顺眼了。', '等一下，我换个摆法。', '你别动，我来挪。'][shuffleStep]);
    }
    function updateBest() {
      const stats = readBreakoutCookie();
      const badge = page.querySelector('[data-p34-best-badge]');
      badge.hidden = !stats.runs;
      if (stats.runs) badge.textContent = `${en ? 'best' : '最高'} ${stats.bestScore}`;
    }
    updateBest();
    function launchBreakout() {
      if (activeBreakoutCleanup) return;
      closeChat();
      root.classList.add('p34-playing');
      activeBreakoutCleanup = startBreakoutGame({ page, motion, fx, speak,
        onExit() {
          root.classList.remove('p34-playing');
          activeBreakoutCleanup = null;
          updateBest();
          speak(en ? 'There. Pretend that didn’t happen.' : '好了。假装刚才什么都没发生。');
          page.querySelector('.p34-play-btn').focus({ preventScroll:true });
        }, lang: document.documentElement.lang || '' });
    }
    function closeChat() {
      void motion.layout(moving, () => { delete page.dataset.chat; }, 10);
      answers.hidden = true;
      talkTrigger.setAttribute('aria-expanded', 'false');
      root.classList.remove('p34-talking');
    }
    function openChat() {
      if (!answers.hidden) { closeChat(); return; }
      answers.hidden = false;
      talkTrigger.setAttribute('aria-expanded', 'true');
      root.classList.add('p34-talking');
      const choices = en
        ? [['you','Who’s moving all this?'],['shuffle','Can you move that?'],['return-normal','Send me back?']]
        : [['you','刚才是你在动？'],['shuffle','还能换个摆法？'],['return-normal','送我回去吧。']];
      answers.replaceChildren(...choices.map(([id,label]) => {
        const b = document.createElement('button'); b.type='button'; b.dataset.p34Reply=id; b.textContent=label; return b;
      }));
      const sound = document.createElement('button'); sound.type='button'; sound.dataset.p34Action='sound';
      sound.textContent='♪'; sound.setAttribute('aria-label', en ? 'Toggle sound' : '开关声音');
      sound.setAttribute('aria-pressed', String(motion.sound)); answers.append(sound);
      void motion.layout(moving, () => { page.dataset.chat = 'open'; }, 10);
      void motion.animate(answers, [{ opacity:0, translate:'-12px 8px' }, { opacity:1, translate:'0 0' }], { duration:240 });
    }

    listen(star, 'pointerdown', e => {
      if (e.button !== 0 || activeBreakoutCleanup) return;
      e.preventDefault();
      star.setPointerCapture(e.pointerId);
      star.getAnimations().forEach(a => a.cancel());
      dragging = { id:e.pointerId, x:e.clientX, y:e.clientY, dx:0, dy:0 };
      star.classList.add('p34-grabbed');
      words.forEach(el => el.getAnimations().forEach(a => a.cancel()));
    });
    listen(star, 'pointermove', e => {
      if (!dragging || e.pointerId !== dragging.id) return;
      const max = Math.min(innerWidth * .32, 250);
      dragging.dx = Math.max(-max, Math.min(max, e.clientX-dragging.x));
      dragging.dy = Math.max(-200, Math.min(200, e.clientY-dragging.y));
      star.style.translate = `${dragging.dx}px ${dragging.dy}px`;
      star.style.rotate = `${dragging.dx * .11}deg`;
      words.forEach((el,i) => { el.style.translate=`${dragging.dx * (i ? -.11 : .06)}px ${dragging.dy * -.07}px`; });
      tether.setAttribute('d', `M${dragging.dx} ${dragging.dy} Q${dragging.dx*.25} ${dragging.dy*.3-80} 0 -190`);
    });
    function releaseStar(cancelled = false) {
      if (!dragging) return;
      const { dx,dy } = dragging;
      dragging = null;
      star.classList.remove('p34-grabbed');
      star.style.removeProperty('translate'); star.style.removeProperty('rotate');
      tether.setAttribute('d', 'M0 0 Q0 -80 0 -190');
      words.forEach(el=>{el.style.removeProperty('translate');});
      const pulled = Math.hypot(dx,dy) > 12;
      releaseClick = pulled;
      if (!cancelled) {
        if (pulled) {
          const c=center(star);
          fx.directionalSpark(c.x+dx,c.y+dy,Math.atan2(-dy,-dx),{palette:'gold'});
          scatterFrom(star, touched++ % 2 ? 'blue' : 'arcane');
          speak(en ? 'Ha! Again!' : (touched===1 ? '哈哈！你再拉远一点试试。' : '对对对，就这样！'));
          motion.tone(4,true);
        }
        void motion.animate(star,[
          {translate:`${dx}px ${dy}px`,rotate:`${dx*.11}deg`,scale:'1.04 .95'},
          {translate:`${-dx*.2}px ${-dy*.2}px`,rotate:`${-dx*.025}deg`,scale:'.94 1.08',offset:.45},
          {translate:`${dx*.06}px ${dy*.06}px`,rotate:'2deg',scale:'1.02 .99',offset:.72},
          {translate:'0px 0px',rotate:'0deg',scale:'1'}
        ],{duration:850,easing:'cubic-bezier(.22,.85,.28,1)'});
      }
    }
    listen(star,'pointerup',()=>releaseStar());
    listen(star,'pointercancel',()=>releaseStar(true));
    listen(star,'lostpointercapture',()=>releaseStar(true));
    listen(star,'click',()=>{
      if(releaseClick){ releaseClick=false; return; }
      scatterFrom(star); bump(star,0,-30,14); motion.tone(2,true);
      speak(en ? 'It stretches. Try pulling it.' : '不光能戳。拽住，松手！');
    });

    listen(page,'click',e=>{
      if (activeBreakoutCleanup) return;
      const button=e.target.closest('[data-p34-action], [data-p34-reply]');
      if(!button) return;
      const replyId=button.dataset.p34Reply;
      if(replyId){
        closeChat();
        if(replyId === 'return-normal') void sendBack();
        else if(replyId==='shuffle') shuffle();
        else { speak(en ? 'Me. This bit’s mine. And that. Actually, all of it.' : '是我。这一块是我的，那一块也是。……现在这一整页都是。',true); scatterFrom(star,'cyan'); }
        return;
      }
      const c=center(button);
      switch(button.dataset.p34Action){
        case 'toggle-replies': openChat(); break;
        case 'sound': motion.setSound(!motion.sound);button.setAttribute('aria-pressed',String(motion.sound));if(motion.sound)motion.tone(2,true);break;
        case 'shuffle': shuffle(); break;
        case 'poke-word':
          bump(button,(e.clientX-c.x)*.2,-24,5);fx.collectBurst(e.clientX||c.x,e.clientY||c.y,{palette:'cyan',scale:.8});
          speak(en ? 'Hey! That’s my sentence.' : '喂！我话还没说完。'); break;
        case 'start-breakout': launchBreakout(); break;
        case 'question':
          button.textContent=button.textContent==='?'?'!':'?';bump(button,-20,-25,-16);
          fx.manaNova(c.x,c.y,{palette:'blue',scale:.85});
          speak(en ? 'Exactly what I was about to ask you.' : '我还想问你呢。你怎么进来的？'); break;
        case 'bang':
          fx.parryClash(c.x,c.y,0,-1,{palette:'gold',scale:1.3});shuffle();
          speak(en ? 'Okay! Not a doorbell!' : '知道了！这不是门铃！'); break;
        case 'loose-word':
          bump(button,0,-70,18);fx.collectBurst(c.x,c.y,{palette:'gold',scale:1.1});
          touched++;
          if(touched%3===0){void motion.layout(looseWords,()=>{page.dataset.spill=page.dataset.spill==='scatter'?'gather':'scatter';},45);speak(en?'Fine. You can rearrange these.':'好好好，这几个字给你摆。');}
          break;
        case 'marble':
          fx.manaNova(c.x,c.y,{palette:'cyan',scale:1.5});
          scatterFrom(button,'blue');bump(button,0,-45,22);motion.tone(3,true);
          speak(en?'You found the loud one.':'这颗声音特别大。……你把声音打开了吗？');break;
        case 'discover-seam': {
          const reveal=page.querySelector('.p34-seam-reveal');
          button.setAttribute('aria-expanded',String(reveal.hidden));reveal.hidden=!reveal.hidden;
          if(!reveal.hidden){const result=discover(getStory(),'mirror-page');setStory(result.story);fx.directionalSpark(c.x,c.y,0,{palette:'gold'});}
          void motion.layout([page.querySelector('.p34-bottom-scribble')],()=>{},0);break;
        }
      }
    });
    listen(launcher,'pointerenter',()=>{
      if(dodges>=2 || activeBreakoutCleanup || root.classList.contains('p34-talking'))return;
      dodges++;
      void motion.layout([launcher],()=>{launcher.dataset.dodge=String(dodges);},0);
      speak(en ? (dodges===1?'Oops. Missed.':'Okay, okay. I’ll stop.') : (dodges===1?'没按到。':'好啦，不躲了。'));
    });
    listen(window,'keydown',e=>{if(e.key==='Escape'&&!answers.hidden){closeChat();talkTrigger.focus();}});
    let lastMove = performance.now();
    listen(page,'pointermove',()=>{lastMove=performance.now();},{passive:true});
    function idleMove(){
      if(!document.hidden&&!activeBreakoutCleanup&&!dragging&&answers.hidden&&performance.now()-lastMove>9000){
        const target=page.querySelector('.p34-question');
        bump(target,-12,-28,-12);
        const c=center(target);fx.directionalSpark(c.x,c.y,-Math.PI/3,{palette:'arcane',scale:.8});
        if(!touched) speak(en?'Psst. The loop stretches.':'喂。那个圈，是可以拽的。');
        return;
      }
      later(idleMove,14000);
    }
    later(idleMove,14000);
    listen(document,'visibilitychange',()=>{if(document.hidden)releaseStar(true);});
    root.classList.add('p34-ready');
    if(root.dataset.p34Entry!=='quiet'){
      const origin=titleOriginRect||beforePaper;
      moving.slice(0,7).forEach((el,i)=>{
        const r=el.getBoundingClientRect();
        void motion.animate(el,[{translate:`${(origin.x-r.x)*.35}px ${(origin.y-r.y)*.4}px`,rotate:`${i%2?12:-15}deg`,opacity:0,scale:'.76'},{translate:'0px 0px',opacity:1,rotate:getComputedStyle(el).rotate==='none'?'0deg':getComputedStyle(el).rotate,scale:'1'}],{duration:1050,delay:i*65});
      });
      void motion.assemble(speechEl,initialSpeech,sources);
      later(()=>{const c=center(star);fx.collectBurst(c.x,c.y,{palette:'gold',scale:1.15});},500);
      if(first) later(()=>{bump(star,8,30,-14);},950);
    }
  }

  let styleReady = false;
  let surfaceReady = !document.querySelector('.notebook-page') || document.body?.dataset.surfaceReady === 'true';

  function tryEnter() {
    if (!styleReady || !surfaceReady || destroyed || mounted) return;
    later(enter, root.dataset.p34Entry === 'quiet' ? 0 : 60);
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
  if (!style.href.includes('20261104-pixelfx')) {
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
