/**
 * Classic full-website luminous breakout game.
 * Operates on actual rendered document geometry and [data-p34-target] DOM nodes.
 *
 * Full-document coordinate camera starts at bottom workspace and advances upward.
 * Deflect with paddle contact offset; preserve nonzero vertical speed.
 * Continuous swept-sphere collision against real elements; progressive contact-local fracture.
 * Fair physical interventions by the unnamed resident (pre-loss rescue note & module repair).
 */

import {
  FIXED_DT,
  MAX_ACCUMULATOR,
  DEFAULT_BALL_RADIUS,
  DEFAULT_PADDLE_WIDTH,
  DEFAULT_PADDLE_HEIGHT,
  stepBallSubstep,
   updateCameraY,
} from './p34-breakout-physics.js';
import {
  readBreakoutCookie,
  writeBreakoutCookie,
  recordBreakoutRun,
  appendRecentRun,
} from './p34-breakout-state.js';

const PADDLE_BOTTOM_MARGIN = 72; // Distance from viewport bottom to paddle
const MAX_LIVES = 3;

const GAME_COPY = {
  zh: {
    readyPrompt: '点击或按空格发球 · A/D 或鼠标移动',
    pausedTitle: '弹球已暂停',
    btnResume: '继续游戏',
    btnRestart: '重新开始',
    btnExit: '收起球板 · 浏览页面',
    overTitle: '本次弹球结束',
    overScore: '最终得分',
    overCombo: '最高连击',
    overRuns: '已完成局数',
    overBest: '历史最高',
    btnPlayAgain: '再来一局',
    voiceStart: '好了，发球！',
    voicePaddle: '接得漂亮！',
    voiceCheer1: '这个角度漂亮！',
    voiceCheer2: '这个我先扶一下。你接着打。',
    voiceCheer3: '八下！你真打算把这里全拆掉？',
    voiceRescue: '等一下——接住！这下不算。',
    voiceLifeLost: '哎，漏了。再来，我还想看。',
    voiceOver: '……好，先歇一下。还来吗？',
    rescueActive: '我垫一下。',
    hudScore: '得分',
    hudCombo: '连击',
    hudLives: '剩余',
    pauseAria: 'Esc 暂停',
  },
  en: {
    readyPrompt: 'Click or Space to launch · A/D or mouse to move',
    pausedTitle: 'Breakout Paused',
    btnResume: 'Resume Game',
    btnRestart: 'Restart',
    btnExit: 'Put Paddle Away · Browse Page',
    overTitle: 'Run Complete',
    overScore: 'Final Score',
    overCombo: 'Max Combo',
    overRuns: 'Runs Completed',
    overBest: 'Personal Best',
    btnPlayAgain: 'Play Again',
    voiceStart: 'Orb is set! Click or press Space to send it across the page.',
    voicePaddle: 'Nice catch!',
    voiceCheer1: 'Nice angle!',
    voiceCheer2: 'Five! I straightened one out.',
    voiceCheer3: 'Eight! You really are taking this apart!',
    voiceRescue: 'Close one! I slid a note right under the edge to catch it!',
    voiceLifeLost: 'All good—take a breath, next orb is ready.',
    voiceOver: "Put the paddle away, and I'll put things back.",
    rescueActive: 'Saved with a note!',
    hudScore: 'Score',
    hudCombo: 'Combo',
    hudLives: 'Lives',
    pauseAria: 'Esc Pause',
  },
};

/**
 * Computes complementary cleavage polygons around a normalized contact point (relX, relY)
 * so the struck DOM element exhibits a genuine missing cleaved wedge at the impact location,
 * while its detached shard clones display the exact cleaved portion.
 */
function buildCleavagePolygons(relX, relY, stage = 'broken') {
  const cx = Math.round(Math.max(18, Math.min(82, relX * 100)));
  const cy = Math.round(Math.max(18, Math.min(82, relY * 100)));

  if (stage === 'tilted') {
    // Stage 2: noticeable chipped bite near impact edge
    if (relX >= 0.5) {
      const x1 = Math.max(58, cx - 14);
      const yMid = cy;
      const yTop = Math.max(0, cy - 26);
      const yBot = Math.min(100, cy + 26);
      return {
        remainPoly: `polygon(0% 0%, 100% 0%, 100% ${yTop}%, ${x1}% ${yMid}%, 100% ${yBot}%, 100% 100%, 0% 100%)`,
        shardAPoly: `polygon(100% ${yTop}%, 100% ${yBot}%, ${x1}% ${yMid}%)`,
        shardBPoly: null,
        dirX: 1,
        dirY: relY < 0.5 ? -1 : 1,
      };
    }
    const x1 = Math.min(42, cx + 14);
    const yMid = cy;
    const yTop = Math.max(0, cy - 26);
    const yBot = Math.min(100, cy + 26);
    return {
      remainPoly: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${yBot}%, ${x1}% ${yMid}%, 0% ${yTop}%)`,
      shardAPoly: `polygon(0% ${yTop}%, ${x1}% ${yMid}%, 0% ${yBot}%)`,
      shardBPoly: null,
      dirX: -1,
      dirY: relY < 0.5 ? -1 : 1,
    };
  }

  // Stage 3 (broken): deep diagonal cleavage removing 38%-48% of the surface around contact point
  if (relX >= 0.5) {
    const splitTop = Math.max(36, Math.min(76, cx - 12));
    const splitMidX = Math.max(28, Math.min(68, cx - 20));
    const splitMidY = Math.max(26, Math.min(74, cy));
    const splitBot = Math.max(42, Math.min(82, cx - 6));
    return {
      remainPoly: `polygon(0% 0%, ${splitTop}% 0%, ${splitMidX}% ${splitMidY}%, ${splitBot}% 100%, 0% 100%)`,
      shardAPoly: `polygon(${splitTop}% 0%, 100% 0%, 100% ${splitMidY + 12}%, ${splitMidX}% ${splitMidY}%)`,
      shardBPoly: `polygon(${splitMidX}% ${splitMidY}%, 100% ${splitMidY + 12}%, 100% 100%, ${splitBot}% 100%)`,
      dirX: 1,
      dirY: relY < 0.5 ? -1 : 1,
    };
  }

  const splitTop = Math.max(24, Math.min(64, cx + 12));
  const splitMidX = Math.max(32, Math.min(72, cx + 20));
  const splitMidY = Math.max(26, Math.min(74, cy));
  const splitBot = Math.max(18, Math.min(58, cx + 6));
  return {
    remainPoly: `polygon(${splitTop}% 0%, 100% 0%, 100% 100%, ${splitBot}% 100%, ${splitMidX}% ${splitMidY}%)`,
    shardAPoly: `polygon(0% 0%, ${splitTop}% 0%, ${splitMidX}% ${splitMidY}%, 0% ${splitMidY + 12}%)`,
    shardBPoly: `polygon(0% ${splitMidY + 12}%, ${splitMidX}% ${splitMidY}%, ${splitBot}% 100%, 0% 100%)`,
    dirX: -1,
    dirY: relY < 0.5 ? -1 : 1,
  };
}

function stripCloneIdsAndTargets(rootNode) {
  if (!rootNode || rootNode.nodeType !== 1) return;
  rootNode.removeAttribute('id');
  rootNode.removeAttribute('data-p34-target');
  rootNode.removeAttribute('data-p34-action');
  rootNode.setAttribute('aria-hidden', 'true');
  rootNode.inert = true;
  for (const child of rootNode.querySelectorAll('[id], [data-p34-target], [data-p34-action], a, button, input, select')) {
    child.removeAttribute('id');
    child.removeAttribute('data-p34-target');
    child.removeAttribute('data-p34-action');
    if (child.tagName === 'A' || child.tagName === 'BUTTON' || child.tagName === 'INPUT' || child.tagName === 'SELECT') {
      child.setAttribute('tabindex', '-1');
    }
  }
}

function extractHitSnippet(el, relX) {
  const raw = (el?.textContent || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '◇';
  const len = raw.length;
  const span = Math.min(len, Math.max(3, Math.min(8, Math.ceil(len * 0.28))));
  const start = Math.max(0, Math.min(len - span, Math.floor(relX * (len - span))));
  return raw.slice(start, start + span);
}

/**
 * Initiates the classic full-document breakout game.
 */
export function startBreakoutGame({
  page,
  motion,
  fx,
  speak,
  onExit,
  lang = 'zh',
} = {}) {
  const isEn = String(lang).toLowerCase().startsWith('en');
  const copy = isEn ? GAME_COPY.en : GAME_COPY.zh;

  const controller = new AbortController();
  const { signal } = controller;

  // Track all game-owned WAAPI animations so none leak on repair/restart/exit
  const gameAnimations = new Set();

  function gameAnimate(el, keyframes, options = {}, collider = null) {
    if (!el || typeof el.animate !== 'function' || motion?.reduced() || document.hidden) {
      return null;
    }
    const anim = el.animate(keyframes, options);
    gameAnimations.add(anim);
    if (collider) collider.animations.add(anim);
    const cleanupAnim = () => {
      gameAnimations.delete(anim);
      if (collider) collider.animations.delete(anim);
    };
    anim.finished?.then(cleanupAnim, cleanupAnim);
    return anim;
  }

  function cancelColliderAnimations(col) {
    if (!col?.animations) return;
    for (const anim of col.animations) {
      try { anim.cancel(); } catch {}
      gameAnimations.delete(anim);
    }
    col.animations.clear();
  }

  function cancelAllGameAnimations() {
    for (const anim of gameAnimations) {
      try { anim.cancel(); } catch {}
    }
    gameAnimations.clear();
  }

  // Dynamic World Extents (actual document measurements, no fabricated 2400 floor)
  let viewWidth = window.innerWidth || document.documentElement.clientWidth || 1024;
  let viewHeight = window.innerHeight || document.documentElement.clientHeight || 768;
  let docWidth = Math.max(document.documentElement.clientWidth || 0, viewWidth);
  let docHeight = Math.max(
    document.documentElement.scrollHeight || 0,
    document.body?.scrollHeight || 0,
    page?.scrollHeight || 0,
    viewHeight
  );

  function measureWorldExtents() {
    viewWidth = window.innerWidth || document.documentElement.clientWidth || 1024;
    viewHeight = window.innerHeight || document.documentElement.clientHeight || 768;
    docWidth = Math.max(document.documentElement.clientWidth || 0, viewWidth);
    docHeight = Math.max(
      document.documentElement.scrollHeight || 0,
      document.body?.scrollHeight || 0,
      page?.scrollHeight || 0,
      viewHeight
    );
  }

  // Document-space layer for detached cleaved shards & physical rescue note
  const fractureLayer = document.createElement('div');
  fractureLayer.className = 'p34-fracture-layer';
  fractureLayer.setAttribute('aria-hidden', 'true');
  fractureLayer.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:35;overflow:hidden;';
  (page || document.body).append(fractureLayer);

  const rescueNoteEl = document.createElement('div');
  rescueNoteEl.className = 'p34-rescue-note';
  rescueNoteEl.setAttribute('aria-hidden', 'true');
  rescueNoteEl.hidden = true;
  rescueNoteEl.innerHTML = `<span class="p34-rescue-note-tag">${copy.rescueActive}</span>`;
  document.body.append(rescueNoteEl);

  // Canvas Viewport Overlay
  const canvas = document.createElement('canvas');
  canvas.className = 'p34-breakout-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');

  // Floating camera-bound HUD and dialogue line
  const hud = document.createElement('div');
  hud.className = 'p34-game-hud';
  hud.innerHTML = `
    <div class="p34-hud-left">
      <span class="p34-hud-metric"><span class="p34-hud-label">${copy.hudScore}</span> <strong data-hud-score>0</strong></span>
      <span class="p34-hud-metric"><span class="p34-hud-label">${copy.hudCombo}</span> <strong data-hud-combo>0x</strong></span>
      <span class="p34-hud-metric"><span class="p34-hud-label">${copy.hudLives}</span> <span class="p34-hud-lives" data-hud-lives>● ● ●</span></span>
    </div>
    <div class="p34-hud-center">
      <p class="p34-hud-voice" data-hud-voice>${copy.voiceStart}</p>
    </div>
    <div class="p34-hud-right">
      <button type="button" class="p34-hud-pause-btn" data-hud-pause aria-label="${copy.pauseAria}">Esc ⏸</button>
    </div>
  `;
  document.body.append(hud);

  const scoreEl = hud.querySelector('[data-hud-score]');
  const comboEl = hud.querySelector('[data-hud-combo]');
  const livesEl = hud.querySelector('[data-hud-lives]');
  const voiceEl = hud.querySelector('[data-hud-voice]');
  const pauseBtn = hud.querySelector('[data-hud-pause]');

  // Prompt banner at bottom
  const promptBanner = document.createElement('div');
  promptBanner.className = 'p34-game-prompt';
  promptBanner.textContent = copy.readyPrompt;
  document.body.append(promptBanner);

  // Collect and snapshot [data-p34-target] colliders in document coordinates
  const rawNodes = [...(page || document).querySelectorAll('[data-p34-target]')].filter(
    el => !el.hidden && !el.closest('[hidden]')
  );
  // Avoid nested colliders causing double hits
  const targetNodes = rawNodes.filter(node => !rawNodes.some(other => other !== node && other.contains(node)));

  const initialScrollX = window.scrollX || window.pageXOffset || 0;
  const initialScrollY = window.scrollY || window.pageYOffset || 0;

  const colliders = targetNodes
    .map((el, index) => {
      const rect = el.getBoundingClientRect();
      const type = el.dataset.p34Target || 'surface';
      const hp = type === 'title' || type === 'decor' || type === 'experiment'
        ? 3
        : type === 'card' || type === 'voice' || type === 'launcher' || type === 'note' || type === 'piece' || type === 'nav'
          ? 3
          : 2;
      const baseX = rect.left + initialScrollX;
      const baseY = rect.top + initialScrollY;
      return {
        id: index,
        element: el,
        type,
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        width: rect.width,
        height: rect.height,
        offsetX: 0,
        offsetY: 0,
        tiltDeg: 0,
        hp,
        maxHp: hp,
        hits: 0,
        broken: false,
        lastHitAt: -1000,
        backupStyle: el.getAttribute('style'),
        backupClass: el.className,
         backupFractured: el.getAttribute('data-p34-fractured'),
        shards: [],
        animations: new Set(),
      };
    })
    .filter(c => c.width > 12 && c.height > 12);

  measureWorldExtents();

  // Game state
  let paddleWidth = DEFAULT_PADDLE_WIDTH;
  let paddleHeight = DEFAULT_PADDLE_HEIGHT;
  let paddleX = Math.max(8, (docWidth - paddleWidth) / 2);
  let currentCameraY = 0;

  function syncScrollTo(desiredY) {
    const maxScroll = Math.max(0, docHeight - viewHeight);
    const clamped = Math.max(0, Math.min(maxScroll, desiredY));
    window.scrollTo(0, clamped);
    const actualY = window.scrollY ?? window.pageYOffset;
    currentCameraY = Number.isFinite(actualY) ? actualY : clamped;
  }

  // Start camera at bottom of actual document
  syncScrollTo(Math.max(0, docHeight - viewHeight));

  let paddleDocY = currentCameraY + viewHeight - PADDLE_BOTTOM_MARGIN;
  let ballRadius = DEFAULT_BALL_RADIUS;
  let ball = {
    x: paddleX + paddleWidth / 2,
    y: paddleDocY - ballRadius - 1,
    vx: 0,
    vy: 0,
    radius: ballRadius,
  };

  let ballResting = true;
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let lives = MAX_LIVES;
  let rescuesRemaining = 1;
  let rescueState = {
    activeUntil: 0,
    x: 0,
    width: 0,
  };
  let isPaused = false;
  let isOver = false;
  let destroyed = false;
  let rafId = null;
  let lastTime = performance.now();
  let accumulator = 0;

  // Key tracking
  const keys = { left: false, right: false };

  // Particles & Trail
  const particles = [];
  const trail = [];

  function removeColliderShards(col) {
    if (!col?.shards) return;
    for (const node of col.shards) {
      node.getAnimations?.().forEach(a => {
        try { a.cancel(); } catch {}
        gameAnimations.delete(a);
      });
      node.remove();
    }
    col.shards.length = 0;
  }

  function restoreSingleCollider(col, remeasure = false) {
    cancelColliderAnimations(col);
    removeColliderShards(col);
    col.broken = false;
    col.hp = col.maxHp;
    col.hits = 0;
    col.offsetX = 0;
    col.offsetY = 0;
    col.tiltDeg = 0;
    col.element.className = col.backupClass;
    if (col.backupStyle === null) col.element.removeAttribute('style');
    else col.element.setAttribute('style', col.backupStyle);
    if (col.backupFractured === null) col.element.removeAttribute('data-p34-fractured');
    else col.element.setAttribute('data-p34-fractured', col.backupFractured);

    if (remeasure && col.element.isConnected) {
      const sx = window.scrollX || window.pageXOffset || 0;
      const sy = window.scrollY || window.pageYOffset || 0;
      const rect = col.element.getBoundingClientRect();
      col.baseX = rect.left + sx;
      col.baseY = rect.top + sy;
      col.width = rect.width;
      col.height = rect.height;
    }
    col.x = col.baseX;
    col.y = col.baseY;
  }

  function refreshColliderGeometryOnResize() {
    const sx = window.scrollX || window.pageXOffset || 0;
    const sy = window.scrollY || window.pageYOffset || 0;
    for (const col of colliders) {
      if (!col.element.isConnected) continue;
      // Temporarily read current bounding box and subtract known persistent offset
      const rect = col.element.getBoundingClientRect();
      if (rect.width > 4 && rect.height > 4) {
        col.baseX = rect.left + sx - col.offsetX;
        col.baseY = rect.top + sy - col.offsetY;
        col.width = rect.width;
        col.height = rect.height;
        col.x = col.baseX + col.offsetX;
        col.y = col.baseY + col.offsetY;
      }
    }
  }

  function resizeCanvasAndWorld() {
    const dpr = window.devicePixelRatio || 1;
    measureWorldExtents();
    canvas.width = Math.round(viewWidth * dpr);
    canvas.height = Math.round(viewHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    refreshColliderGeometryOnResize();
    syncScrollTo(currentCameraY);
    paddleX = Math.max(8, Math.min(docWidth - paddleWidth - 8, paddleX));
    paddleDocY = currentCameraY + viewHeight - PADDLE_BOTTOM_MARGIN;
    if (ballResting) {
      ball.x = paddleX + paddleWidth * 0.5;
      ball.y = paddleDocY - ballRadius - 1;
    } else {
      ball.x = Math.max(ballRadius + 1, Math.min(docWidth - ballRadius - 1, ball.x));
      ball.y = Math.max(ballRadius + 1, Math.min(docHeight - ballRadius - 1, ball.y));
    }
    if (isPaused || isOver) {
      renderFrame(performance.now());
    }
  }

  resizeCanvasAndWorld();
  window.addEventListener('resize', resizeCanvasAndWorld, { signal });
  window.addEventListener('orientationchange', resizeCanvasAndWorld, { signal });

  function setVoice(text) {
    if (voiceEl) {
      voiceEl.textContent = text;
      gameAnimate(
        voiceEl,
        [
          { opacity: 0.35, transform: 'translateY(3px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 220 }
      );
    }
    if (typeof speak === 'function') {
      speak(text);
    }
  }

  function updateHUD() {
    if (scoreEl) scoreEl.textContent = String(score);
    if (comboEl) comboEl.textContent = `${combo}x`;
    if (livesEl) {
      const lights = Array.from({ length: MAX_LIVES }, (_, i) => (i < lives ? '●' : '○')).join(' ');
      livesEl.textContent = lights;
    }
  }

  function resetBallOnPaddle() {
    ballResting = true;
    trail.length = 0;
    rescueState.activeUntil = 0;
    rescueNoteEl.hidden = true;
    paddleDocY = currentCameraY + viewHeight - PADDLE_BOTTOM_MARGIN;
    ball = {
      x: paddleX + paddleWidth / 2,
      y: paddleDocY - ballRadius - 1,
      vx: 0,
      vy: 0,
      radius: ballRadius,
    };
    if (promptBanner) promptBanner.hidden = false;
  }

  function launchBall() {
    if (!ballResting || isPaused || isOver) return;
    ballResting = false;
    trail.length = 0;
    if (promptBanner) promptBanner.hidden = true;
    const randomAngle = (Math.random() - 0.5) * 0.35;
    const speed = 520;
    ball.vx = speed * Math.sin(randomAngle);
    ball.vy = -Math.abs(speed * Math.cos(randomAngle));
    motion?.tone(2, true);
  }

  function spawnFractureShards(col, hitX, hitY, relX, relY, cleavage, isFinalBreak) {
    const pageRect = (page || document.body).getBoundingClientRect();
    const sx = window.scrollX || window.pageXOffset || 0;
    const sy = window.scrollY || window.pageYOffset || 0;
    const hostLeft = pageRect.left + sx;
    const hostTop = pageRect.top + sy;
    const localLeft = col.baseX - hostLeft;
    const localTop = col.baseY - hostTop;

    // 1. Clipped visual clone shard A (stays visibly resting/tilted right beside the cleaved gap)
    if (cleavage.shardAPoly) {
      const shardA = col.element.cloneNode(true);
      stripCloneIdsAndTargets(shardA);
      shardA.classList.remove('p34-target-dented', 'p34-target-tilted', 'p34-target-broken');
      shardA.classList.add('p34-fracture-shard', isFinalBreak ? 'p34-fracture-shard-resting' : 'p34-fracture-shard-chip');
      const driftX = cleavage.dirX * (isFinalBreak ? 22 : 12);
      const driftY = isFinalBreak ? 16 : 9;
      const rot = cleavage.dirX * (isFinalBreak ? 11.5 : 6.5);
      shardA.style.cssText = `
        position:absolute;
        left:${localLeft}px;
        top:${localTop}px;
        width:${col.width}px;
        height:${col.height}px;
        margin:0;
        pointer-events:none;
        clip-path:${cleavage.shardAPoly};
        transform:translate(${driftX}px, ${driftY}px) rotate(${rot}deg);
        opacity:${isFinalBreak ? '0.84' : '0.72'};
        filter:drop-shadow(${-cleavage.dirX * 2}px 4px 10px rgba(98, 52, 156, 0.24));
      `;
      fractureLayer.append(shardA);
      col.shards.push(shardA);

      gameAnimate(
        shardA,
        [
          { transform: 'translate(0px, 0px) rotate(0deg)', opacity: 0.96 },
          { transform: `translate(${driftX}px, ${driftY}px) rotate(${rot}deg)`, opacity: isFinalBreak ? 0.84 : 0.72 },
        ],
        { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)' },
        col
      );
    }

    // 2. Clipped visual clone shard B (breaks off further on final cleavage)
    if (isFinalBreak && cleavage.shardBPoly) {
      const shardB = col.element.cloneNode(true);
      stripCloneIdsAndTargets(shardB);
      shardB.classList.remove('p34-target-dented', 'p34-target-tilted', 'p34-target-broken');
      shardB.classList.add('p34-fracture-shard', 'p34-fracture-shard-secondary');
      const driftX = cleavage.dirX * 34;
      const driftY = 28;
      const rot = -cleavage.dirX * 15;
      shardB.style.cssText = `
        position:absolute;
        left:${localLeft}px;
        top:${localTop}px;
        width:${col.width}px;
        height:${col.height}px;
        margin:0;
        pointer-events:none;
        clip-path:${cleavage.shardBPoly};
        transform:translate(${driftX}px, ${driftY}px) rotate(${rot}deg) scale(0.95);
        opacity:0.64;
      `;
      fractureLayer.append(shardB);
      col.shards.push(shardB);

      gameAnimate(
        shardB,
        [
          { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 0.92 },
          { transform: `translate(${driftX}px, ${driftY}px) rotate(${rot}deg) scale(0.95)`, opacity: 0.64 },
        ],
        { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' },
        col
      );
    }

    // 3. Recognisable text/glyph chip derived from the hit node's exact text near contact point
    const snippet = extractHitSnippet(col.element, relX);
    const chip = document.createElement('span');
    chip.className = 'p34-fracture-glyph-chip';
    chip.setAttribute('aria-hidden', 'true');
    chip.textContent = snippet;
    const chipX = hitX - hostLeft;
    const chipY = hitY - hostTop;
    const chipDx = cleavage.dirX * (18 + Math.round(relX * 12));
    const chipDy = isFinalBreak ? 22 : 12;
    const chipRot = cleavage.dirX * (isFinalBreak ? 14 : 8);
    chip.style.cssText = `
      position:absolute;
      left:${chipX}px;
      top:${chipY}px;
      transform:translate(-50%, -50%) translate(${chipDx}px, ${chipDy}px) rotate(${chipRot}deg);
    `;
    fractureLayer.append(chip);
    col.shards.push(chip);

    gameAnimate(
      chip,
      [
        { transform: 'translate(-50%, -50%) scale(1.06) rotate(0deg)', opacity: 0.98 },
        { transform: `translate(-50%, -50%) translate(${chipDx}px, ${chipDy}px) rotate(${chipRot}deg)`, opacity: 0.88 },
      ],
      { duration: 340, easing: 'cubic-bezier(.22, 1, .36, 1)' },
      col
    );
  }

  // Contact-local progressive fracture on actual DOM element (preserves all original children/listeners)
  function applyColliderDamage(col, normalX, normalY, hitX, hitY) {
    col.hits++;
    col.hp = Math.max(0, col.hp - 1);

    const el = col.element;
    const isBroken = col.hp <= 0;
    col.broken = isBroken;

    const relX = Math.max(0.08, Math.min(0.92, (hitX - col.x) / Math.max(1, col.width)));
    const relY = Math.max(0.08, Math.min(0.92, (hitY - col.y) / Math.max(1, col.height)));
    const arm = (relX - 0.5) * 2; // [-1, 1] torque arm from contact offset
    const pushX = -normalX;
    const pushY = -normalY;

    cancelColliderAnimations(col);

    if (isBroken) {
      // Stage 3: Cleaved missing surface + tilted displacement + recognisable content shards
      removeColliderShards(col);
      const cleavage = buildCleavagePolygons(relX, relY, 'broken');
      col.offsetX = Math.round(pushX * 10 - cleavage.dirX * 8);
      col.offsetY = Math.round(pushY * 8 + 6);
      col.tiltDeg = Number(((-cleavage.dirX * 5.2) + arm * 2.4).toFixed(2));
      col.x = col.baseX + col.offsetX;
      col.y = col.baseY + col.offsetY;

      el.classList.remove('p34-target-dented', 'p34-target-tilted');
      el.classList.add('p34-target-broken');
      el.setAttribute('data-p34-fractured', 'cleaved');
      el.style.transformOrigin = `${Math.round(relX * 100)}% ${Math.round(relY * 100)}%`;
      el.style.transform = `translate(${col.offsetX}px, ${col.offsetY}px) rotate(${col.tiltDeg}deg)`;
      el.style.clipPath = cleavage.remainPoly;
      el.style.pointerEvents = 'none';

      spawnFractureShards(col, hitX, hitY, relX, relY, cleavage, true);

      gameAnimate(
        el,
        [
          { transform: `translate(${col.offsetX * 0.4}px, ${col.offsetY * 0.4}px) rotate(${(col.tiltDeg * 0.4).toFixed(1)}deg)` },
          { transform: `translate(${col.offsetX + pushX * 5}px, ${col.offsetY + pushY * 5}px) rotate(${(col.tiltDeg * 1.25).toFixed(1)}deg)`, offset: 0.35 },
          { transform: `translate(${col.offsetX}px, ${col.offsetY}px) rotate(${col.tiltDeg}deg)` },
        ],
        { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)' },
        col
      );
    } else if (col.hits === 1 && col.maxHp >= 3) {
      // Stage 1: Light dent + visible local tilt/displacement
      col.offsetX = Math.round(pushX * 5 + arm * 3);
      col.offsetY = Math.round(pushY * 5 + 2);
      col.tiltDeg = Number(((arm >= 0 ? 1 : -1) * 2.4 + pushX * 1.2).toFixed(2));
      col.x = col.baseX + col.offsetX;
      col.y = col.baseY + col.offsetY;

      el.classList.add('p34-target-dented');
      el.setAttribute('data-p34-fractured', 'dented');
      el.style.transformOrigin = `${Math.round(relX * 100)}% ${Math.round(relY * 100)}%`;
      el.style.transform = `translate(${col.offsetX}px, ${col.offsetY}px) rotate(${col.tiltDeg}deg)`;

      gameAnimate(
        el,
        [
          { transform: 'translate(0px, 0px) rotate(0deg)' },
          { transform: `translate(${col.offsetX + pushX * 4}px, ${col.offsetY + pushY * 4}px) rotate(${(col.tiltDeg * 1.4).toFixed(1)}deg)`, offset: 0.3 },
          { transform: `translate(${col.offsetX}px, ${col.offsetY}px) rotate(${col.tiltDeg}deg)` },
        ],
        { duration: 300, easing: 'cubic-bezier(.22, 1, .36, 1)' },
        col
      );
    } else {
      // Stage 2: Clearly displaced / tilted + chipped edge + initial shard fragment
      const cleavage = buildCleavagePolygons(relX, relY, 'tilted');
      col.offsetX = Math.round(pushX * 9 + arm * 6);
      col.offsetY = Math.round(pushY * 7 + 4);
      col.tiltDeg = Number(((arm >= 0 ? 1 : -1) * 4.8 + pushX * 1.8).toFixed(2));
      col.x = col.baseX + col.offsetX;
      col.y = col.baseY + col.offsetY;

      el.classList.remove('p34-target-dented');
      el.classList.add('p34-target-tilted');
      el.setAttribute('data-p34-fractured', 'tilted');
      el.style.transformOrigin = `${Math.round(relX * 100)}% ${Math.round(relY * 100)}%`;
      el.style.transform = `translate(${col.offsetX}px, ${col.offsetY}px) rotate(${col.tiltDeg}deg)`;
      el.style.clipPath = cleavage.remainPoly;

      spawnFractureShards(col, hitX, hitY, relX, relY, cleavage, false);

      gameAnimate(
        el,
        [
          { transform: `translate(${col.offsetX * 0.5}px, ${col.offsetY * 0.5}px) rotate(${(col.tiltDeg * 0.5).toFixed(1)}deg)` },
          { transform: `translate(${col.offsetX + pushX * 5}px, ${col.offsetY + pushY * 5}px) rotate(${(col.tiltDeg * 1.3).toFixed(1)}deg)`, offset: 0.32 },
          { transform: `translate(${col.offsetX}px, ${col.offsetY}px) rotate(${col.tiltDeg}deg)` },
        ],
        { duration: 330, easing: 'cubic-bezier(.22, 1, .36, 1)' },
        col
      );
    }

    // Spawn finite luminous sparks at exact contact point (hitX, hitY)
    spawnSparks(hitX, hitY, isBroken ? 16 : 9);
    if (fx) {
      const screenX = hitX;
      const screenY = hitY - currentCameraY;
      fx.parryClash(screenX, screenY, normalX, normalY, {
        tier: isBroken ? 3 : col.hits > 1 ? 2 : 1,
        palette: isBroken ? 'gold' : 'cyan',
        scale: isBroken ? 1.25 : 1.0,
      });
    }
  }

  function spawnSparks(docX, docY, count = 12) {
    if (motion?.reduced()) return;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.35;
      const speed = 80 + Math.random() * 210;
      particles.push({
        x: docX,
        y: docY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 1.9 + Math.random() * 1.4,
        color: i % 3 === 0 ? '#EF795F' : '#F6C668',
        size: 2 + Math.random() * 2.8,
      });
    }
  }

  // Resident's fair gameplay interventions (combo cheer & physical element repair)
  function handleInterventions() {
    if (combo === 3) {
      setVoice(copy.voiceCheer1);
    } else if (combo === 5) {
      // Physically repair one damaged or cleaved collider and remeasure its DOM geometry
      const damaged = colliders.find(c => c.broken) || colliders.find(c => c.hp < c.maxHp);
      if (damaged) {
        restoreSingleCollider(damaged, true);
        gameAnimate(
          damaged.element,
          [
            { filter: 'drop-shadow(0 0 0px rgba(246, 198, 104, 0))', transform: 'scale(0.98)' },
            { filter: 'drop-shadow(0 0 12px rgba(255, 231, 71, 0.55))', transform: 'scale(1.01)', offset: 0.45 },
            { filter: 'drop-shadow(0 0 0px rgba(246, 198, 104, 0))', transform: 'scale(1)' },
          ],
          { duration: 520 },
          damaged
        );
        if (fx && damaged) { fx.collectBurst(damaged.x + damaged.width * 0.5, damaged.y + damaged.height * 0.5 - currentCameraY, { palette: 'cyan', scale: 1.2 }); }
        setVoice(copy.voiceCheer2);
        motion?.tone(5, true);
      }
    } else if (combo === 8) {
      setVoice(copy.voiceCheer3);
    }
  }

  // Check and activate pre-loss physical rescue note BEFORE ball passes the paddle plane
  function maybeActivatePreLossRescue(now) {
    if (rescuesRemaining <= 0 || ballResting || ball.vy <= 0) return;
    // Trigger when descending ball approaches paddle plane and would miss current paddle span
    const approachingPaddlePlane =
      ball.y + ball.radius >= paddleDocY - 38 &&
      ball.y - ball.radius <= paddleDocY + paddleHeight;
    const missesPaddleHorizontally =
      ball.x < paddleX - ball.radius * 0.4 ||
      ball.x > paddleX + paddleWidth + ball.radius * 0.4;

    if (approachingPaddlePlane && missesPaddleHorizontally) {
      rescuesRemaining--;
      const spanMinX = Math.max(6, Math.min(paddleX, ball.x - 56));
      const spanMaxX = Math.min(docWidth - 6, Math.max(paddleX + paddleWidth, ball.x + 56));
      rescueState = {
        activeUntil: now + 950,
        x: spanMinX,
        width: Math.max(paddleWidth, spanMaxX - spanMinX),
      };
      rescueNoteEl.hidden = false;
      updateRescueNoteDOM();
      spawnSparks(ball.x, paddleDocY, 18);
      if (fx) { fx.manaNova(ball.x, paddleDocY - currentCameraY, { palette: 'gold', scale: 1.2 }); }
      motion?.tone(5, true);
      setVoice(copy.voiceRescue);
    }
  }

  function updateRescueNoteDOM() {
    if (rescueNoteEl.hidden) return;
    const screenY = paddleDocY - currentCameraY;
    rescueNoteEl.style.left = `${rescueState.x}px`;
    rescueNoteEl.style.top = `${screenY - 2}px`;
    rescueNoteEl.style.width = `${rescueState.width}px`;
    rescueNoteEl.style.height = `${paddleHeight + 6}px`;
  }

  function scheduleLoop() {
    if (destroyed || isPaused || isOver || rafId !== null) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // Pause menu
  let pauseModal = null;
  function togglePause(forceState) {
    if (isOver || destroyed) return;
    const nextPaused = forceState !== undefined ? Boolean(forceState) : !isPaused;
    if (nextPaused === isPaused) return;
    isPaused = nextPaused;
    keys.left = false;
    keys.right = false;

    if (isPaused) {
      stopLoop();
      if (!pauseModal) {
        pauseModal = document.createElement('div');
        pauseModal.className = 'p34-pause-modal';
        pauseModal.setAttribute('role', 'dialog');
        pauseModal.setAttribute('aria-modal', 'true');
        pauseModal.innerHTML = `
          <div class="p34-modal-card">
            <h3 class="p34-modal-title">${copy.pausedTitle}</h3>
            <div class="p34-modal-actions">
              <button type="button" class="p34-modal-btn p34-btn-primary" data-pause-action="resume">${copy.btnResume}</button>
              <button type="button" class="p34-modal-btn" data-pause-action="restart">${copy.btnRestart}</button>
              <button type="button" class="p34-modal-btn p34-btn-exit" data-pause-action="exit">${copy.btnExit}</button>
            </div>
          </div>
        `;
        document.body.append(pauseModal);
        pauseModal.addEventListener('click', e => {
          const btn = e.target.closest('[data-pause-action]');
          if (!btn) return;
          const act = btn.dataset.pauseAction;
          if (act === 'resume') {
            togglePause(false);
          } else if (act === 'restart') {
            togglePause(false);
            restartGame();
          } else if (act === 'exit') {
            exitGame();
          }
        });
      }
      pauseModal.hidden = false;
      renderFrame(performance.now());
      pauseModal.querySelector('[data-pause-action="resume"]')?.focus({ preventScroll: true });
    } else {
      if (pauseModal) pauseModal.hidden = true;
      scheduleLoop();
    }
  }

  // Game over modal
  let gameOverModal = null;
  function triggerGameOver() {
    isOver = true;
    ballResting = true;
    keys.left = false;
    keys.right = false;
    trail.length = 0;
    stopLoop();
    setVoice(copy.voiceOver);

    // Save persistent breakout cookie and local run entry
    const savedState = readBreakoutCookie();
    const updatedState = recordBreakoutRun(savedState, { score, combo: maxCombo, completed: true });
    writeBreakoutCookie(updatedState);
    appendRecentRun({ score, maxCombo, edition: 'luminous' });

    gameOverModal = document.createElement('div');
    gameOverModal.className = 'p34-game-over-modal';
    gameOverModal.setAttribute('role', 'dialog');
    gameOverModal.setAttribute('aria-modal', 'true');
    gameOverModal.innerHTML = `
      <div class="p34-modal-card">
        <h3 class="p34-modal-title">${copy.overTitle}</h3>
        <div class="p34-modal-stats">
          <div class="p34-stat-row"><span>${copy.overScore}</span> <strong>${score}</strong></div>
          <div class="p34-stat-row"><span>${copy.overCombo}</span> <strong>${maxCombo}x</strong></div>
          <div class="p34-stat-row"><span>${copy.overRuns}</span> <strong>${updatedState.runs}</strong></div>
          <div class="p34-stat-row"><span>${copy.overBest}</span> <strong>${updatedState.bestScore}</strong></div>
        </div>
        <div class="p34-modal-actions">
          <button type="button" class="p34-modal-btn p34-btn-primary" data-over-action="again">${copy.btnPlayAgain}</button>
          <button type="button" class="p34-modal-btn p34-btn-exit" data-over-action="exit">${copy.btnExit}</button>
        </div>
      </div>
    `;
    document.body.append(gameOverModal);
    gameOverModal.addEventListener('click', e => {
      const btn = e.target.closest('[data-over-action]');
      if (!btn) return;
      if (btn.dataset.overAction === 'again') {
        gameOverModal.remove();
        gameOverModal = null;
        restartGame();
      } else {
        gameOverModal.remove();
        gameOverModal = null;
        exitGame();
      }
    });
    renderFrame(performance.now());
    gameOverModal.querySelector('[data-over-action="again"]')?.focus({ preventScroll: true });
  }

  function restartGame() {
    cancelAllGameAnimations();
    score = 0;
    combo = 0;
    maxCombo = 0;
    lives = MAX_LIVES;
    rescuesRemaining = 1;
    rescueState = { activeUntil: 0, x: 0, width: 0 };
    rescueNoteEl.hidden = true;
    particles.length = 0;
    trail.length = 0;
    accumulator = 0;
    isOver = false;
    isPaused = false;
    if (pauseModal) pauseModal.hidden = true;

    measureWorldExtents();
    syncScrollTo(Math.max(0, docHeight - viewHeight));

    // Restore all damaged colliders & re-read clean geometry
    for (const c of colliders) {
      restoreSingleCollider(c, true);
    }

    updateHUD();
    setVoice(copy.voiceStart);
    paddleX = Math.max(8, (docWidth - paddleWidth) / 2);
    resetBallOnPaddle();
    scheduleLoop();
  }

  function exitGame() {
    cleanup();
    if (typeof onExit === 'function') onExit();
  }

  // Scoped Game Input Listeners
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!isOver) {
        e.preventDefault();
        togglePause();
      }
      return;
    }

    // When modal is open, let keyboard operate modal buttons normally
    if (isPaused || isOver) return;

    if (e.key === 'ArrowLeft' || e.code === 'KeyA') {
      e.preventDefault();
      keys.left = true;
    } else if (e.key === 'ArrowRight' || e.code === 'KeyD') {
      e.preventDefault();
      keys.right = true;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
    } else if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (ballResting) launchBall();
    }
  }, { signal });

  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.key === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  }, { signal });

  // Prevent wheel & touch scrolling while actively playing
  window.addEventListener('wheel', e => {
    if (!isPaused && !isOver) {
      e.preventDefault();
    }
  }, { signal, passive: false });

  window.addEventListener('mousemove', e => {
    if (isPaused || isOver) return;
    const clientX = e.clientX;
    paddleX = Math.max(8, Math.min(docWidth - paddleWidth - 8, clientX - paddleWidth * 0.5));
    if (ballResting) {
      ball.x = paddleX + paddleWidth * 0.5;
    }
  }, { signal });

  // Prevent underlying page links/buttons from firing while game is active
  window.addEventListener('click', e => {
    if (e.target.closest('.p34-game-hud, .p34-pause-modal, .p34-game-over-modal')) return;
    e.preventDefault();
    e.stopPropagation();
  }, { signal, capture: true });

  window.addEventListener('pointerdown', e => {
    if (e.target.closest('.p34-game-hud, .p34-pause-modal, .p34-game-over-modal')) return;
    if (isPaused || isOver) return;
    if (Number.isFinite(e.clientX)) {
      paddleX = Math.max(8, Math.min(docWidth - paddleWidth - 8, e.clientX - paddleWidth * 0.5));
      if (ballResting) ball.x = paddleX + paddleWidth * 0.5;
    }
    if (ballResting) {
      e.preventDefault();
      launchBall();
    }
  }, { signal, capture: true });

  window.addEventListener('touchmove', e => {
    if (isPaused || isOver || !e.touches[0]) return;
    if (!e.target.closest('.p34-pause-modal, .p34-game-over-modal')) {
      e.preventDefault();
    }
    const touchX = e.touches[0].clientX;
    paddleX = Math.max(8, Math.min(docWidth - paddleWidth - 8, touchX - paddleWidth * 0.5));
    if (ballResting) {
      ball.x = paddleX + paddleWidth * 0.5;
    }
  }, { signal, passive: false });

  // Clear keys and pause on window blur or tab hidden
  window.addEventListener('blur', () => {
    keys.left = false;
    keys.right = false;
    if (!isOver && !isPaused && !ballResting) {
      togglePause(true);
    }
  }, { signal });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      keys.left = false;
      keys.right = false;
      if (!isOver && !isPaused) {
        togglePause(true);
      }
    }
  }, { signal });

  pauseBtn?.addEventListener('click', () => togglePause(), { signal });

  function renderFrame(now) {
    ctx.clearRect(0, 0, viewWidth, viewHeight);

    const screenPaddleY = paddleDocY - currentCameraY;
    const screenBallX = ball.x;
    const screenBallY = ball.y - currentCameraY;

    // Update or hide physical rescue note DOM element
    if (now < rescueState.activeUntil) {
      updateRescueNoteDOM();
    } else if (!rescueNoteEl.hidden) {
      rescueNoteEl.hidden = true;
    }

    // Draw Ball Trail
    if (trail.length > 1 && !motion?.reduced()) {
      ctx.save();
      for (let i = 0; i < trail.length - 1; i++) {
        const p1 = trail[i];
        const p2 = trail[i + 1];
        const prog = i / trail.length;
        ctx.strokeStyle = `rgba(255, 231, 71, ${(prog * 0.45).toFixed(2)})`;
        ctx.lineWidth = ballRadius * (0.4 + prog * 0.8);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y - currentCameraY);
        ctx.lineTo(p2.x, p2.y - currentCameraY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw Particles
    if (particles.length > 0 && !motion?.reduced()) {
      ctx.save();
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y - currentCameraY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Paddle
    ctx.save();
    const paddleGradient = ctx.createLinearGradient(paddleX, screenPaddleY, paddleX, screenPaddleY + paddleHeight);
    paddleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    paddleGradient.addColorStop(1, 'rgba(255, 231, 71, 0.85)');
    ctx.fillStyle = paddleGradient;
    ctx.strokeStyle = '#F6C668';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = 'rgba(255, 231, 71, 0.45)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(paddleX, screenPaddleY, paddleWidth, paddleHeight, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(paddleX + 10, screenPaddleY + 2.5);
    ctx.lineTo(paddleX + paddleWidth - 10, screenPaddleY + 2.5);
    ctx.stroke();
    ctx.restore();

    // Draw Ball
    ctx.save();
    const ballGrad = ctx.createRadialGradient(
      screenBallX - 2,
      screenBallY - 2,
      1,
      screenBallX,
      screenBallY,
      ballRadius + 4
    );
    ballGrad.addColorStop(0, '#FFFFFF');
    ballGrad.addColorStop(0.4, '#FFF1CA');
    ballGrad.addColorStop(0.85, '#F6C668');
    ballGrad.addColorStop(1, 'rgba(246, 198, 104, 0)');
    ctx.fillStyle = ballGrad;
    ctx.shadowColor = '#F6C668';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(screenBallX, screenBallY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Main Loop
  function tick(now) {
    rafId = null;
    if (destroyed || isPaused || isOver) return;

    const elapsed = Math.max(0, Math.min(MAX_ACCUMULATOR, (now - lastTime) / 1000));
    lastTime = now;

    // Keyboard paddle movement
    const keySpeed = 680;
    if (keys.left) paddleX = Math.max(8, paddleX - keySpeed * elapsed);
    if (keys.right) paddleX = Math.min(docWidth - paddleWidth - 8, paddleX + keySpeed * elapsed);

    paddleDocY = currentCameraY + viewHeight - PADDLE_BOTTOM_MARGIN;

    if (ballResting) {
      ball.x = paddleX + paddleWidth * 0.5;
      ball.y = paddleDocY - ballRadius - 1;
    } else {
      accumulator = Math.min(MAX_ACCUMULATOR, accumulator + elapsed);
      let substepLost = false;

      while (accumulator + 1e-9 >= FIXED_DT) {
        accumulator = Math.max(0, accumulator - FIXED_DT);

        // Pre-loss physical rescue check before ball crosses the paddle line
        maybeActivatePreLossRescue(now);

        const rescueActive = now < rescueState.activeUntil;
        const activePaddle = rescueActive
          ? {
              x: rescueState.x,
              y: paddleDocY,
              width: rescueState.width,
              height: paddleHeight,
            }
          : {
              x: paddleX,
              y: paddleDocY,
              width: paddleWidth,
              height: paddleHeight,
            };

        const bounds = { width: docWidth, height: docHeight };
        const stepRes = stepBallSubstep({
          ball,
          colliders,
          paddle: activePaddle,
          bounds,
          dt: FIXED_DT,
        });

        ball = stepRes.ball;

        if (stepRes.hitPaddle) {
          motion?.tone(3, true);
          if (fx) {
            fx.parryClash(ball.x, paddleDocY - currentCameraY, 0, -1, {
              tier: combo >= 5 ? 3 : combo >= 2 ? 2 : 1,
              palette: combo >= 5 ? 'gold' : 'cyan',
              scale: 1.1,
            });
          }
        }

        if (stepRes.hitCollider) {
          const { collider, normalX, normalY, x: hitX, y: hitY } = stepRes.hitCollider;
          // Guard against trapped-ball repeat score inflation within 45ms on the same collider
          if (now - collider.lastHitAt >= 45) {
            collider.lastHitAt = now;
            combo++;
            maxCombo = Math.max(maxCombo, combo);
            score += 100 * combo;
            updateHUD();
            motion?.tone((combo % 6) + 1, true);
            applyColliderDamage(collider, normalX, normalY, hitX, hitY);
            handleInterventions();
          }
        }

        if (stepRes.lost) {
          substepLost = true;
          break;
        }
      }

      if (substepLost) {
        lives--;
        combo = 0;
        trail.length = 0;
        updateHUD();
        spawnSparks(ball.x, paddleDocY + 28, 14);
        if (lives > 0) {
          setVoice(copy.voiceLifeLost);
          resetBallOnPaddle();
        } else {
          triggerGameOver();
          return;
        }
      }

      // Camera Tracking synced to actual browser scrollY
      if (!ballResting && !isOver) {
        const desiredCamY = updateCameraY({
          currentCameraY,
          ballY: ball.y,
          ballVy: ball.vy,
          viewHeight,
          docHeight,
          dt: elapsed,
        });
        syncScrollTo(desiredCamY);
        paddleDocY = currentCameraY + viewHeight - PADDLE_BOTTOM_MARGIN;
      }

      // Store trail
      if (!ballResting) {
        trail.push({ x: ball.x, y: ball.y, time: now });
        while (trail.length > 16 || (trail[0] && now - trail[0].time > 180)) {
          trail.shift();
        }
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * elapsed;
      p.y += p.vy * elapsed;
      p.life -= p.decay * elapsed;
      if (p.life <= 0) particles.splice(i, 1);
    }

    renderFrame(now);
    scheduleLoop();
  }

  scheduleLoop();

  function cleanup() {
    if (destroyed) return;
    destroyed = true;
    stopLoop();
    controller.abort();
    cancelAllGameAnimations();
    canvas.remove();
    hud.remove();
    promptBanner?.remove();
    pauseModal?.remove();
    gameOverModal?.remove();
    rescueNoteEl.remove();

    // Precisely repair all colliders back to undamaged anomaly state without touching innerHTML
    for (const c of colliders) {
      restoreSingleCollider(c, false);
    }
    fractureLayer.remove();
  }

  return cleanup;
}
