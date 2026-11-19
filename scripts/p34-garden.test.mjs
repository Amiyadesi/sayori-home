import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../public/third-party/three/three.module.min.js';
import { newJourney, journeyEvent, readJourney, cookieJourney, GARDEN_SKIES } from '../public/p34-journey.js';
import { getLayerConfig, resolvePlayerMovement } from '../public/p34-world3d.js';
import { POOL, inPool, skyFromHour, entrySpawn, stepUnseenProp, dailyNote } from '../public/p34-garden.js';
import { addResidents, stepWaterSkimmer } from '../public/p34-residents.js';
import { createWorldAudio } from '../public/p34-audio.js';

test('garden preferences round-trip, migrate old v2 saves and reject invalid boundary values', () => {
  const fresh = newJourney();
  for (const sky of GARDEN_SKIES) for (const chime of [0, 1, 2]) {
    const state = journeyEvent(journeyEvent(fresh, 'garden-sky', sky), 'garden-chime', chime);
    const raw = JSON.stringify(state);
    assert.deepEqual(readJourney(raw).state, state);
    assert.ok(encodeURIComponent(raw).length < 3800);
    assert.equal(state.phase, 'arrive');
    assert.deepEqual(state.layers, ['atrium']);
  }
  assert.deepEqual(fresh.garden, { sky: null, chime: null });
  const legacy = { ...fresh }; delete legacy.garden;
  assert.deepEqual(readJourney(JSON.stringify(legacy)).state.garden, fresh.garden);
  for (const garden of [{ sky: 'noon', chime: 0 }, { sky: 'morning', chime: 3 }, { sky: null, chime: '1' }, [], {}, false]) {
    assert.ok(readJourney(JSON.stringify({ ...fresh, garden })).error);
  }
  assert.throws(() => journeyEvent(fresh, 'garden-sky', 'noon'));
  assert.throws(() => journeyEvent(fresh, 'garden-chime', -1));
});

test('real local time chooses all four skies without changing a save', () => {
  assert.deepEqual([0, 4, 5, 10, 11, 16, 17, 20, 21, 23].map(skyFromHour), ['midnight', 'midnight', 'morning', 'morning', 'afternoon', 'afternoon', 'dusk', 'dusk', 'midnight', 'midnight']);
  const state = newJourney(), before = JSON.stringify(state);
  for (const hour of [7, 14, 18, 23]) {
    const note = dailyNote(state, new Date(2026, 10, 19, hour));
    assert.equal(note.sky, skyFromHour(hour)); assert.equal(note.lines.length, 1);
  }
  assert.equal(JSON.stringify(state), before);
  const revisited = { ...state, phase: 'after', garden: { sky: 'dusk', chime: 2 } };
  assert.equal(dailyNote(revisited).lines.length, 4);
  assert.notDeepEqual(dailyNote(state, new Date(2026, 10, 18, 14)).lines, dailyNote(state, new Date(2026, 10, 19, 14)).lines);
});

test('pool entrance is opt-in, grounded, walkable and leaves the standard spawn exact', () => {
  const config = getLayerConfig('atrium', newJourney());
  for (const href of ['/?paper=0617', '/?paper=0617&spot=invalid', '/?spot=pool', '/?paper=0617&spot=pool&layer=loft']) assert.deepEqual(entrySpawn(config.spawn, href), config.spawn);
  assert.deepEqual(config.spawn, { x: 0, y: 0, z: 8.8, yaw: 0, pitch: 0 });
  const spawn = entrySpawn(config.spawn, '/?paper=0617&spot=pool');
  assert.deepEqual(resolvePlayerMovement(spawn, spawn.x + .1, spawn.z - .1, config), { x: spawn.x + .1, y: 0, z: spawn.z - .1 });
  for (let z = POOL.minZ + .2; z < POOL.maxZ; z += .2) {
    assert.ok(inPool(0, z));
    assert.equal(resolvePlayerMovement({ x: 0, y: 0, z }, 0, z - .1, config).y, 0);
  }
  assert.equal(inPool(0, -3, 3.2), false);
});

test('unseen bench needs sight, distance and a turned back; never changes collision or save state', () => {
  const state = newJourney(), before = JSON.stringify(state), cfg = getLayerConfig('atrium', state);
  const prop = { x: -18, z: 11, variant: 0, phase: 'unseen', seenAt: null };
  const p = { x: -18, z: 17, yaw: 0 };
  assert.equal(stepUnseenProp(prop, { ...p, yaw: Math.PI }), '');
  assert.equal(prop.variant, 0);
  stepUnseenProp(prop, p);
  assert.equal(stepUnseenProp(prop, { ...p, yaw: Math.PI }), '', 'Turning in place is insufficient');
  assert.equal(stepUnseenProp(prop, { ...p, z: 19, yaw: Math.PI }), 'shift');
  assert.equal(prop.variant, 1);
  assert.equal(stepUnseenProp(prop, { ...p, z: 19 }), 'notice');
  assert.deepEqual(getLayerConfig('atrium', state).colliders, cfg.colliders);
  assert.equal(JSON.stringify(state), before);
  for (const name of ['p34-garden.js', 'p34-residents.js']) assert.doesNotMatch(fs.readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8'), /document\.cookie\s*=|localStorage\.setItem/);
});

test('skimmers scatter within water, bookmarks tuck under gaze and reduced motion skips the sovereign echo', () => {
  const skimmer = { x: 0, z: -3, phase: 0 };
  stepWaterSkimmer(skimmer, .5, { x: 0, y: 0, z: -2.5 }, false);
  assert.ok(skimmer.z < -3); assert.ok(skimmer.fleeing);
  for (let i = 0; i < 500; i++) stepWaterSkimmer(skimmer, .1, { x: skimmer.x - .1, y: 0, z: skimmer.z + .1 }, false);
  assert.ok(inPool(skimmer.x, skimmer.z));
  const frozen = { ...skimmer };
  stepWaterSkimmer(skimmer, .5, { x: 0, y: 0, z: 10 }, true);
  assert.equal(skimmer.x, frozen.x); assert.equal(skimmer.z, frozen.z);
  let player = { x: -5.5, y: 0, z: -4.8, yaw: Math.PI / 2, pitch: .51 };
  let paperSounds = 0;
  const cfg = getLayerConfig('stacks', newJourney()), before = JSON.stringify(cfg.colliders);
  const residents = addResidents(THREE, new THREE.Scene(), cfg, () => player, () => false, { layerId: 'stacks', onEntityGlance: () => paperSounds++ });
  for (let i = 0; i < 20; i++) residents.update(.1);
  assert.ok(residents.snapshot().shelfBookmarks[0].tuck > .9); assert.ok(paperSounds > 0);
  player = { ...player, yaw: -Math.PI / 2 };
  for (let i = 0; i < 20; i++) residents.update(.1);
  assert.ok(residents.snapshot().shelfBookmarks[0].tuck < .1);
  assert.equal(JSON.stringify(cfg.colliders), before);
  const reduced = addResidents(THREE, new THREE.Scene(), cfg, () => player, () => true, { layerId: 'stacks' });
  assert.equal(reduced.flashSovereign(), false); assert.equal(reduced.snapshot().sovereignEcho, false);
});

test('water and every pentatonic chime are silent-safe without an AudioContext', () => {
  const audio = createWorldAudio({ motion: { sound: false } });
  for (const sky of GARDEN_SKIES) audio.setGardenSky(sky);
  audio.setLayer('atrium'); audio.playFootstep('water'); audio.playInteraction('water');
  for (const tone of [0, 1, 2]) audio.playInteraction('chime', tone);
});

test('normal visitors get no trace or import; returning traces use validated save data and fixed text', async () => {
  const source = fs.readFileSync(new URL('../public/p34-home-echo.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /world3d|p34-space|three|innerHTML/);
  for (const [cookie, expected, imports] of [
    ['', undefined, 0],
    ['p34_journey_v2=%zz', undefined, 1],
    [`p34_journey_v2=${encodeURIComponent(JSON.stringify({ ...newJourney(), garden: { sky: '<img onerror=alert(1)>', chime: 1 } }))}`, undefined, 1],
    [`p34_journey_v2=${encodeURIComponent(JSON.stringify(journeyEvent(newJourney(), 'garden-sky', 'dusk')))}`, 'dusk', 1],
  ]) {
    let calls = 0; const paper = { dataset: {} };
    const document = { get cookie() { return cookie; }, set cookie(_) { assert.fail('Passive home wrote a cookie'); }, querySelector() { return paper; } };
    vm.runInNewContext(source.replace("import('./p34-journey.js?v=20261113-library')", "loadJourney()"), { URLSearchParams, location: { search: '' }, document, console, window: { addEventListener() {} }, loadJourney: () => { calls++; return Promise.resolve({ cookieJourney }); } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls, imports); assert.equal(paper.dataset.gardenSky, expected);
  }
  const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('class="desk-odd-object" href="/?paper=0617"'));
  assert.ok(html.includes('href="/?paper=0617&amp;spot=pool" aria-label="翻到水院"'));
});
