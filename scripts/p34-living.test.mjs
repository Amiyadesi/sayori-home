import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  WORLD_COOKIE_KEY,
  GIRL_TEST_COPY,
  segmentGraphemes,
  decodeCipherFrame,
  buildScatterVector,
  createDefaultWorldState,
  parseWorldState,
  serializeWorldState,
  mergeWorldStates,
  readWorldCookie,
  advanceEncounterState,
  applyPuzzleAction,
  stepSpring,
  resolveCookieDomain,
  mountLivingWorld,
} from '../public/p34-living.js';
import { paperCommand } from '../public/paper-world.js';

test('normal route guard executes no DOM, storage, or audio side effects', () => {
  globalThis.location = { search: '' };
  try {
    const cleanup = mountLivingWorld();
    assert.equal(typeof cleanup, 'function');
    cleanup();
  } finally {
    delete globalThis.location;
  }
});

test('boundary validation rejects malformed tokens and enforces monotonic puzzle invariants', () => {
  assert.equal(WORLD_COOKIE_KEY, 'p34_world_v1');
  for (const invalid of [null, undefined, '', 'v2.home.1.0.1.0.0.0.0.warm', 'v1.evil.1.0.1.0.0.0.0.warm', 'x'.repeat(80)]) {
    const res = parseWorldState(invalid);
    assert.equal(res.valid, false);
    assert.deepEqual(res.state, createDefaultWorldState());
  }

  // Deep content dc=1 implies ba=1, hk=1, st=5 even if raw token had lower values
  const implied = parseWorldState('v1.home.1.1.1.0.0.1.4.playful');
  assert.equal(implied.valid, true);
  assert.equal(implied.state.hk, 1);
  assert.equal(implied.state.ba, 1);
  assert.equal(implied.state.dc, 1);
  assert.equal(implied.state.st, 5);
  assert.equal(serializeWorldState(implied.state), 'v1.home.1.1.5.1.1.1.4.playful.0');
});

test('dual-entry encounter state distinguishes home-first vs blog-first and cross-site arrival', () => {
  const startHome = advanceEncounterState(createDefaultWorldState(), 'home');
  assert.equal(startHome.encounterType, 'home-first');
  assert.equal(startHome.state.first, 'home');
  assert.equal(startHome.state.hm, 1);
  assert.equal(startHome.state.bm, 0);

  const crossToBlog = advanceEncounterState(startHome.state, 'blog');
  assert.equal(crossToBlog.encounterType, 'blog-from-home');
  assert.equal(crossToBlog.state.first, 'home');
  assert.equal(crossToBlog.state.bm, 1);
  assert.equal(crossToBlog.state.st, 2);

  const startBlog = advanceEncounterState(createDefaultWorldState(), 'blog');
  assert.equal(startBlog.encounterType, 'blog-first');
  assert.equal(startBlog.state.first, 'blog');
  assert.equal(startBlog.state.bm, 1);

  const crossToHome = advanceEncounterState(startBlog.state, 'home');
  assert.equal(crossToHome.encounterType, 'home-from-blog');
  assert.equal(crossToHome.state.hm, 1);
});

test('legacy puzzle state keeps saved meanings and dependencies after its UI is retired', () => {
  let state = advanceEncounterState(createDefaultWorldState(), 'blog').state;

  // Trying Blog's second door before finding Home's sticky-note rubbing fails
  const lockedAttempt = applyPuzzleAction(state, 'try-blog-door');
  assert.equal(lockedAttempt.ok, false);
  assert.equal(lockedAttempt.reason, 'locked-from-back');
  assert.equal(lockedAttempt.state.ba, 0);

  // Trying Home's desk chime before getting Blog's music strip fails
  const prematureChime = applyPuzzleAction(lockedAttempt.state, 'play-desk-chime');
  assert.equal(prematureChime.ok, false);
  assert.equal(prematureChime.reason, 'missing-strip');
  assert.equal(prematureChime.state.dc, 0);

  // Step A: Find rubbing under Home sticky note
  const stepA = applyPuzzleAction(lockedAttempt.state, 'find-rubbing');
  assert.equal(stepA.ok, true);
  assert.equal(stepA.unlocked, 'rubbing');
  assert.equal(stepA.state.hk, 1);
  assert.equal(stepA.state.st, 3);

  // Step B: Open Blog second door using Home's rubbing -> produces music strip
  const stepB = applyPuzzleAction(stepA.state, 'try-blog-door');
  assert.equal(stepB.ok, true);
  assert.equal(stepB.unlocked, 'music-strip');
  assert.equal(stepB.state.ba, 1);
  assert.equal(stepB.state.st, 4);

  // Step C: Play desk chime on Home using Blog's music strip -> unfolds deep interleaf
  const stepC = applyPuzzleAction(stepB.state, 'play-desk-chime');
  assert.equal(stepC.ok, true);
  assert.equal(stepC.unlocked, 'interleaf');
  assert.equal(stepC.state.dc, 1);
  assert.equal(stepC.state.st, 5);

  // Cross-site merge preserves full progress
  const merged = mergeWorldStates(startStateWithHomeOnly(), stepC.state);
  assert.equal(merged.hk, 1);
  assert.equal(merged.ba, 1);
  assert.equal(merged.dc, 1);
});

function startStateWithHomeOnly() {
  return advanceEncounterState(createDefaultWorldState(), 'home').state;
}

test('damped spring physics converges to rest and cookie domain resolves parent domain', () => {
  let pos = 24;
  let vel = 0;
  let settled = false;
  for (let i = 0; i < 240 && !settled; i++) {
    const next = stepSpring(pos, vel, 0, 260, 18, 1 / 60);
    pos = next.pos;
    vel = next.vel;
    settled = next.settled;
  }
  assert.equal(settled, true);
  assert.equal(pos, 0);
  assert.equal(vel, 0);

  assert.equal(resolveCookieDomain('sayori.org'), '.sayori.org');
  assert.equal(resolveCookieDomain('blog.sayori.org'), '.sayori.org');
  assert.equal(resolveCookieDomain('localhost'), '');
});

test('retired terminal puzzle commands do not unlock anything; normal return remains', () => {
  assert.equal(paperCommand('rubbing').action, undefined);
  assert.equal(paperCommand('tune 034').action, undefined);
  assert.equal(paperCommand('home').action, 'normal');
});

test('cross-subdomain cookie single source of truth keeps shareable links free of p34s progress tokens', () => {
  const parsed = parseWorldState('v1.home.1.0.3.1.0.0.2.curious');
  assert.equal(parsed.valid, true);
  assert.equal(parsed.state.hk, 1);
  assert.equal(serializeWorldState(parsed.state), 'v1.home.1.0.3.1.0.0.2.curious.0');
});

test('user-rejected extra UI widgets (red-boxed dock, extra avatar, hint bar, piano badge) are completely absent', () => {
  const js = fs.readFileSync(new URL('../public/p34-living.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../public/p34-living.css', import.meta.url), 'utf8');
  assert.doesNotMatch(js + '\n' + css, /p34-girl-dock|p34-girl-figure|p34-under-sticky-mark|p34-piano-badge|p34-secret-interleaf|页边折签 · 034/);
  assert.doesNotMatch(js, /getDefaultActor|performAct|p34-action-layer/);
  // Piano click is not hijacked with stopImmediatePropagation
  assert.doesNotMatch(js, /stopImmediatePropagation/);
});

test('multi-tab regression: Tab A merges Tab B cookie progress before persisting and unlocks piano chime', () => {
  // Tab A starts on Home and uncovers sticky note rubbing (hk=1, bm=0, ba=0)
  let tabAState = advanceEncounterState(createDefaultWorldState(), 'home').state;
  tabAState = applyPuzzleAction(tabAState, 'find-rubbing').state;
  let sharedCookie = `${WORLD_COOKIE_KEY}=${encodeURIComponent(serializeWorldState(tabAState))}`;

  // Tab B opens Blog, reads cookie, and unlocks second door -> cookie becomes v1.home.1.1.4.1.1.0.x.playful
  let tabBState = advanceEncounterState(readWorldCookie(sharedCookie), 'blog').state;
  tabBState = applyPuzzleAction(tabBState, 'try-blog-door').state;
  sharedCookie = `${WORLD_COOKIE_KEY}=${encodeURIComponent(serializeWorldState(tabBState))}`;
  assert.equal(readWorldCookie(sharedCookie).bm, 1);
  assert.equal(readWorldCookie(sharedCookie).ba, 1);

  // User switches back to Tab A (without refreshing) and presses piano:
  // Tab A syncs from cookie first, merges with its local state, and plays desk chime
  tabAState = mergeWorldStates(tabAState, readWorldCookie(sharedCookie));
  assert.equal(tabAState.bm, 1);
  assert.equal(tabAState.ba, 1);
  const chimeRes = applyPuzzleAction(tabAState, 'play-desk-chime');
  assert.equal(chimeRes.ok, true);
  const finalSaved = mergeWorldStates(readWorldCookie(sharedCookie), chimeRes.state);
  assert.equal(finalSaved.bm, 1);
  assert.equal(finalSaved.ba, 1);
  assert.equal(finalSaved.dc, 1);
  assert.equal(finalSaved.st, 5);
});

test('grapheme assembly preserves complete characters and bounded cipher always settles', () => {
  const value = '你好，👩‍💻！é';
  const chars = segmentGraphemes(value);
  assert.equal(chars.join(''), value);
  assert.ok(chars.includes('👩‍💻'));
  assert.deepEqual(decodeCipherFrame(chars, 1), chars);
  assert.equal(decodeCipherFrame(chars, 0).length, chars.length);
  const vectors = Array.from({length: 12}, (_, i) => buildScatterVector(i));
  assert.ok(vectors.some(v=>v.dx>0) && vectors.some(v=>v.dx<0));
  assert.ok(vectors.some(v=>v.dy>0) && vectors.some(v=>v.dy<0));
  assert.ok(GIRL_TEST_COPY.meta.authorPending.length>0);
});

const entryBootstrap = fs.readFileSync(new URL('../public/i18n-bootstrap.js', import.meta.url), 'utf8');
test('world entry uses actual normal DOM, with no hidden early scene or dedicated return link', () => {
  const js=fs.readFileSync(new URL('../public/p34-living.js', import.meta.url),'utf8');
  assert.doesNotMatch(entryBootstrap, /visibility:hidden|p34-early-gate/);
  assert.match(entryBootstrap, /fromWorld \|\| reload/);
  assert.match(js, /startViewTransition/);
  assert.match(js, /送我回去吧/);
  assert.doesNotMatch(js, /p34-normal-link|normalLink|showDoor|data-paper-proof/);
  assert.doesNotMatch(JSON.stringify(GIRL_TEST_COPY), /0213|房间|门后/);
});

test('store joins the shared world and affinity survives old cookies', () => {
  // 旧 cookie（10 段）仍然有效，好感度按 0 读
  const legacy = parseWorldState('v1.home.1.0.2.0.0.0.3.warm');
  assert.equal(legacy.valid, true);
  assert.equal(legacy.state.aff, 0);

  // 新 cookie（11 段）带好感度
  const fresh = parseWorldState('v1.store.1.0.3.1.0.0.5.curious.42');
  assert.equal(fresh.valid, true);
  assert.equal(fresh.state.first, 'store');
  assert.equal(fresh.state.aff, 42);
  assert.equal(serializeWorldState(fresh.state), 'v1.store.1.0.3.1.0.0.5.curious.42');

  // 好感度夹在 0–100
  assert.equal(parseWorldState('v1.home.1.0.3.1.0.0.2.warm.999').state.aff, 100);
  assert.equal(parseWorldState('v1.home.1.0.3.1.0.0.2.warm.0').state.aff, 0);

  // 进入 store 会记一次到访并加好感
  const visit = advanceEncounterState(createDefaultWorldState(), 'store');
  assert.equal(visit.state.first, 'store');
  assert.equal(visit.state.aff, 3);
});
