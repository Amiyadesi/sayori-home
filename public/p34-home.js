import { createWorldSession, readWorldCookie, advanceEncounterState, serializeWorldState, WORLD_COOKIE_KEY } from './p34-living.js?v=20261102-r12';
import { createMotion } from './p34-motion.js?v=20261102-r12';
import { openPlaySession, completeRoute, installUpdate } from './p34-play-state.js';
import { mountPinball } from './p34-pinball.js';

const mounts = new WeakMap();

export function mountNativeHome() {
  if (new URLSearchParams(location.search).get('paper') !== '0617') return () => {};
  const root = document.documentElement;
  if (mounts.has(root)) return mounts.get(root);
  const controller = new AbortController(), { signal } = controller, motion = createMotion(signal);
  const listen = (el, type, fn, options = {}) => el.addEventListener(type, fn, { signal, ...options });
  const session = createWorldSession(), play = openPlaySession(session.cookie);
  let game, title, header, entries = [], replies, call, sound, originalHeading, originalMargin, margin, dropped, entered = false, returning = false;
  let callbacks = [], originalLinks = [], lingerTimer;

  function reply(choices = []) {
    callbacks = choices.map(choice => choice[1]);
    [...replies.children].forEach((button, i) => { button.hidden = !choices[i]; button.textContent = choices[i]?.[0] || ''; });
    replies.hidden = choices.length === 0;
  }
  function say(text, choices = [], magic = false) {
    if (!entered || signal.aborted) return;
    title.setAttribute('aria-live', 'polite');
    motion.cancelText(title);
    title.getAnimations({ subtree: true }).forEach(a => a.cancel());
    if (magic) void motion.assemble(title, text); else title.textContent = text;
    reply(choices);
  }
  function menu() {
    game?.pause();
    const hour = new Date().getHours(), state = play.get();
    const text = hour < 5 ? '还醒着？小声一点，链接也是会响的。' : game ? '先把光点留在那儿。你想问什么？' : '我在。刚才在想，这个链接还能怎么用。';
    say(text, [
      [game ? '聊聊这次更新' : '我想玩《借道》', game ? aboutUpdate : start],
      [state.archive ? '我找到你的旧稿了' : '你认识 Amiya？', state.archive ? oldDraft : aboutAmiya],
      ['把网页还回去吧', sendBack],
    ]);
  }
  function aboutAmiya() {
    say('看过他的博客。他有时砍功能砍得很干脆。我还舍不得。', [['去博客看看', () => location.assign('https://blog.sayori.org/?paper=0617')], ['继续摆你的东西吧', leave]]);
    const el = entries[0]; if (el) void motion.animate(el, [{ translate: '0 0' }, { translate: '22px -8px', rotate: '-3deg', offset: .4 }, { translate: '0 0', rotate: '0deg' }], { duration: 950 });
  }
  function aboutUpdate() {
    say((game?.edition ?? play.get().edition) === 1 ? '链接现在一进去就飞出来。很痛快，不过后半段得提前摆好。' : '刹车能让你临时改方向。不过，原来那种一路弹到底的感觉，也挺好。', [['让我再试试', leave], ['你的修改记录呢？', () => location.assign('https://blog.sayori.org/notes/link-brake/?paper=0617')]]);
  }
  function oldDraft() {
    say('你翻到那个了？我没丢。连续弹过去的声音，我也喜欢。', [['玩旧稿', () => start(true)], ['先玩现在这版', () => start(false)]]);
  }
  function leave() { reply(); if (!game) say('你逛。我把这里再挪一点点。'); }
  function catchEntry() {
    if (!dropped) return;
    const link = dropped;
    void motion.layout([link], () => { link.getAnimations().forEach(a => a.cancel()); link.classList.remove('p34-dropped'); link.removeAttribute('aria-label'); });
    dropped = null; play.set({ ...play.get(), met: 1 });
    say('接得好。原来你真的碰得到！', [['你刚才在做什么？', invite], ['你是谁？', identity]], true);
    motion.tone(2);
  }
  function identity() {
    say('这页里现在有两个人。一个在点鼠标，一个正在挪他的导航。', [['是你在挪？', invite], ['那你继续，我看看', leave]]);
    const el = entries[3]; if (el) void motion.animate(el, [{ translate: '0 0' }, { translate: '-24px -12px', rotate: '-4deg', offset: .5 }, { translate: '0 0', rotate: '0deg' }], { duration: 1100 });
  }
  function invite() { say('我想让链接不只通往别处，还能把光点弹过去。借你一双手？', [['玩玩看', start], ['先逛一会儿', leave]]); }
  function start(archived) {
    if (dropped) catchEntry();
    if (game) { leave(); return; }
    const state = play.get(), params = new URLSearchParams(location.search);
    const old = state.archive && (archived === true || archived !== false && params.get('draft') === 'first');
    const edition = old ? 1 : state.edition;
    play.set({ ...state, met: 1 });
    say(old ? '第一版。我连那个不肯停下来的链接都留着。' : '借一下他的导航。放心，玩完还回去。');
    game = mountPinball({ nav: document.querySelector('.entries'), entries, motion, edition,
      onSay: text => say(text),
      onWin(result) {
        const next = completeRoute(play.get(), result); play.set(next);
        if (next.first === 7 && next.edition === 1) {
          say('三条都通了。我想给链接加个刹车，你要不要试新稿？', [['装上试试', () => { play.set(installUpdate(play.get())); game.update(); reply([['去第二条路试试', leave], ['为什么要改？', aboutUpdate]]); }], ['先保留现在这样', leave]], true);
        } else say(result.hits > 3 ? '等等，你多绕了几次？这条路我没试过。' : ['送到了！那个「博客」刚才真的接住了。', '对！链接中间那一截，不必走。', '接上了。连纸的另一头也能借道。'][result.route]);
        return next.best;
      },
      onClose: async () => { const active = game; game = undefined; await active.destroy(); if (!signal.aborted) say('都放回去了。链接又可以点了。', [['再玩一会儿', start], ['去读你的记录', () => location.assign('https://blog.sayori.org/notes/?paper=0617')]]); },
    });
  }
  async function sendBack() {
    if (returning) return; returning = true;
    say('好。我把借来的地方放回去。');
    const active = game; game = undefined;
    if (active) await active.destroy();
    if (signal.aborted) return;
    const url = new URL(location.href); url.searchParams.delete('paper'); url.searchParams.delete('draft');
    history.replaceState(history.state, '', url);
    await motion.layout([document.querySelector('main'), ...entries], restore);
    cleanup();
    document.querySelector('.page-title')?.scrollIntoView({ block: 'center', behavior: motion.reduced() ? 'instant' : 'smooth' });
  }
  function enter() {
    if (entered || signal.aborted) return;
    title = document.querySelector('.title-text') || document.querySelector('h1');
    if (!title) throw new Error('Project 34 needs the real page title');
    header = document.querySelector('.page-header') || title.parentElement;
    originalHeading = [...title.childNodes]; margin = document.querySelector('.margin-text'); originalMargin = margin?.textContent;
    entries = [...document.querySelectorAll('.entries > .entry')];
    root.classList.add('p34-native'); root.dataset.p34Active = 'true'; entered = true;
    const encounter = advanceEncounterState(readWorldCookie(document.cookie), 'home');
    session.cookie(WORLD_COOKIE_KEY, serializeWorldState(encounter.state));
    const story = session.getStory(); session.setStory({ ...story, met: 1, chapter: story.chapter === 'arrive' ? 'explore' : story.chapter });
    replies = document.createElement('div'); replies.className = 'p34-page-replies'; replies.setAttribute('role', 'group'); replies.setAttribute('aria-label', '回应她');
    for (let i = 0; i < 3; i++) { const button = document.createElement('button'); button.type = 'button'; button.hidden = true; replies.append(button); listen(button, 'click', () => callbacks[i]()); }
    header.append(replies);
    call = document.createElement('button'); call.className = 'p34-call'; call.type = 'button'; call.textContent = '你在吗？';
    sound = document.createElement('button'); sound.className = 'p34-voice'; sound.type = 'button'; sound.textContent = '声音：关'; sound.setAttribute('aria-pressed', 'false');
    header.append(call, sound);
    listen(call, 'click', () => { if (dropped) catchEntry(); else if (entries.length === 6) menu(); else say('我也会逛到这边。先看看？', [['送我回去', sendBack], ['好', leave]]); });
    listen(sound, 'click', () => { motion.setSound(!motion.sound); sound.textContent = `声音：${motion.sound ? '开' : '关'}`; sound.setAttribute('aria-pressed', String(motion.sound)); });
    for (const link of document.querySelectorAll('a[href]')) {
      const url = new URL(link.href, location.href);
      if ((url.hostname === location.hostname || url.hostname === 'sayori.org' || url.hostname === 'blog.sayori.org') && !url.pathname.startsWith('/assets/') && !url.hash && !url.searchParams.has('paper')) {
        originalLinks.push([link, link.getAttribute('href')]); url.searchParams.set('paper', '0617'); link.href = url.href;
      }
    }
    if (margin) margin.textContent = '这里有人正在改东西。';
    listen(window, 'p34:fold', () => location.assign('https://blog.sayori.org/notes/?paper=0617'));
    listen(window, 'p34:send-back', () => void sendBack());
    listen(document, 'click', e => {
      if (dropped && dropped.contains(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); catchEntry(); }
    }, { capture: true });
    const state = play.get();
    if (!entries.length) say('你也跟到这一页了。这里的东西，我还没借完。');
    else if (!state.met) {
      dropped = entries[1]; dropped.classList.add('p34-dropped'); dropped.setAttribute('aria-label', '扶住正在掉下来的社交账号链接');
      void motion.animate(dropped, [{ translate: '0 0', rotate: '0deg' }, { translate: '36px -22px', rotate: '-9deg', offset: .25 }, { translate: '12px 24px', rotate: '7deg', offset: .72 }, { translate: '22px 15px', rotate: '5deg' }], { duration: 1500, fill: 'forwards' });
      void motion.animate(entries[3], [{ translate: '0 0' }, { translate: '-20px 10px', rotate: '-3deg', offset: .55 }, { translate: '0 0', rotate: '0deg' }], { duration: 1300 });
      say('诶，有人？帮我扶一下那条链接！', [['扶住它', catchEntry], ['你是谁？', identity]], true);
    } else {
      say(state.archive ? '你回来啦。旧稿那条路，我也没封上。' : '回来得正好。链接还在，光点也在。', [['再玩一次《借道》', start], ['聊两句', menu]], true);
      if (new URLSearchParams(location.search).get('draft') === 'first' && state.archive) start(true);
    }
    lingerTimer = setTimeout(() => {
      if (game || dropped || document.hidden || signal.aborted || !replies.hidden) return;
      say('我把这个箭头拿下来看看。');
      const arrow = entries[4]?.querySelector('.entry-arrow');
      if (arrow) void motion.animate(arrow, [{ translate: '0 0', rotate: '0deg' }, { translate: '-120px -64px', rotate: '-120deg', offset: .4 }, { translate: '-40px -20px', rotate: '20deg', offset: .8 }, { translate: '0 0', rotate: '0deg' }], { duration: 2200 });
    }, 100000);
  }
  function restore() {
    if (entered) {
      title.replaceChildren(...originalHeading); title.removeAttribute('aria-live');
      if (margin) margin.textContent = originalMargin;
      dropped?.classList.remove('p34-dropped'); dropped?.removeAttribute('aria-label');
      replies.remove(); call.remove(); sound.remove();
      for (const [el, href] of originalLinks) el.setAttribute('href', href);
    }
    entered = false; root.classList.remove('p34-native'); delete root.dataset.p34Active;
  }
  function cleanup() {
    if (signal.aborted) return;
    game?.destroy(false); game = undefined;
    restore(); controller.abort(); clearTimeout(lingerTimer); mounts.delete(root);
  }
  let style = document.querySelector('link[data-p34-native-style]');
  if (!style) { style = document.createElement('link'); style.rel = 'stylesheet'; style.href = '/p34-home.css?v=20261103-r13'; style.dataset.p34NativeStyle = ''; document.head.append(style); }
  const ready = () => {
    if (!document.querySelector('.entries') || document.body.dataset.surfaceReady === 'true') enter();
    else listen(window, 'sayori:surface-ready', enter, { once: true });
  };
  if (style.sheet) ready(); else listen(style, 'load', ready, { once: true });
  listen(style, 'error', () => { throw new Error('Project 34 native stylesheet did not load'); }, { once: true });
  listen(window, 'pagehide', cleanup, { once: true });
  mounts.set(root, cleanup); return cleanup;
}
