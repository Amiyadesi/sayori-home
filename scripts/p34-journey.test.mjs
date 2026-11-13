import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  newJourney,
  journeyEvent,
  readJourney,
  cookieJourney,
  isBridgeArch,
  pillarsAligned,
  identityClueCount,
  TARGET_PILLARS,
} from '../public/p34-journey.js';
import { reboundSketch, layerFromURL } from '../public/p34-adventure.js';

test('initial journey starts in atrium layer and requires spatial progression to enter deeper layers', () => {
  const s = newJourney();
  assert.equal(s.phase, 'arrive');
  assert.equal(s.currentLayer, 'atrium');
  assert.deepEqual(s.layers, ['atrium']);
  assert.throws(() => journeyEvent(s, 'visit'), /Unknown/);
  assert.throws(() => journeyEvent(s, 'enter-layer', 'stacks'), /阶梯|光桥/);
  assert.throws(() => journeyEvent(s, 'enter-layer', 'loft'), /基准柱/);
});

test('west sightline alignment or 2D light arch bridge unlocks the second layer (stacks)', () => {
  let s = newJourney();
  s = journeyEvent(s, 'loop-walked');
  assert.equal(s.loopCount, 1);
  assert.equal(s.phase, 'shared');

  const viaSightline = journeyEvent(s, 'align-west');
  assert.equal(viaSightline.westAligned, true);
  const inStacks = journeyEvent(viaSightline, 'enter-layer', 'stacks');
  assert.equal(inStacks.currentLayer, 'stacks');
  assert.deepEqual(inStacks.layers, ['atrium', 'stacks']);
  assert.equal(inStacks.phase, 'stacks');

  // Also test unlocking via 2D Light Lab arch or save
  const archedNodes = [[0.1, 0.7], [0.35, 0.25], [0.65, 0.28], [0.9, 0.72]];
  assert.equal(isBridgeArch(archedNodes), true);
  const viaLight = journeyEvent(newJourney(), 'light-saved', archedNodes);
  assert.equal(viaLight.bridgeSolid, true);
  assert.equal(journeyEvent(viaLight, 'enter-layer', 'stacks').currentLayer, 'stacks');
});

test('2D blog blueprint and 3D spatial pillars unlock the third layer (her loft)', () => {
  let s = journeyEvent(journeyEvent(newJourney(), 'align-west'), 'enter-layer', 'stacks');
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

  // Syncing pillars from projector or rotating them manually unlocks Loft
  const synced = journeyEvent(s, 'sync-pillars');
  assert.equal(synced.stacksUnlocked, true);
  assert.ok(pillarsAligned(synced.pillars));

  let manual = s;
  manual = journeyEvent(manual, 'rotate-pillar', { pillar: 'west', value: TARGET_PILLARS.west });
  manual = journeyEvent(manual, 'rotate-pillar', { pillar: 'center', value: TARGET_PILLARS.center });
  assert.equal(manual.stacksUnlocked, false);
  manual = journeyEvent(manual, 'rotate-pillar', { pillar: 'east', value: TARGET_PILLARS.east });
  assert.equal(manual.stacksUnlocked, true);

  const inLoft = journeyEvent(manual, 'enter-layer', 'loft');
  assert.equal(inLoft.currentLayer, 'loft');
  assert.deepEqual(inLoft.layers, ['atrium', 'stacks', 'loft']);
  assert.equal(inLoft.phase, 'loft');
});

test('discovering identity clues in her loft unlocks the first-chapter completion without fixing a morality score', () => {
  let s = journeyEvent(journeyEvent(newJourney(), 'align-west'), 'enter-layer', 'stacks');
  s = journeyEvent(journeyEvent(s, 'opened', 'long-way'), 'diagram');
  s = journeyEvent(journeyEvent(s, 'sync-pillars'), 'enter-layer', 'loft');

  assert.throws(() => journeyEvent(s, 'complete-loft'), /线索/);
  s = journeyEvent(s, 'clue', 'slot-34-log');
  assert.equal(identityClueCount(s), 1);
  assert.throws(() => journeyEvent(s, 'complete-loft'), /线索/);

  s = journeyEvent(s, 'clue', 'dual-handwriting');
  s = journeyEvent(s, 'clue', 'rain-origin-trace');
  assert.equal(identityClueCount(s), 3);
  s = journeyEvent(s, 'complete-loft');
  assert.equal(s.phase, 'after');
  assert.ok(!('trust' in s) && !('pressure' in s));
});

test('complete 3D exploration state fits cookie budget and preserves legacy v1/v2 saves', () => {
  let s = journeyEvent(journeyEvent(newJourney(), 'align-west'), 'enter-layer', 'stacks');
  s = journeyEvent(journeyEvent(s, 'opened', 'long-way'), 'diagram');
  s = journeyEvent(journeyEvent(s, 'sync-pillars'), 'enter-layer', 'loft');
  for (const c of ['atrium-survey', 'retired-relic', 'slot-34-log', 'dual-handwriting', 'rain-origin-trace']) {
    s = journeyEvent(s, 'clue', c);
  }
  s = journeyEvent(s, 'light-saved', [[0.1, 0.2], [0.3, 0.3], [0.6, 0.3], [0.85, 0.7]]);
  s = journeyEvent(s, 'complete-loft');
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
});

test('corrupt, oversized and invalid saves fail at the boundary', () => {
  const s = newJourney();
  for (const raw of [
    '{',
    JSON.stringify({ ...s, v: 9 }),
    JSON.stringify({ ...s, layers: ['mars'] }),
    JSON.stringify({ ...s, currentLayer: 'loft' }), // loft not in layers
    JSON.stringify({ ...s, clues: ['fake-clue'] }),
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
