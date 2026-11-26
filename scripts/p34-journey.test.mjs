import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  newJourney,
  journeyEvent,
  readJourney,
  cookieJourney,
  pillarsAligned,
  identityClueCount,
  TARGET_PILLARS,
  canEnterLayer, isSilenced, startingSculpture, TRACES, RESPONSES, LAYERS, CLUES,
} from '../public/p34-journey.js';
import { reboundSketch, layerFromURL } from '../public/p34-adventure.js';

test('initial journey starts in atrium layer and requires spatial progression to enter deeper layers', () => {
  const s = newJourney();
  assert.equal(s.phase, 'arrive');
  assert.equal(s.currentLayer, 'atrium');
  assert.deepEqual(s.layers, ['atrium']);
  assert.throws(() => journeyEvent(s, 'visit'), /Unknown/);
  assert.throws(() => journeyEvent(s, 'enter-layer', 'poolrooms'), /桥/);
  assert.throws(() => journeyEvent(s, 'enter-layer', 'drafts'), /基准柱/);
  assert.throws(() => journeyEvent(s, 'enter-layer', 'loft'), /回声/);
});

test('the existing stacks entrance remains accessible without a bridge or the retired frame gate', () => {
  const inStacks = journeyEvent(newJourney(), 'enter-layer', 'stacks');
  assert.equal(inStacks.currentLayer, 'stacks');
  assert.deepEqual(inStacks.layers, ['atrium', 'stacks']);
  assert.equal(inStacks.phase, 'stacks');
  assert.equal(inStacks.westAligned, false);
  const old = { ...inStacks, westAligned: true, loopCount: 3 };
  assert.deepEqual(readJourney(JSON.stringify(old)).state, old);
});

test('the 2D blog blueprint or manual 3D pillar alignment now opens the drafts viaduct', () => {
  let s = journeyEvent(newJourney(), 'enter-layer', 'stacks');
  assert.equal(s.stacksUnlocked, false);

  // Blueprint slider on blog
  assert.equal(reboundSketch(0).exit, false);
  assert.equal(reboundSketch(0.5).exit, false);
  const aligned = reboundSketch(0.85);
  assert.equal(aligned.exit, true);
  assert.match(aligned.path, /^M240 450 L/);

  // Must open long-way before recording diagram
  assert.throws(() => journeyEvent(s, 'diagram'), /source note/i);
  s = journeyEvent(s, 'opened', 'long-way');
  s = journeyEvent(s, 'diagram');
  assert.equal(s.diagram, true);

  // Both solutions open the same viaduct.
  const synced = journeyEvent(s, 'sync-pillars');
  assert.equal(synced.stacksUnlocked, true);
  assert.ok(pillarsAligned(synced.pillars));

  let manual = s;
  manual = journeyEvent(manual, 'rotate-pillar', { pillar: 'west', value: TARGET_PILLARS.west });
  manual = journeyEvent(manual, 'rotate-pillar', { pillar: 'center', value: TARGET_PILLARS.center });
  assert.equal(manual.stacksUnlocked, false);
  manual = journeyEvent(manual, 'rotate-pillar', { pillar: 'east', value: TARGET_PILLARS.east });
  assert.equal(manual.stacksUnlocked, true);

  const inDrafts = journeyEvent(manual, 'enter-layer', 'drafts');
  assert.equal(inDrafts.currentLayer, 'drafts');
  assert.deepEqual(inDrafts.layers, ['atrium', 'stacks', 'drafts']);
  assert.equal(inDrafts.phase, 'drafts');
  assert.equal(canEnterLayer(inDrafts, 'loft'), false);
});

test('a bridge needs both middle points raised and a saved sketch, not just a save click', () => {
  const low = [[0.1, 0.7], [0.35, 0.65], [0.65, 0.68], [0.9, 0.7]];
  const half = [[0.1, 0.7], [0.35, 0.25], [0.65, 0.68], [0.9, 0.7]];
  const arch = [[0.1, 0.7], [0.35, 0.25], [0.65, 0.28], [0.9, 0.7]];
  assert.equal(journeyEvent(newJourney(), 'light-saved', low).bridgeSolid, false);
  assert.equal(journeyEvent(newJourney(), 'light-saved', half).bridgeSolid, false);
  assert.equal(journeyEvent(newJourney(), 'light-moved', arch).bridgeSolid, false);
  assert.equal(journeyEvent(newJourney(), 'light-saved', arch).bridgeSolid, true);
});

function journeyToDrafts() {
  let s = journeyEvent(newJourney(), 'hello');
  s = journeyEvent(s, 'light-saved', [[.1,.7],[.35,.25],[.65,.28],[.9,.7]]);
  s = journeyEvent(s, 'enter-layer', 'poolrooms');
  s = journeyEvent(s, 'clue', 'pool-study');
  s = journeyEvent(s, 'enter-layer', 'stacks');
  s = journeyEvent(journeyEvent(s, 'opened', 'long-way'), 'diagram');
  return journeyEvent(journeyEvent(s, 'sync-pillars'), 'enter-layer', 'drafts');
}

test('all three answers lead to recovery through the same three places, never a score or a toy', () => {
  for (const choice of RESPONSES) {
    let s = journeyEvent(journeyToDrafts(), 'disagreement', choice);
    assert.equal(s.phase, 'closed'); assert.equal(s.response, choice);
    assert.deepEqual(readJourney(JSON.stringify(s)).state, s);
    assert.ok(!('trust' in s) && !('pressure' in s));
    assert.throws(() => journeyEvent(s, 'garden-chime', 1), /回声/);
    assert.throws(() => journeyEvent(s, 'memory-trace', 'atrium'), /不在这里/);
    for (const id of ['drafts','atrium','poolrooms']) {
      assert.ok(!canEnterLayer(s, 'loft'));
      s = journeyEvent(s, 'enter-layer', id);
      s = journeyEvent(s, 'memory-trace', id);
      assert.deepEqual(journeyEvent(s, 'memory-trace', id), s);
    }
    assert.ok(canEnterLayer(s, 'loft'));
    s = journeyEvent(s, 'enter-layer', 'loft');
    assert.equal(s.phase, 'closed');
    s = journeyEvent(s, 'reunion');
    assert.equal(s.phase, 'loft'); assert.ok(isSilenced(s, 'library'));
    assert.equal(startingSculpture(s).span, choice === 'critique' ? 2 : 1);
    assert.throws(() => journeyEvent(s, 'complete-loft', { height: 5, span: 1, tone: 1 }), /拱/);
    s = journeyEvent(s, 'complete-loft', {height: 2, span: 1, tone: 2});
    assert.equal(s.phase, 'after');
    assert.ok(LAYERS.every(id => canEnterLayer(s, id) && !isSilenced(s, id)));
    assert.deepEqual(readJourney(JSON.stringify(s)).state.sculpture, {height: 2, span: 1, tone: 2});
  }
});

test('complete 3D exploration state fits cookie budget and preserves legacy v1/v2 saves', () => {
  let s = journeyEvent(journeyToDrafts(), 'disagreement', 'critique');
  for (const id of TRACES) s = journeyEvent(journeyEvent(s, 'enter-layer', id), 'memory-trace', id);
  s = journeyEvent(journeyEvent(s, 'enter-layer', 'loft'), 'reunion');
  for (const c of CLUES) {
    s = journeyEvent(s, 'clue', c);
  }
  s = journeyEvent(s, 'light-saved', [[0.1, 0.2], [0.3, 0.3], [0.6, 0.3], [0.85, 0.7]]);
  s = journeyEvent(s, 'complete-loft', {height: 2, span: 1, tone: 0});
  assert.equal(identityClueCount(s), 3);
  s = journeyEvent(s, 'letter');

  const raw = JSON.stringify(s);
  assert.ok(encodeURIComponent(raw).length <= 3800, `Cookie length: ${encodeURIComponent(raw).length}`);
  assert.equal(readJourney(raw).error, '');
  assert.deepEqual(readJourney(raw).state, s);
  assert.deepEqual(cookieJourney(`other=1; p34_journey_v2=${encodeURIComponent(raw)}`).state, s);

  // Legacy v1 migration
  const oldV1 = { v: 1, phase: 'after', light: 2, lightSketch: [[0.1, 0.2], [0.3, 0.6], [0.5, 0.2], [0.8, 0.7]], leftLetter: true, touched: true };
  const mig1 = cookieJourney(`p34_journey_v1=${encodeURIComponent(JSON.stringify(oldV1))}`);
  assert.equal(mig1.error, '');
  assert.equal(mig1.migrated, true);
  assert.equal(mig1.state.bridgeSolid, true);
  assert.equal(mig1.state.leftLetter, true);

  // Legacy v2 breakout save compatibility
  const legacyBreakoutV2 = {
    v: 2, phase: 'tuned', touched: true, light: 2, lightSketch: [[0.1, 0.2], [0.3, 0.3], [0.6, 0.3], [0.8, 0.7]],
    opened: ['long-way'], diagram: true, leftLetter: false,
  };
  const mig2 = readJourney(JSON.stringify(legacyBreakoutV2));
  assert.equal(mig2.error, '');
  assert.equal(mig2.state.diagram, true);
  assert.equal(mig2.state.bridgeSolid, true);

  // Old three-layer saves that aligned all pillars did earn the original loft route.
  const oldWorld = { ...legacyBreakoutV2, phase: 'stacks', layers: ['atrium','stacks'], currentLayer: 'stacks', stacksUnlocked: true };
  const old = readJourney(JSON.stringify(oldWorld)).state;
  assert.ok(canEnterLayer(old, 'loft'));
  let loft = journeyEvent(old, 'enter-layer', 'loft');
  assert.throws(() => journeyEvent(loft, 'finish-legacy-loft'), /线索/);
  for (const id of ['slot-34-log', 'dual-handwriting']) loft = journeyEvent(loft, 'clue', id);
  assert.equal(journeyEvent(loft, 'finish-legacy-loft').phase, 'after');
  assert.equal(readJourney(JSON.stringify({ ...oldWorld, phase: 'closed' })).state.phase, 'stacks', 'old closed belonged to a different storyline');
});

test('corrupt, oversized and invalid saves fail at the boundary', () => {
  const s = newJourney();
  for (const raw of [
    '{',
    JSON.stringify({ ...s, v: 9 }),
    JSON.stringify({ ...s, layers: ['mars'] }),
    JSON.stringify({ ...s, currentLayer: 'loft' }), // loft not in layers
    JSON.stringify({ ...s, clues: ['fake-clue'] }),
    JSON.stringify({ ...s, traces: ['atrium', 'atrium'] }),
    JSON.stringify({ ...s, phase: 'closed', response: 'punished' }),
    JSON.stringify({ ...s, sculpture: {height: 1, span: 1, tone: -1} }),
    JSON.stringify({ ...s, extra: '长'.repeat(2800) }),
  ]) {
    assert.ok(readJourney(raw).error, `Expected error for: ${raw.slice(0, 60)}`);
  }
  assert.ok(cookieJourney('p34_journey_v2=%zz').error);
  assert.equal(layerFromURL('https://sayori.org/?paper=0617&layer=stacks'), 'stacks');
  assert.equal(layerFromURL('https://sayori.org/?paper=0617&layer=invalid'), 'atrium');
});

test('active adventure code no longer imports removed breakout or rejected mini-games', () => {
  const source = fs.readFileSync(new URL('../public/p34-adventure.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /p34-breakout|p34-orbit|p34-story|纸燕|打砖块/);
});
