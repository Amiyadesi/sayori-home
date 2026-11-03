import { createRoute, launch, stepBall, advanceClock, clamp } from './p34-pinball-physics.js';

const routes = ['借一次反弹', '链接可以抄近路', '把路接到纸的另一头'];
const instructions = ['让光点碰到紫色横条，再送进「博客」。', '先反弹，再穿过两个绿色链接，送进「博客」。', '两次反弹、一次穿行。纸变长了，路也可以拐弯。'];

export function mountPinball({ nav, entries, motion, edition, route = 0, onSay, onWin, onClose }) {
  const controller = new AbortController(), { signal } = controller;
  const listen = (el, type, fn, options = {}) => el.addEventListener(type, fn, { signal, ...options });
  const root = document.documentElement, page = nav.closest('main');
  const attributes = ['style', 'class', 'role', 'tabindex', 'aria-label', 'aria-pressed'];
  const saved = entries.map(el => attributes.map(key => [key, el.getAttribute(key)]));
  const originalScroll = scrollY;
  const canvas = document.createElement('canvas'); canvas.className = 'p34-flight'; canvas.ariaHidden = 'true';
  const ctx = canvas.getContext('2d');
  const source = document.createElement('button'); source.className = 'p34-launch'; source.type = 'button';
  source.setAttribute('aria-label', '光点：拖动瞄准，松开发射；方向键瞄准，空格发射');
  const caption = document.createElement('p'); caption.className = 'p34-route-caption'; caption.id = 'p34-route-caption';
  const status = document.createElement('p'); status.className = 'p34-route-status'; status.setAttribute('role', 'status');
  const controls = document.createElement('section'); controls.className = 'p34-play-controls'; controls.setAttribute('aria-label', '借道操作');
  controls.innerHTML = `<div class="p34-play-progress"><span></span><strong></strong></div><div class="p34-play-buttons"><button type="button" data-do="fire">发射</button><button type="button" data-do="retry">再试一次</button><button type="button" data-do="next" hidden>下一条路</button><button type="button" data-do="close">收起网页</button></div><label class="p34-turn">横条角度 <input type="range" min="-85" max="85" step="1" value="-30" aria-label="选中横条的角度"><output></output></label>`;
  const fire = controls.querySelector('[data-do=fire]'), next = controls.querySelector('[data-do=next]');
  const range = controls.querySelector('input'), output = controls.querySelector('output');
  const [goal, railA, railB, portalIn, portalOut, spare] = entries;
  const railElements = [railA, railB];
  let arena, ball, selected = 0, direction = { x: 0, y: -1 }, aiming, dragging, shots = 0, misses = 0;
  let trail = [], previous = [], raf = 0, lastTime = 0, clock = { accumulator: 0 }, paused = false, closed = false, busy = true, won = false, helped = false, cameraY = scrollY;
  let origin = { x: 0, y: 0 }, viewportWidth = innerWidth, originY = 0;
  let setupGeneration = 0;
  nav.append(source, caption); controls.append(status); document.body.append(canvas, controls);

  function measure() {
    const r = nav.getBoundingClientRect(); origin = { x: r.left, y: r.top }; originY = r.top + scrollY;
  }
  function point(e) { measure(); return { x: e.clientX - origin.x, y: e.clientY - origin.y }; }
  function place(el, x, y, width, angle = 0) {
    Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, marginLeft: `${-width / 2}px`, rotate: `${angle}deg` });
  }
  function reflow(update) {
    if (motion.reduced()) return { updateCallbackDone: Promise.resolve(update()), finished: Promise.resolve() };
    if (!document.startViewTransition) {
      const finished = motion.layout(entries, update, 30);
      return { updateCallbackDone: Promise.resolve(), finished };
    }
    const names = () => {
      page.style.viewTransitionName = 'p34-paper';
      entries.forEach((el, i) => { el.style.viewTransitionName = `p34-link-${i}`; });
    };
    names();
    const transition = document.startViewTransition(() => { update(); names(); });
    transition.finished.then(() => {
      page.style.removeProperty('view-transition-name');
      entries.forEach(el => el.style.removeProperty('view-transition-name'));
    });
    return transition;
  }
  function placeRail(index) {
    const rail = arena.rails[index]; place(railElements[index], rail.x, rail.y, rail.length, rail.angle);
  }
  function updateRange() { range.value = arena.rails[selected].angle; output.value = `${Math.round(+range.value)}°`; }
  function select(index) {
    selected = index;
    railElements.forEach((el, i) => el.setAttribute('aria-pressed', String(i === index)));
    updateRange();
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; lastTime = 0; clock.accumulator = 0; }
  function sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(canvas.width / innerWidth, 0, 0, canvas.height / innerHeight, 0, 0);
  }
  function line(points, color, dash = []) {
    if (points.length < 2) return;
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(dash);
    points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
  }
  function draw(alpha = 1) {
    measure(); ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.save(); ctx.translate(origin.x, origin.y);
    line(previous, '#928eaf55', [3, 7]); line(trail, '#597fbd95');
    if (arena.portals.length) {
      const [a, b] = arena.portals;
      ctx.beginPath(); ctx.strokeStyle = '#389b9850'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 9]);
      ctx.moveTo(a.x, a.y); ctx.bezierCurveTo(a.x + 70, a.y - 120, b.x - 70, b.y + 120, b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    }
    const start = ball?.held ? ball : arena.source;
    if ((!ball || ball.held) && !won) {
      const length = Math.hypot(direction.x, direction.y);
      const end = { x: start.x + direction.x / length * 120, y: start.y + direction.y / length * 120 };
      line([start, end], '#7762aa', [3, 6]);
      ctx.beginPath(); ctx.fillStyle = '#7762aa'; ctx.arc(end.x, end.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (ball && !ball.held) {
      const x = ball.px + (ball.x - ball.px) * alpha, y = ball.py + (ball.y - ball.py) * alpha;
      ctx.beginPath(); ctx.fillStyle = '#fff'; ctx.shadowColor = '#6e83c8'; ctx.shadowBlur = 15;
      ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = '#5d66a4'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }
  function showSource() {
    const p = ball?.held ? ball : arena.source;
    source.style.left = `${p.x}px`; source.style.top = `${p.y}px`;
    source.hidden = won || Boolean(ball?.active && !ball.held);
  }
  function syncControls() {
    fire.disabled = busy || won;
    fire.textContent = paused ? '继续' : ball?.held ? '从链接再发射' : ball?.active ? '暂停' : '发射';
    next.hidden = !won; next.textContent = route < 2 ? '下一条路' : '再绕一圈';
  }
  function report(text) { status.textContent = text; }
  function angle(value) {
    const rail = arena.rails[selected]; rail.angle = clamp(value, -85, 85);
    railElements[selected].getAnimations().forEach(a => a.cancel());
    placeRail(selected); updateRange(); draw();
  }
  function resetShot() {
    stop(); previous = trail; trail = []; ball = null; paused = false; won = false;
    direction = { x: 0, y: -1 }; showSource(); syncControls(); draw();
  }
  async function setup(nextRoute, initial = false) {
    const generation = ++setupGeneration;
    stop(); route = nextRoute; shots = 0; misses = 0; helped = false; busy = true; won = false;
    ball = null; trail = []; previous = []; paused = false; direction = { x: 0, y: -1 };
    const transition = reflow(() => {
      if (closed) return;
      root.classList.add('p34-route-playing');
      nav.style.height = `${route === 2 ? Math.max(1180, innerHeight * 1.65) : innerWidth <= 640 ? Math.max(470, innerHeight - 300) : Math.max(590, innerHeight - 240)}px`;
      const width = nav.clientWidth, height = nav.clientHeight;
      arena = createRoute(width, height, route, edition);
      arena.rails[0].angle = route === 0 ? -29 : -58;
      if (route === 2) arena.rails[1].angle = -25;
      entries.forEach(el => { el.classList.add('p34-route-piece'); el.setAttribute('role', 'button'); el.tabIndex = 0; });
      goal.dataset.piece = 'goal'; railA.dataset.piece = 'rail'; railB.dataset.piece = route === 2 ? 'rail' : 'rest';
      portalIn.dataset.piece = route ? 'in' : 'rest'; portalOut.dataset.piece = route ? 'out' : 'rest'; spare.dataset.piece = 'rest';
      place(goal, arena.goal.x, arena.goal.y, 76);
      arena.rails.forEach((_, i) => placeRail(i));
      if (route !== 2) place(railB, width * .6, height * .74, Math.min(190, width * .35), 4);
      if (route) arena.portals.forEach((p, i) => place(i ? portalOut : portalIn, p.x, p.y, 60));
      else { place(portalIn, width * .68, height * .22, Math.min(180, width * .4), -6); place(portalOut, width * .42, height * .12, Math.min(180, width * .4), 3); }
      place(spare, width * .64, height * .91, Math.min(210, width * .48), -3);
      goal.setAttribute('aria-label', '终点：博客');
      railElements.slice(0, arena.rails.length).forEach((el, i) => el.setAttribute('aria-label', `反射横条${i + 1}：拖动移动，方向键微调，Q、E旋转`));
    });
    await transition.updateCallbackDone;
    if (closed) return;
    caption.textContent = instructions[route]; caption.style.left = '0'; caption.style.top = '0';
    controls.querySelector('.p34-play-progress span').textContent = `借道 / ${edition === 1 ? '连续版' : '链接刹车'}`;
    controls.querySelector('.p34-play-progress strong').textContent = `${route + 1} / 3　${routes[route]}`;
    select(0); showSource(); syncControls(); sizeCanvas(); draw();
    if (!initial) scrollTo({ top: Math.max(0, page.offsetTop - 12), behavior: motion.reduced() ? 'instant' : 'smooth' });
    report('挪横条、转角度，拖光点发射。');
    await transition.finished;
    if (closed || generation !== setupGeneration) return;
    busy = false; measure(); syncControls(); draw();
  }
  function feedback(event) {
    if (event.type === 'rail') {
      const i = arena.rails.findIndex(r => r.id === event.id), el = railElements[i];
      void motion.animate(el, [{ scale: '1 1' }, { scale: '1.08 .8', offset: .2 }, { scale: '.99 1.05', offset: .65 }, { scale: '1' }], { duration: 380 });
      motion.tone(ball.hits);
      motion.burst(origin.x + ball.x, origin.y + ball.y, '#8a71b4');
    } else if (event.type === 'portal' || event.type === 'hold') {
      trail.push({ x: ball.x, y: ball.y }); previous = trail; trail = [];
      for (const el of [portalIn, portalOut]) void motion.animate(el, [{ scale: '1' }, { scale: '.75', offset: .25 }, { scale: '1.15', offset: .6 }, { scale: '1' }], { duration: 550 });
      motion.tone(4); showSource();
      if (event.type === 'hold') {
        direction = { x: 1, y: 0 }; report('链接替你接住了。重新瞄准，再松手。'); onSay('看，这里不用一口气弹完。你来决定下一跳。');
        if (route === 2) source.scrollIntoView({ block: 'center', behavior: motion.reduced() ? 'instant' : 'smooth' });
      }
    } else if (event.type === 'goal-blocked') {
      report(event.reflections ? `还差 ${event.reflections} 次紫色横条的反弹。` : '这条路还要穿过一次绿色链接。');
      void motion.animate(goal, [{ opacity: 1 }, { opacity: .35, offset: .3 }, { opacity: 1 }], { duration: 420 });
    } else if (event.type === 'win') {
      won = true; showSource(); syncControls();
      void motion.animate(goal, [{ scale: '1' }, { scale: '1.22', rotate: '-8deg', offset: .35 }, { scale: '1', rotate: '0deg' }], { duration: 850 });
      motion.tone(5); motion.burst(origin.x + arena.goal.x, origin.y + arena.goal.y, '#e0aa52');
      const best = onWin({ route, edition, shots, hits: ball.hits });
      report(`${shots} 次尝试，${ball.hits} 次反弹。送到了。最长连弹：${best} 次。`);
    } else if (event.type === 'miss') {
      misses++; report('虚线留下了刚才的路线。挪一点、转一点，再试。');
      if (misses === 2 && !helped) {
        helped = true; const rail = arena.rails[0];
        void motion.layout([railA], () => { rail.angle = -45; rail.length *= 1.22; placeRail(0); });
        updateRange(); onSay('我把这一截扶正一点。不是判你输，我也想看它弹过去。');
      }
      resetShot();
    }
  }
  function frame(time) {
    if (!ball?.active || ball.held || paused || closed) { stop(); draw(); return; }
    const dt = lastTime ? (time - lastTime) / 1000 : 0; lastTime = time;
    const alpha = advanceClock(clock, dt, seconds => {
      if (!ball?.active || ball.held) return;
      const events = stepBall(ball, arena, seconds);
      if (events.some(e => e.type === 'rail') || trail.length === 0 || Math.hypot(ball.x - trail.at(-1).x, ball.y - trail.at(-1).y) > 9) trail.push({ x: ball.x, y: ball.y });
      if (trail.length > 700) trail.shift();
      for (const event of events) feedback(event);
    });
    if (route === 2 && ball?.active && !ball.held) {
      const target = clamp(originY + ball.y - innerHeight * .56, page.offsetTop, originY + arena.height - innerHeight + 180);
      cameraY = scrollY + (target - scrollY) * (1 - Math.exp(-6 * dt));
      scrollTo(0, cameraY);
    }
    draw(alpha);
    if (ball?.active && !ball.held && !paused) raf = requestAnimationFrame(frame); else { stop(); syncControls(); }
  }
  function fireShot() {
    if (busy || won) return;
    motion.setSound(motion.sound); source.focus({ preventScroll: true });
    if (paused) { paused = false; lastTime = 0; raf = requestAnimationFrame(frame); syncControls(); return; }
    if (ball?.active && !ball.held) { pause(); return; }
    if (ball?.held) {
      const nextBall = launch(ball, direction, arena.speed); Object.assign(ball, { vx: nextBall.vx, vy: nextBall.vy, held: false, px: ball.x, py: ball.y });
    } else { shots++; ball = launch(arena.source, direction, arena.speed); trail = []; }
    report(''); showSource(); syncControls(); lastTime = 0; raf = requestAnimationFrame(frame);
  }
  function aim(e) {
    const p = point(e), start = ball?.held ? ball : arena.source;
    const dx = p.x - start.x, dy = p.y - start.y;
    if (Math.hypot(dx, dy) > 8) direction = { x: dx, y: dy };
    draw();
  }
  listen(source, 'pointerdown', e => { if (busy || ball?.active && !ball.held) return; e.preventDefault(); aiming = e.pointerId; source.setPointerCapture(e.pointerId); aim(e); });
  listen(source, 'pointermove', e => { if (aiming === e.pointerId) aim(e); });
  listen(source, 'pointerup', e => { if (aiming !== e.pointerId) return; aiming = null; fireShot(); });
  listen(source, 'pointercancel', () => { aiming = null; draw(); });
  listen(source, 'keydown', e => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault(); let a = Math.atan2(direction.y, direction.x) + (['ArrowLeft', 'ArrowUp'].includes(e.key) ? -.04 : .04);
      direction = { x: Math.cos(a), y: Math.sin(a) }; draw();
    } else if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); fireShot(); }
  });
  entries.forEach(el => {
    listen(el, 'click', e => { e.preventDefault(); e.stopImmediatePropagation(); if (el.dataset.piece === 'rest') onSay('这个先不借。你可以拿旁边的紫色横条。'); }, { capture: true });
    const i = railElements.indexOf(el);
    if (i < 0) return;
    listen(el, 'pointerdown', e => {
      if (busy || !arena.rails[i]) return;
      e.preventDefault(); el.getAnimations().forEach(a => a.cancel()); select(i);
      const p = point(e), rail = arena.rails[i]; dragging = { id: e.pointerId, i, dx: p.x - rail.x, dy: p.y - rail.y };
      el.setPointerCapture(e.pointerId);
    });
    listen(el, 'pointermove', e => {
      if (!dragging || dragging.id !== e.pointerId || dragging.i !== i) return;
      const p = point(e), rail = arena.rails[i];
      rail.x = clamp(p.x - dragging.dx, 40, arena.width - 40); rail.y = clamp(p.y - dragging.dy, 75, arena.height - 35);
      placeRail(i); draw();
    });
    listen(el, 'pointerup', () => { dragging = null; }); listen(el, 'pointercancel', () => { dragging = null; });
    listen(el, 'keydown', e => {
      if (!arena.rails[i]) return;
      select(i); const rail = arena.rails[i];
      if (e.key.startsWith('Arrow')) {
        e.preventDefault(); rail.x = clamp(rail.x + (e.key === 'ArrowRight' ? 8 : e.key === 'ArrowLeft' ? -8 : 0), 40, arena.width - 40);
        rail.y = clamp(rail.y + (e.key === 'ArrowDown' ? 8 : e.key === 'ArrowUp' ? -8 : 0), 75, arena.height - 35); placeRail(i); draw();
      } else if (['q', 'Q', 'e', 'E'].includes(e.key)) { e.preventDefault(); angle(rail.angle + (e.key.toLowerCase() === 'q' ? -3 : 3)); }
    });
  });
  listen(range, 'input', () => angle(+range.value));
  listen(controls, 'click', e => {
    const action = e.target.closest('[data-do]')?.dataset.do;
    if (action === 'fire') fireShot();
    if (action === 'retry') { resetShot(); report('横条的位置留着。只把光点拿回来。'); }
    if (action === 'next') void setup((route + 1) % 3);
    if (action === 'close') onClose();
  });
  function pause() { if (!ball?.active || ball.held) return; paused = true; stop(); syncControls(); report('停在这里。按「继续」再出发。'); }
  listen(window, 'blur', pause); listen(document, 'visibilitychange', () => { if (document.hidden) pause(); });
  listen(window, 'scroll', () => { if (!raf && arena) draw(); }, { passive: true });
  listen(window, 'resize', () => {
    sizeCanvas();
    if (!arena) return;
    if (innerWidth !== viewportWidth) {
      const scale = nav.clientWidth / arena.width; arena.width = nav.clientWidth; arena.speed = clamp(arena.width * .68, 250, 850);
      for (const p of [arena.source, arena.goal, ...arena.rails, ...arena.portals]) p.x *= scale;
      arena.rails.forEach((r, i) => { r.length = clamp(r.length * scale, 90, 300); placeRail(i); });
      place(goal, arena.goal.x, arena.goal.y, 76); arena.portals.forEach((p, i) => place(i ? portalOut : portalIn, p.x, p.y, 60));
      viewportWidth = innerWidth; resetShot(); report('纸的宽度变了，位置按比例留下。重新发射吧。');
    }
    draw();
  });
  void setup(route, true);
  return {
    get edition() { return edition; },
    pause,
    update() {
      edition = 2; arena.edition = 2;
      controls.querySelector('.p34-play-progress span').textContent = '借道 / 链接刹车';
      for (const el of [portalIn, portalOut]) void motion.animate(el, [{ rotate: '0deg', scale: '1' }, { rotate: '180deg', scale: '.7', offset: .5 }, { rotate: '360deg', scale: '1' }], { duration: 1100 });
      onSay('我给链接装了刹车。到出口先停住，再由你瞄准。横条不用重摆。');
    },
    destroy(restore = true) {
      if (closed) return; closed = true; stop(); controller.abort();
      canvas.remove(); controls.remove(); source.remove(); caption.remove(); status.remove();
      const finish = () => {
        nav.style.removeProperty('height');
        root.classList.remove('p34-route-playing');
        entries.forEach((el, i) => { delete el.dataset.piece; for (const [key, value] of saved[i]) value === null ? el.removeAttribute(key) : el.setAttribute(key, value); });
      };
      const result = restore ? reflow(finish).finished : (finish(), Promise.resolve());
      if (restore) scrollTo({ top: originalScroll, behavior: motion.reduced() ? 'instant' : 'smooth' });
      return result;
    },
  };
}
