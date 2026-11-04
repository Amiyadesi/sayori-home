import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
import {
  BREAKOUT_COOKIE_KEY,
  CURRENT_BREAKOUT_EDITION,
  createDefaultBreakoutState,
  parseBreakoutState,
  serializeBreakoutState,
  recordBreakoutRun,
  resolveCookieDomain,
  readRecentRuns,
  appendRecentRun,
} from '../public/p34-breakout-state.js';
import {
  FIXED_DT,
  MAX_ACCUMULATOR,
  computePaddleDeflection,
  intersectSweptSphereAABB,
  reflectVelocity,
  stepBallSubstep,
  stepPhysicsWithAccumulator,
  updateCameraY,
} from '../public/p34-breakout-physics.js';
import {
  transformParticipatingHref,
  collectBreakoutTargets,
  mountLuminousHome,
} from '../public/p34-luminous.js';

test('breakout state parses valid cookie and round-trips cleanly', () => {
  const token = 'v1.4.2480.18.luminous';
  const parsed = parseBreakoutState(token);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.state.runs, 4);
  assert.equal(parsed.state.bestScore, 2480);
  assert.equal(parsed.state.maxCombo, 18);
  assert.equal(parsed.state.edition, 'luminous');

  const serialized = serializeBreakoutState(parsed.state);
  assert.equal(serialized, token);
});

test('breakout state safely rejects invalid, malformed, or malicious tokens', () => {
  const badTokens = [
    '',
    null,
    undefined,
    12345,
    'v1.abc.xyz.0.luminous',
    'v1.0.0.0.luminous<script>alert(1)</script>',
    'v2.1.2.3.luminous',
    'v1.1.2',
    'v1.-5.100.2.luminous',
    'a'.repeat(80),
  ];
  for (const bad of badTokens) {
    const res = parseBreakoutState(bad);
    assert.equal(res.valid, false, `Failed on: ${bad}`);
    assert.deepEqual(res.state, createDefaultBreakoutState());
  }
});

test('recording a breakout run increments completed runs and updates high scores monotonically', () => {
  let state = createDefaultBreakoutState();
  assert.equal(state.runs, 0);
  assert.equal(state.bestScore, 0);
  assert.equal(state.maxCombo, 0);

  state = recordBreakoutRun(state, { score: 1200, combo: 8, completed: true });
  assert.equal(state.runs, 1);
  assert.equal(state.bestScore, 1200);
  assert.equal(state.maxCombo, 8);

  // Lower run does not decrease records
  state = recordBreakoutRun(state, { score: 850, combo: 4, completed: true });
  assert.equal(state.runs, 2);
  assert.equal(state.bestScore, 1200);
  assert.equal(state.maxCombo, 8);

  // Higher run updates bests
  state = recordBreakoutRun(state, { score: 3600, combo: 15, completed: true });
  assert.equal(state.runs, 3);
  assert.equal(state.bestScore, 3600);
  assert.equal(state.maxCombo, 15);
});

test('resolveCookieDomain maps formal and local sayori domains safely', () => {
  assert.equal(resolveCookieDomain('sayori.org'), '.sayori.org');
  assert.equal(resolveCookieDomain('blog.sayori.org'), '.sayori.org');
  assert.equal(resolveCookieDomain('store.sayori.org'), '.sayori.org');
  assert.equal(resolveCookieDomain('sayori.local'), '.sayori.local');
  assert.equal(resolveCookieDomain('127.0.0.1'), '');
  assert.equal(resolveCookieDomain('localhost'), '');
  assert.equal(resolveCookieDomain('evil-sayori.org'), '');
});

test('paddle deflection angles scale with contact offset and preserve nonzero vertical speed', () => {
  const paddleWidth = 140;
  const paddleX = 200; // center is at 270

  // Dead center hit
  const centerHit = computePaddleDeflection(270, paddleX, paddleWidth, 0, 500);
  assert.ok(Math.abs(centerHit.offset) < 0.01);
  assert.ok(centerHit.vy < -400); // upward
  assert.ok(Math.abs(centerHit.vx) < 5); // almost vertical

  // Far right hit (+offset)
  const rightHit = computePaddleDeflection(340, paddleX, paddleWidth, 0, 500);
  assert.equal(rightHit.offset, 1);
  assert.ok(rightHit.vx > 300); // deflected to right
  assert.ok(rightHit.vy < -180); // upward with at least minVy
  assert.ok(Math.abs(rightHit.vy) >= 180);

  // Far left hit (-offset)
  const leftHit = computePaddleDeflection(200, paddleX, paddleWidth, 0, 500);
  assert.equal(leftHit.offset, -1);
  assert.ok(leftHit.vx < -300); // deflected to left
  assert.ok(leftHit.vy < -180); // upward
  assert.ok(Math.abs(leftHit.vy) >= 180);
});

test('continuous swept sphere detects thin typography without tunneling', () => {
  // A thin text line collider of height 14px at y=500
  const boxX = 300, boxY = 500, boxW = 200, boxH = 14;
  const radius = 10;

  // Fast ball moving downwards from y=450 to y=550 in a single step (100px leap)
  const startX = 400, startY = 450;
  const dx = 0, dy = 100;

  const hit = intersectSweptSphereAABB(startX, startY, dx, dy, boxX, boxY, boxW, boxH, radius);
  assert.equal(hit.hit, true);
  assert.ok(hit.t > 0 && hit.t < 1);
  assert.equal(hit.normalY, -1); // top face struck
  assert.equal(hit.normalX, 0);

  // Ball at collision moment should touch top of expanded box (500 - 10 = 490)
  const contactY = startY + dy * hit.t;
  assert.ok(Math.abs(contactY - 490) < 0.1);
});

test('wall and collider reflections prevent pure horizontal trap loops', () => {
  // Reflect off horizontal surface
  const topReflect = reflectVelocity(300, -400, 0, 1, { minVy: 180 });
  assert.equal(topReflect.vx, 300);
  assert.ok(topReflect.vy >= 180); // redirected down

  // Reflect off vertical surface
  const sideReflect = reflectVelocity(-300, 250, 1, 0, { minVy: 180 });
  assert.equal(sideReflect.vx, 300);
  assert.equal(sideReflect.vy, 250);

  // Near zero vertical velocity is forced above minVy while keeping speed bounded
  const flatReflect = reflectVelocity(400, -10, 0, 1, { minVy: 180 });
  assert.ok(Math.abs(flatReflect.vy) >= 180);
  assert.ok(Math.hypot(flatReflect.vx, flatReflect.vy) <= 820);
});

test('corner impact normalizes normal and never triples ball speed', () => {
  // Exact counterexample 1 from review: (80,80) + (20,20) into box [100,100,40,40] with radius 10
  const h = intersectSweptSphereAABB(80, 80, 20, 20, 100, 100, 40, 40, 10);
  assert.equal(h.hit, true);
  assert.ok(Math.abs(h.t - 0.5) < 1e-6);
  const normalLen = Math.hypot(h.normalX, h.normalY);
  assert.ok(Math.abs(normalLen - 1) < 1e-6, `Expected unit normal, got length ${normalLen}`);

  // Direct call with unnormalized (-1, -1) must also normalize and preserve incoming speed
  const incomingSpeed = Math.hypot(400, 400);
  const reflected = reflectVelocity(400, 400, -1, -1);
  const outgoingSpeed = Math.hypot(reflected.vx, reflected.vy);
  assert.ok(Math.abs(outgoingSpeed - incomingSpeed) < 1e-4, `Expected speed ${incomingSpeed}, got ${outgoingSpeed}`);
  assert.ok(reflected.vx < 0 && reflected.vy < 0);
});

test('wall collision uses segment fraction [0,1] dx/dy and lands at exact post-bounce coordinate', () => {
  // Exact counterexample 2 from review:
  // ball at x=989 moving right vx=600 (dx=5 in 1/120s), right wall at 1000-10=990 (t=0.2)
  // Contact at x=990, push -0.5 -> 989.5, remaining 0.8 step at vx=-600 (dx=-4) -> 985.5
  const res = stepBallSubstep({
    ball: { x: 989, y: 500, vx: 600, vy: -200, radius: 10 },
    colliders: [],
    bounds: { width: 1000, height: 2000 },
    dt: 1 / 120,
  });
  assert.equal(res.hitWall, true);
  assert.ok(Math.abs(res.ball.x - 985.5) < 1e-4, `Expected x=985.5, got ${res.ball.x}`);
  assert.equal(res.ball.vx, -600);
});

test('overlapping/penetrating ball resolves cleanly out of collider without repeated t=0 flips or duplicate hits', () => {
  const col = { id: 'thin-1', x: 300, y: 500, width: 200, height: 18, hp: 3, broken: false };
  // Ball already 3px inside the top expanded boundary (minY = 500 - 10 = 490, ball.y = 493)
  const res = stepBallSubstep({
    ball: { x: 400, y: 493, vx: 120, vy: 420, radius: 10 },
    colliders: [col],
    bounds: { width: 1000, height: 2000 },
    dt: 1 / 120,
  });
  assert.ok(res.hitCollider);
  assert.equal(res.hitCollider.collider, col);
  // Velocity must reflect upward once (vy < 0), not flip multiple times back to positive
  assert.ok(res.ball.vy < 0, `Expected upward rebound vy < 0, got ${res.ball.vy}`);
  // Ball must be ejected outside top expanded boundary (y < 490)
  assert.ok(res.ball.y < 490, `Expected ball ejected above 490, got ${res.ball.y}`);
  // Only 1 collider hit recorded in the substep
  assert.equal(res.hitCount, 1);
});

test('time invariance: fixed accumulator produces identical state at 60Hz, 144Hz, irregular frames, and clamps hidden-tab gaps', () => {
  const makeWorld = () => ({
    ball: { x: 400, y: 620, vx: 240, vy: -520, radius: 10 },
    colliders: [
      { id: 1, x: 280, y: 380, width: 240, height: 48, hp: 5, broken: false },
      { id: 2, x: 560, y: 260, width: 180, height: 36, hp: 5, broken: false },
    ],
    bounds: { width: 1000, height: 2000 },
    accumulator: 0,
  });

  // 1.0 second = 60 frames at 60Hz = 144 frames at 144Hz = 120 substeps of FIXED_DT (1/120)
  const w60 = makeWorld();
  for (let i = 0; i < 60; i++) {
    stepPhysicsWithAccumulator(w60, 1 / 60);
  }

  const w144 = makeWorld();
  for (let i = 0; i < 144; i++) {
    stepPhysicsWithAccumulator(w144, 1 / 144);
  }

  // Irregular frame sequence summing to exactly 120/120 = 1.0s (measured in 1/120s ticks: 2+1+3+1+2+3 = 12 ticks = 0.1s, repeated 10x)
  const wIrregular = makeWorld();
  const irregularTicks = [2, 1, 3, 1, 2, 3];
  for (let rep = 0; rep < 10; rep++) {
    for (const ticks of irregularTicks) {
      stepPhysicsWithAccumulator(wIrregular, ticks * FIXED_DT);
    }
  }

  assert.ok(Math.abs(w60.ball.x - w144.ball.x) < 1e-6, `60Hz vs 144Hz x mismatch: ${w60.ball.x} vs ${w144.ball.x}`);
  assert.ok(Math.abs(w60.ball.y - w144.ball.y) < 1e-6, `60Hz vs 144Hz y mismatch: ${w60.ball.y} vs ${w144.ball.y}`);
  assert.ok(Math.abs(w60.ball.x - wIrregular.ball.x) < 1e-6, `60Hz vs irregular x mismatch: ${w60.ball.x} vs ${wIrregular.ball.x}`);
  assert.ok(Math.abs(w60.ball.y - wIrregular.ball.y) < 1e-6, `60Hz vs irregular y mismatch: ${w60.ball.y} vs ${wIrregular.ball.y}`);

  // Hidden-tab gap clamp: a 3-second freeze must clamp to MAX_ACCUMULATOR (0.05s = 6 steps), not 360 steps
  const wGap = makeWorld();
  const gapRes = stepPhysicsWithAccumulator(wGap, 3.0);
  assert.ok(gapRes.stepsRun <= Math.floor(MAX_ACCUMULATOR / FIXED_DT) + 1);
  assert.ok(wGap.accumulator < FIXED_DT);
});

test('camera calculation smoothly advances upward with ball and does not chase descending ball endlessly', () => {
  const viewHeight = 1000;
  const docHeight = 2500;
  let cameraY = 1500; // started near bottom

  // Ball moves up towards y=800 (vy < 0)
  for (let i = 0; i < 60; i++) {
    cameraY = updateCameraY({
      currentCameraY: cameraY,
      ballY: 800,
      ballVy: -500,
      viewHeight,
      docHeight,
      dt: 1 / 60,
      maxCameraSpeed: 600,
    });
  }
  // Camera should have smoothly panned up toward upper page
  assert.ok(cameraY < 1500);
  assert.ok(cameraY >= 0);

  // Ball now descending fast (vy > 0) towards bottom (y=1800)
  const cameraBeforeDescend = cameraY;
  for (let i = 0; i < 30; i++) {
    cameraY = updateCameraY({
      currentCameraY: cameraY,
      ballY: 1800,
      ballVy: 500,
      viewHeight,
      docHeight,
      dt: 1 / 60,
      maxCameraSpeed: 600,
    });
  }
  // Camera does NOT jump straight to bottom to artificially protect the paddle
  // The rate of downward movement is strictly bounded
  assert.ok(cameraY <= cameraBeforeDescend + 100);
});

test('transformParticipatingHref adds ?paper=0617 to Home/Blog/Store and leaves external links untouched', () => {
  // Formal blog links get paper query
  const blogLink = transformParticipatingHref('https://blog.sayori.org/');
  assert.ok(blogLink.includes('paper=0617'));
  assert.ok(blogLink.includes('blog.sayori.org'));

  const blogPost = transformParticipatingHref('https://blog.sayori.org/guestbook/');
  assert.ok(blogPost.includes('paper=0617'));
  assert.ok(blogPost.includes('/guestbook/'));

  // Relative links get paper query
  const relAbout = transformParticipatingHref('/about/');
  assert.ok(relAbout.includes('paper=0617'));
  assert.ok(relAbout.includes('/about/'));

  // External links remain untouched
  const itch = 'https://amiya-desi.itch.io/';
  assert.equal(transformParticipatingHref(itch), itch);

  const gh = 'https://github.com/Amiyadesi';
  assert.equal(transformParticipatingHref(gh), gh);

  const bili = 'https://space.bilibili.com/393273180';
  assert.equal(transformParticipatingHref(bili), bili);

  const studio = 'https://studio.sayori.org/';
  assert.equal(transformParticipatingHref(studio), studio);

  const nav = 'https://nav.sayori.org/';
  assert.equal(transformParticipatingHref(nav), nav);

  // In-page hash or protocols remain untouched
  assert.equal(transformParticipatingHref('#services-note'), '#services-note');
  assert.equal(transformParticipatingHref('mailto:contact@sayori.org'), 'mailto:contact@sayori.org');
});

test('transformParticipatingHref preserves canonical and current-origin domains without hardcoded preview ports', () => {
  const localLocation = {
    origin: 'http://127.0.0.1:8970',
    hostname: '127.0.0.1',
    port: '8970',
    protocol: 'http:',
    href: 'http://127.0.0.1:8970/',
  };

  // Canonical blog domain stays canonical with paper=0617 (preview server handles any local domain rewrites)
  const blogUrl = transformParticipatingHref('https://blog.sayori.org/', localLocation);
  assert.equal(blogUrl, 'https://blog.sayori.org/?paper=0617');

  const blogPost = transformParticipatingHref('https://blog.sayori.org/guestbook/', localLocation);
  assert.equal(blogPost, 'https://blog.sayori.org/guestbook/?paper=0617');

  // Same-origin relative path stays on current origin with paper=0617
  const homeAbout = transformParticipatingHref('/about/', localLocation);
  assert.equal(homeAbout, 'http://127.0.0.1:8970/about/?paper=0617');

  // External links remain completely untouched
  const ext = 'https://github.com/Amiyadesi';
  assert.equal(transformParticipatingHref(ext, localLocation), ext);
});

test('normal path stays inert when paper=0617 is absent', () => {
  // Without location.search having paper=0617, mountLuminousHome returns early no-op
  const cleanup = mountLuminousHome();
  assert.equal(typeof cleanup, 'function');
  assert.equal(cleanup(), undefined);
});

test('resuming hides the flex pause overlay', () => {
  const css = fs.readFileSync(path.join(repoRoot, 'public/p34-luminous.css'), 'utf8');
  assert.match(css, /\.p34-pause-modal\[hidden\]\s*\{\s*display:\s*none\s*!important;/);
});

test('source invariants: unnamed girl identity, open spatial composition, no drawer or return button, and synced cache tags', () => {
  const luminousSrc = fs.readFileSync(path.join(repoRoot, 'public/p34-luminous.js'), 'utf8');
  const luminousCss = fs.readFileSync(path.join(repoRoot, 'public/p34-luminous.css'), 'utf8');
  const breakoutSrc = fs.readFileSync(path.join(repoRoot, 'public/p34-breakout.js'), 'utf8');

  // Never call the unnamed girl Amiya in luminous/breakout UI copy
  assert.ok(!/Amiya/i.test(luminousSrc), 'public/p34-luminous.js must not refer to Amiya');
  assert.ok(!/Amiya/i.test(breakoutSrc), 'public/p34-breakout.js must not refer to Amiya');

  // No hardcoded local preview port rewrites in production JS
  assert.ok(!luminousSrc.includes('8970') && !luminousSrc.includes('8971'), 'public/p34-luminous.js must not hardcode preview ports 8970/8971');

  // Preserve original child nodes: never overwrite collider element innerHTML
  assert.ok(!breakoutSrc.includes('c.element.innerHTML') && !breakoutSrc.includes('backupHTML'), 'public/p34-breakout.js must not overwrite collider innerHTML');
  assert.ok(breakoutSrc.includes('p34-fracture-shard'), 'public/p34-breakout.js must create contact-local fracture shards');
  assert.ok(breakoutSrc.includes('p34-rescue-note'), 'public/p34-breakout.js must implement pre-loss physical rescue note');

  // Author rejection invariants:
  // 1. No '原站入口与工具' drawer, no borrowed-six-nav mounting, no explicit '返回原主页' button, no card grid or filter/scrap cards
  for (const bannedToken of [
    '原站入口与工具',
    '返回原主页',
    'p34-orig-drawer',
    'p34-nav-constellation',
    'p34-services-host',
    'borrowNode',
    'toggleOrigDrawer',
    'p34-return-link',
    'data-p34-action="send-back"',
    'p34-note-card',
    'p34-filter-piece',
    'p34-loose-draft',
    'p34-loose-archives',
    'leadCopy',
    'leadGuestbookLink',
    'playDesc',
    'expDesc',
    'tintDesc',
    'controlsHint',
    'drawerSub',
    'returnLabel',
    'returnBtn',
    'topReturn',
  ]) {
    assert.ok(!luminousSrc.includes(bannedToken), `public/p34-luminous.js must not include obsolete drawer/card/return token ${bannedToken}`);
    assert.ok(!luminousCss.includes(bannedToken), `public/p34-luminous.css must not include obsolete drawer/card/return token ${bannedToken}`);
  }

  // 2. Hidden chat reply 'return-normal' remains one-click return
  assert.ok(luminousSrc.includes("replyId === 'return-normal'"), 'chat reply return-normal must remain wired to sendBack()');
  assert.match(luminousSrc, /id="p34-home-answers"[^>]+hidden/, 'chat choices stay hidden until engaged');
  assert.match(luminousSrc, /setPointerCapture/, 'page-edge dragging must keep pointer capture');

  assert.ok(!luminousSrc.includes('/guestbook/?paper=0617'), 'primary own world must not link to /guestbook/?paper=0617');
  assert.equal((luminousSrc.match(/href="https:\/\/blog\.sayori\.org\//g)||[]).length, 1, 'only one cross-site Blog entry');
  assert.ok(!luminousSrc.includes('去随笔页读全文'), 'must not make false full-text promise to Blog index');

  // Subpage callers and generator template must carry updated ?v=20261104-fold cache tag
  const callerFiles = [
    'public/about/index.html',
    'public/en/about/index.html',
    'public/zh-hant/about/index.html',
    'public/services/index.html',
    'public/en/services/index.html',
    'public/zh-hant/services/index.html',
    'public/social/index.html',
    'public/en/social/index.html',
    'public/zh-hant/social/index.html',
    'public/tools/index.html',
    'scripts/social-page.html',
  ];
  for (const rel of callerFiles) {
    const html = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
    assert.ok(html.includes('?v=20261104-fold'), `${rel} missing updated ?v=20261104-fold cache tag`);
    assert.ok(!html.includes('20260417b') && !html.includes('20260418a'), `${rel} still contains stale cache tag`);
  }
});
