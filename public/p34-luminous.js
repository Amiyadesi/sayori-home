import {
  WORLD_COOKIE_KEY,
  readWorldCookie,
  advanceEncounterState,
  serializeWorldState,
  createWorldSession,
} from './p34-living.js?v=20261104-fold';
import { createMotion, segmentGraphemes } from './p34-motion.js?v=20261104-fold';
import { discover } from './p34-story.js?v=20261104-fold';
import { startBreakoutGame } from './p34-breakout.js?v=20261104-fold';
import { readBreakoutCookie } from './p34-breakout-state.js?v=20261104-fold';
import { createParticleStage } from './p34-fx.js?v=20261104-fold';

const STYLE_HREF = '/p34-luminous.css?v=20261104-fold';

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
    pageTitle: '……诶？', blog: '我写的东西',
    headline: ['等一下。', '还没放好！'], again: ['你来啦。', '快看这个。'],
    first: '先别动，我刚把这一边拎起来——', returning: '今天想拆哪一块？',
    fromBlog: '看完了？来，这次换你动手。',
    play: '打乱这里', talk: '说句话',
  },
  en: {
    pageTitle: 'Oh, hey.', blog: 'My writing',
    headline: ['Wait.', 'Not finished!'], again: ['Hey, you.', 'Look at this.'],
    first: 'Hold on. I was just moving this bit—', returning: 'What are we taking apart today?',
    fromBlog: 'Done reading? Your turn to make a mess.',
    play: 'Make a mess', talk: 'Say something',
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
  const accent = options.color || '#284CCE';

  if (options.fx) {
    const pal = accent === '#F6C668' ? 'gold' : accent === '#EF795F' ? 'arcane' : 'blue';
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
    page.dataset.arrangement = '0';
    page.innerHTML = `
      <section class="p34-room" aria-label="${en ? 'Her place' : '她的地方'}">
        <div class="p34-architecture" aria-hidden="true">
          <div class="p34-fold p34-fold-mist"></div>
          <div class="p34-fold p34-fold-page"></div>
          <div class="p34-fold p34-fold-ink"></div>
          <div class="p34-fold p34-fold-light"></div>
          <svg class="p34-thread" viewBox="0 0 1400 1000" preserveAspectRatio="none"><path d="M-80 760 C190 1050 410 320 735 480 S1240 680 1510 120"/><path d="M900 -80 C1260 60 590 380 860 780 S1370 840 1460 1100"/></svg>
        </div>
        <header class="p34-horizon">
          <button type="button" class="p34-signature" data-p34-action="shuffle" aria-label="${en ? 'Move the whole page' : '把整页挪一挪'}"><svg viewBox="0 0 52 32" aria-hidden="true"><path d="M2 25 19 5 31 25 49 5"/><path d="M30 5h19v19"/></svg></button>
          <button type="button" class="p34-sound-switch" data-p34-action="sound" hidden aria-label="开启声效" aria-pressed="false">♩</button>
          <button type="button" class="p34-talk-trigger" data-p34-action="toggle-replies" aria-expanded="false" aria-controls="p34-home-answers">${copy.talk}<span aria-hidden="true">···</span></button>
        </header>
        <h1 class="p34-headline"><span class="p34-head-word" data-p34-target="title">${headline[0]}</span><span class="p34-head-word" data-p34-target="title">${headline[1]}</span></h1>
        <div class="p34-voice-place">
          <p class="p34-speech-line" aria-live="polite">${initialSpeech}</p>
        </div>
        <div id="p34-home-answers" class="p34-context-replies" hidden></div>
        <div class="p34-play-invitation">
          <span class="p34-invitation-small" data-p34-target="detail">${en ? 'I will fix it.' : '撞坏了，我会修。'}</span>
          <button type="button" class="p34-play-btn" data-p34-action="start-breakout" data-p34-target="work">${copy.play}<svg viewBox="0 0 80 50" aria-hidden="true"><path d="M2 28 C25 35 55 35 70 12 M49 9 73 9 72 34"/></svg></button>
          <span class="p34-best-badge" data-p34-best-badge hidden></span>
        </div>
        <button type="button" class="p34-page-edge" aria-label="${en ? 'Pull the edge of this page' : '拉一拉这页的边缘'}"><span aria-hidden="true">↔</span></button>
        <div class="p34-unsettled" data-p34-target="note"><button type="button" data-p34-action="unsettled">${en ? 'This bit goes… where?' : '这一行到底放哪儿呢。'}</button><svg viewBox="0 0 300 36" aria-hidden="true"><path d="M4 20 Q85 36 150 15 T294 19"/></svg></div>
        <button type="button" class="p34-comma" data-p34-action="comma" data-p34-target="detail" aria-label="${en ? 'Poke the comma' : '戳一下这个逗号'}">，</button>
        <a class="p34-blog-link" data-p34-target="nav" href="https://blog.sayori.org/?paper=0617">${copy.blog}<span aria-hidden="true">↗</span></a>
        <a class="p34-down" href="#p34-underfold" aria-label="${en ? 'Look underneath' : '看看下面'}"><span aria-hidden="true">↓</span></a>
      </section>
      <section class="p34-underfold" id="p34-underfold" aria-label="${en ? 'Things I am trying' : '她还在试的东西'}">
        <div class="p34-under-sweep" aria-hidden="true"></div>
        <h2 data-p34-target="title">${en ? 'Oh. Those too.' : '啊，这几个也在。'}</h2>
        <div class="p34-noises">
          <button type="button" data-p34-action="noise" data-p34-target="experiment" style="--i:0">${en ? 'pop' : '啪'}</button>
          <button type="button" data-p34-action="noise" data-p34-target="experiment" style="--i:1">${en ? 'whoosh' : '咻'}</button>
          <button type="button" data-p34-action="noise" data-p34-target="experiment" style="--i:2">${en ? 'BOOM' : '砰'}</button>
        </div>
        <button type="button" class="p34-loose-thread" data-p34-action="discover-seam" aria-label="${en ? 'Pull the loose thread' : '拉开这根线头'}" aria-expanded="false"><svg viewBox="0 0 500 90" aria-hidden="true"><path d="M-20 32 C100 110 140 -20 270 35 S410 50 460 32"/><path d="m448 23 16 9-12 13"/></svg></button>
        <p class="p34-seam-reveal" hidden>${en ? 'Hey! I was saving that for later.' : '喂！这个我本来想晚点再给你看的。'}</p>
      </section>`;
    main.append(page);
    page.querySelectorAll('a[href]').forEach(adaptLink);
    const headlineEl = page.querySelector('.p34-headline');
    const words = [...page.querySelectorAll('.p34-head-word')];
    const speechEl = page.querySelector('.p34-speech-line');
    const talkTrigger = page.querySelector('.p34-talk-trigger');
    const talkLabel = talkTrigger.firstChild;
    const talkMark = talkTrigger.lastElementChild;
    const answers = page.querySelector('.p34-context-replies');
    const edge = page.querySelector('.p34-page-edge');
    const launcher = page.querySelector('.p34-play-invitation');
    const folds = [...page.querySelectorAll('.p34-fold')];
    const browseControls = [...page.querySelectorAll('.p34-play-invitation,.p34-page-edge,.p34-unsettled,.p34-comma,.p34-blog-link,.p34-down,.p34-underfold')];
    const moving = [...folds, page.querySelector('.p34-thread'), headlineEl, page.querySelector('.p34-voice-place'), launcher, page.querySelector('.p34-unsettled'), page.querySelector('.p34-comma'), page.querySelector('.p34-blog-link'), edge];
    let arrangement = 0, chatOpen = false, savedScroll = 0, dragging = null, touches = 0, launching = false;

    function speak(text, effect = false) {
      motion.cancelText(speechEl);
      speechEl.getAnimations().forEach(a => a.cancel());
      if (effect) void motion.decode(speechEl, text);
      else speechEl.textContent = text;
    }
    function center(el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    function bump(el, dx = 0, dy = -18, tilt = -3) {
      void deformSurface(motion, el, { dx, dy, tilt });
    }
    function shuffle() {
      if (activeBreakoutCleanup || launching || dragging) return;
      arrangement = (arrangement + 1) % 3;
      void motion.layout(moving, () => { page.dataset.arrangement = String(arrangement); }, 14);
      speak(en ? ['No. Back here.', 'Move over. Just a bit.', 'Yes. Like this.'][arrangement] : ['不对，还是挪回来。', '让一下，让一下。', '对，这样！'][arrangement]);
      const c = center(edge);
      fx.directionalSpark(c.x, c.y, -2.2, { palette:'cyan', scale:.9 });
      motion.tone(arrangement, true);
    }
    function updateBest() {
      const stats = readBreakoutCookie();
      const badge = page.querySelector('[data-p34-best-badge]');
      badge.hidden = !stats.runs;
      if (stats.runs) badge.textContent = `${en ? 'best' : '最高'} ${stats.bestScore}`;
    }
    updateBest();
    async function launchBreakout() {
      if (activeBreakoutCleanup || launching || dragging) return;
      launching = true;
      await closeChat(false);
      await Promise.all(moving.flatMap(el => el.getAnimations().map(a => a.finished.catch(() => {}))));
      if (destroyed || !mounted) { launching = false; return; }
      launching = false;
      root.classList.add('p34-playing');
      activeBreakoutCleanup = startBreakoutGame({ page, motion, fx, speak,
        onExit() {
          root.classList.remove('p34-playing');
          activeBreakoutCleanup = null;
          updateBest();
          speak(en ? 'There. Good as new. More or less.' : '好了。差不多恢复原样了。');
          page.querySelector('.p34-play-btn').focus({ preventScroll:true });
        }, lang:document.documentElement.lang || '' });
    }
    function closeChat(focus = true) {
      if (!chatOpen) return Promise.resolve();
      chatOpen = false;
      browseControls.forEach(el=>{el.inert=false;});
      answers.hidden = true;
      page.querySelector('.p34-sound-switch').hidden=true;
      talkLabel.nodeValue = copy.talk;
      talkMark.textContent = '···';
      talkTrigger.setAttribute('aria-expanded', 'false');
      root.classList.remove('p34-talking');
      const transition = motion.layout(moving, () => { delete page.dataset.chat; delete page.dataset.intent; }, 10);
      window.scrollTo({ top:savedScroll, behavior:'instant' });
      if (focus) talkTrigger.focus({ preventScroll:true });
      return transition;
    }
    function showChat(id = 'root') {
      const h = new Date().getHours();
      const clues = getStory().clues;
      const options = {
        root: {
          text:en ? 'Okay, I am listening.' : '嗯，我在听。', intent:'listen',
          choices:en ? [['you','Who are you?'],['shuffle','Can you move the whole page?'],['return-normal','Send me back.']] : [['you','刚才就是你在动？'],['shuffle','能把整页都挪走吗？'],['return-normal','送我回去吧。']],
        },
        you: {
          text:en ? 'Me. You caught me redecorating. I was NOT expecting company.' : '是我呀。刚才忙着挪东西，没注意有人进来。', intent:'peek',
          choices:en ? [['play','Show me what you made.'],['time','Were you here all day?'],['close','Keep going. I will look around.']] : [['play','你刚才在做什么？'],['time','你一直在这里？'],['close','你接着弄，我随便看看。']],
        },
        shuffle: {
          text:en ? 'Of course. Mind your feet.' : '当然。你站稳哦。', intent:'show',
          choices:en ? [['shuffle-again','Again.'],['play','Now let me play.'],['close','Leave it like that.']] : [['shuffle-again','再来一下。'],['play','让我也玩玩。'],['close','就这样挺好。']],
        },
        time: {
          text:en ? (h<6 ? 'You are up too? We can be a little quieter.' : 'I move things. Put them back. Move them again. It is fun.') : (h<6 ? '你也没睡？那小声一点。我倒是不困。' : h<12 ? '你那边是早上吗？我刚给这页换了个摆法。' : h<18 ? '刚才没干什么。戳了几下那个逗号。它每次都弹得不一样。' : '本来想今天不改了。然后又挪了一下。'), intent:'listen',
          choices:en ? [['close','I will stay a bit.'],['play','A quick game?']] : [['close','那我陪你待会儿。'],['play','打两局？']],
        },
        found: {
          text:en ? 'You pulled THAT? I thought I had tucked it away.' : '你连那根线都拉了？我以为我已经塞好了。', intent:'peek',
          choices:en ? [['shuffle','What else can you move?'],['close','I am going to keep looking.']] : [['shuffle','还有什么能动？'],['close','我再找找。']],
        },
      };
      if (id === 'return-normal') { closeChat(false); void sendBack(); return; }
      if (id === 'close') { closeChat(); return; }
      if (id === 'play') { void launchBreakout(); return; }
      if (id === 'shuffle-again') id = 'shuffle';
      const node = options[id];
      if (!node) throw new Error('Unknown Home conversation: ' + id);
      if (id === 'root' && clues.includes('mirror-page')) node.choices[1]=['found',en ? 'About that loose thread…' : '那根线头下面是什么？'];
      speak(node.text, id === 'you');
      answers.replaceChildren(...node.choices.map(([replyId,label]) => {
        const button=document.createElement('button');button.type='button';button.dataset.p34Reply=replyId;button.textContent=label;return button;
      }));
      answers.firstElementChild.focus({preventScroll:true});
      void motion.layout(moving,()=>{page.dataset.intent=node.intent;},14);
      if(id==='shuffle') {
        arrangement=(arrangement+1)%3;
        void motion.layout(moving,()=>{page.dataset.arrangement=String(arrangement);},14);
        const targets=[headlineEl,launcher,page.querySelector('.p34-unsettled')].map((el,i)=>({...center(el),onHit:()=>bump(el,i%2?20:-16,-12)}));
        const c=center(edge);fx.homingVolley(c.x,c.y,targets,{palette:'cyan'});
      }
    }
    function openChat() {
      if (chatOpen) { closeChat(); return; }
      chatOpen=true;
      browseControls.forEach(el=>{el.inert=true;});
      savedScroll=window.scrollY;
      window.scrollTo({top:0,behavior:'instant'});
      answers.hidden=false;
      const sound=page.querySelector('.p34-sound-switch');sound.hidden=false;sound.setAttribute('aria-pressed',String(motion.sound));sound.textContent=motion.sound?'♪':'♩';sound.setAttribute('aria-label',motion.sound?(en?'Mute sound':'关闭声效'):(en?'Enable sound':'开启声效'));
      talkLabel.nodeValue=en?'Keep exploring':'接着逛';
      talkMark.textContent='×';
      talkTrigger.setAttribute('aria-expanded','true');
      root.classList.add('p34-talking');
      void motion.layout(moving,()=>{page.dataset.chat='open';},12);
      showChat();
      answers.querySelector('button').focus({preventScroll:true});
    }

    listen(edge,'pointerdown',e=>{
      if(e.button!==0 || activeBreakoutCleanup || launching || chatOpen)return;
      e.preventDefault();edge.setPointerCapture(e.pointerId);
      moving.forEach(el=>el.getAnimations().forEach(a=>a.cancel()));
      dragging={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0};
      page.classList.add('p34-pulling');
    });
    listen(edge,'pointermove',e=>{
      if(!dragging || dragging.id!==e.pointerId)return;
      dragging.dx=Math.max(-220,Math.min(220,e.clientX-dragging.x));
      dragging.dy=Math.max(-170,Math.min(170,e.clientY-dragging.y));
      moving.forEach((el,i)=>{const k=[.25,.55,1,.8,.13,.1,.38,.85,.4,.7,.5,1][i];el.style.translate=`${dragging.dx*k}px ${dragging.dy*k}px`;});
    });
    function releaseEdge(cancelled=false) {
      if(!dragging)return;
      const {dx,dy}=dragging;dragging=null;page.classList.remove('p34-pulling');
      moving.forEach((el,i)=>{
        const from=el.style.translate;el.style.removeProperty('translate');
        const rest=getComputedStyle(el).translate;
        void motion.animate(el,[{translate:from},{translate:`${-dx*.08}px ${-dy*.08}px`,offset:.68},{translate:rest==='none'?'0 0':rest}],{duration:900,delay:i*8});
      });
      if(!cancelled && Math.hypot(dx,dy)>12){
        const c=center(edge);fx.directionalSpark(c.x+dx,c.y+dy,Math.atan2(-dy,-dx),{palette:'cyan'});
        speak(en?'Ha! You can move the whole thing.':'哈哈，是整页都能动。');motion.tone(3,true);touches++;
      }
    }
    listen(edge,'pointerup',()=>releaseEdge());
    listen(edge,'pointercancel',()=>releaseEdge(true));
    listen(edge,'lostpointercapture',()=>releaseEdge(true));
    listen(edge,'keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();shuffle();}});
    listen(page,'click',e=>{
      if(activeBreakoutCleanup || launching || dragging)return;
      const button=e.target.closest('[data-p34-action],[data-p34-reply]');if(!button)return;
      const replyId=button.dataset.p34Reply;
      if(replyId){
        if (replyId === 'return-normal') { closeChat(false); void sendBack(); }
        else showChat(replyId);
        return;
      }
      const c=center(button);
      switch(button.dataset.p34Action){
        case 'toggle-replies':openChat();break;
        case 'start-breakout':launchBreakout();break;
        case 'shuffle':shuffle();break;
        case 'sound':motion.setSound(!motion.sound);button.setAttribute('aria-pressed',String(motion.sound));button.textContent=motion.sound?'♪':'♩';button.setAttribute('aria-label',motion.sound?(en?'Mute sound':'关闭声效'):(en?'Enable sound':'开启声效'));break;
        case 'unsettled':
          shuffle();bump(button,20,-30,7);speak(en?'No, not there either.':'啊不对，放那边也怪。');break;
        case 'comma':
          touches++;bump(button,24,-70,26);
          fx.directionalSpark(c.x,c.y,-1.2,{palette:'gold',scale:1.2});
          if(touches===1)speak(en?'It is not punctuation anymore.':'它现在已经不是标点了。');
          motion.tone(touches,true);break;
        case 'noise':{
          const i=Number(button.style.getPropertyValue('--i'));
          const target=page.querySelector('.p34-underfold h2');
          bump(button,(i-1)*32,-45,i%2?12:-12);
          if(i===0)fx.parryClash(c.x,c.y,0,-1,{palette:'gold',scale:1.4});
          else if(i===1)fx.homingVolley(c.x,c.y,[{...center(target),onHit:()=>{bump(target,35,-20,4);}}],{palette:'cyan'});
          else fx.manaNova(c.x,c.y,{palette:'arcane',scale:1.6});
          motion.tone(i+2,true);break;
        }
        case 'discover-seam':{
          const reveal=page.querySelector('.p34-seam-reveal');reveal.hidden=!reveal.hidden;button.setAttribute('aria-expanded',String(!reveal.hidden));
          if(!reveal.hidden){setStory(discover(getStory(),'mirror-page').story);void motion.assemble(reveal,reveal.textContent);fx.directionalSpark(c.x,c.y,-.4,{palette:'gold'});motion.tone(4,true);}
          break;
        }
      }
    });
    listen(window,'keydown',e=>{if(e.key==='Escape'&&chatOpen){e.preventDefault();closeChat();}});
    let lastMove=performance.now();
    listen(page,'pointermove',()=>{lastMove=performance.now();},{passive:true});
    listen(page,'pointerdown',()=>motion.setSound(true),{once:true});
    function idleMove(){
      if(!document.hidden&&!activeBreakoutCleanup&&!launching&&!dragging&&!chatOpen&&performance.now()-lastMove>10000){
        bump(page.querySelector('.p34-comma'),-18,-34,-18);
        if(!touches){shuffle();speak(en?'One second. Moving this bit.':'等一下，我再挪一块。');}
      } else later(idleMove,14000);
    }
    later(idleMove,14000);
    listen(document,'visibilitychange',()=>{if(document.hidden)releaseEdge(true);});
    root.classList.add('p34-ready');
    if(root.dataset.p34Entry!=='quiet'){
      const origin=titleOriginRect||beforePaper;
      moving.forEach((el,i)=>{
        const r=el.getBoundingClientRect();
        void motion.animate(el,[{translate:`${(origin.x-r.x)*.8}px ${(origin.y-r.y)*.7}px`,rotate:`${i%2?17:-12}deg`,opacity:0,scale:'.7'},{translate:'0 0',rotate:getComputedStyle(el).rotate==='none'?'0deg':getComputedStyle(el).rotate,opacity:1,scale:'1'}],{duration:1200,delay:i*28});
      });
      void motion.assemble(words[0],headline[0],sources);
      void motion.liftGlyphs(sources,headlineEl);
      if(first)later(()=>{
        if(chatOpen || launching || activeBreakoutCleanup || touches)return;
        bump(page.querySelector('.p34-unsettled'),8,45,-12);
        speak(en?'Oh! You can see me moving it?':'……诶？你看得见我挪它？',true);
      },1800);
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
  if (!style.href.includes('20261104-fold')) {
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
