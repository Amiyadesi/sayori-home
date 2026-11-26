import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getLayerConfig,
  layerEntrySpawn,
  getLibraryConfig,
  crossedDoor, wrapWing,
  findInteractiveTarget,
} from '../public/p34-world3d.js';
import { newJourney, journeyEvent, LAYERS } from '../public/p34-journey.js';
import { GLTFLoader } from '../public/third-party/three/GLTFLoader.js';
import * as THREE from '../public/third-party/three/three.module.min.js';
import { addResidents, stepResident, WALKER_ROUTE } from '../public/p34-residents.js';
import { createWorldAudio } from '../public/p34-audio.js';

test('paired door poses face inward, clear the reverse trigger and cross the matching aperture', () => {
  const state = { ...newJourney(),phase:'after',layers:[...LAYERS], bridgeSolid:true,stacksUnlocked:true,shelfMoved:true };
  const rooms=[...LAYERS.map(layer=>getLayerConfig(layer,state)),getLibraryConfig([])];
  for(const source of rooms) for(const outgoing of source.interactables.filter(i=>i.crossing)){
    const destination=rooms.find(r=>r.id===outgoing.targetLayer);
    const opposite=destination.interactables.find(i=>i.crossing&&i.targetLayer===source.id);
    assert.ok(opposite,'Missing reverse doorway: '+outgoing.id);
    const landed=layerEntrySpawn(destination,outgoing.id);
    const c=opposite.crossing,axis='x' in c?'x':'z',side=axis==='x'?'z':'x';
    assert.ok((landed[axis]-c[axis])*c.direction<=-1.1,outgoing.id+' lands outside its opening');
    assert.equal(landed[side],opposite[side]);
    assert.equal(landed.y,opposite.floorY ?? 0);
    const next={...landed,x:landed.x-Math.sin(landed.yaw)*.2,z:landed.z-Math.cos(landed.yaw)*.2};
    assert.ok((next[axis]-landed[axis])*c.direction<-.19,outgoing.id+' is obstructed or faces backward');
    assert.ok(!crossedDoor(landed,next,destination.interactables));
    let p=landed,found;
    for(let i=0;i<20&&!found;i++){
      const q={...p,[axis]:p[axis]+c.direction*.12};
      found=crossedDoor(p,q,destination.interactables);p=q;
    }
    assert.equal(found?.id,opposite.id,outgoing.id+' cannot be walked back through its partner');
  }
});

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('arrival conversation is opt-in and adds no movement barrier or save mutation', () => {
  const state = newJourney(), before = JSON.stringify(state);
  const fresh = getLayerConfig('atrium', state);
  const echo = fresh.interactables.find(i => i.kind === 'talk-arrival');
  assert.equal(echo.id, 'arrival-echo');
  assert.equal(findInteractiveTarget(fresh.spawn, 0, 0, fresh.interactables), null);
  assert.equal(findInteractiveTarget({ ...fresh.spawn, x:echo.x,z: 6.8 }, 0, 0, fresh.interactables)?.id, echo.id);
  assert.equal(JSON.stringify(state), before);
  const greeted = getLayerConfig('atrium', journeyEvent(state, 'hello'));
  assert.equal(greeted.interactables.some(i => i.kind === 'talk-arrival'), false);
});

test('resident walks a continuous loop, notices a gaze and yields instead of chasing', () => {
  const config = getLayerConfig('atrium', newJourney());
  const resident = { distance: 0, phase: 0 }, distantPlayer = { x: 22, z: 10, yaw: 0 };
  let pos = { x: WALKER_ROUTE[0][0], z: WALKER_ROUTE[0][1], y: 0 };
  for (let i = 0; i < 2000; i++) {
    const next = stepResident(resident, .05, distantPlayer, false);
    assert.ok(Math.hypot(pos.x - next.x, pos.z - next.z) < .03, 'Resident jumped');
    pos = { ...next, y: 0 };
  }
  const watchingPlayer = { x: pos.x, z: pos.z + 5, yaw: 0 };
  const distance = resident.distance;
  stepResident(resident, .05, watchingPlayer, true);
  assert.equal(resident.mode, 'watching'); assert.equal(resident.distance, distance);
  stepResident(resident, .05, watchingPlayer, false);
  assert.ok(resident.distance > distance, 'A gaze through a wall should not stop the resident');
  resident.distance = 0;
  const nearPlayer = { x: WALKER_ROUTE[0][0], z: WALKER_ROUTE[0][1] + 1.8, yaw: 0 };
  const away = stepResident(resident, .05, nearPlayer, true);
  assert.equal(resident.mode, 'yielding');
  assert.ok(Math.hypot(away.x - nearPlayer.x, away.z - nearPlayer.z) > 1.8);
});

test('library reading stations target their own articles without granting main-route unlocks', () => {
  const posts = ['long-way', 'rain-folder', 'pulling-light'].map(slug => ({ slug, title: slug }));
  const config = getLibraryConfig(posts);
  assert.equal(config.interactables.filter(i => i.kind === 'book').length, posts.length);
  assert.equal(config.interactables.some(i => i.kind === 'projector' || i.kind === 'portal'), false);
  const book = config.interactables.find(i => i.kind === 'book');
  const before = { x: book.x, y: 0, z: book.z + 1.5 };
  assert.equal(findInteractiveTarget(before, 0, 0, config.interactables)?.slug, book.slug);
});

test('ordinary doors trigger only on crossing their opening, at the right height and direction', () => {
  const config = getLayerConfig('atrium', newJourney());
  const door = config.interactables.find(i => i.crossing);
  const plane = door.crossing.z;
  const before = { x: door.x, y: door.floorY, z: plane + .2 };
  const after = { ...before, z: plane - .2 };
  assert.equal(crossedDoor(before, after, config.interactables), door);
  assert.equal(crossedDoor(after, before, config.interactables), undefined);
  assert.equal(crossedDoor(before, { ...after, x: 8 }, config.interactables), undefined);
  assert.equal(crossedDoor({ ...before, y: 0 }, { ...after, y: 0 }, config.interactables), undefined);
  assert.equal(crossedDoor(before, before, config.interactables), undefined);
});

test('saving the fold desk changes atrium walkability without changing the active layer', () => {
  const initial = newJourney();
  assert.equal(initial.bridgeSolid,false);
  const arch = [[0.1, 0.7], [0.35, 0.22], [0.65, 0.25], [0.9, 0.7]];
  const draft = journeyEvent(initial, 'light-moved', arch);
  assert.equal(draft.bridgeSolid, false);
  const bridged = journeyEvent(draft, 'light-saved', arch);
  assert.equal(bridged.currentLayer, 'atrium');
  assert.equal(bridged.bridgeSolid,true);
});

test('interactive target finder locates portals, terminals and clues across all five layers', () => {
  const unlockedState = {
    ...newJourney(),
    westAligned: true,
    bridgeSolid: true,
    stacksUnlocked: true,
  };
  for (const layer of LAYERS) {
    const cfg = getLayerConfig(layer, unlockedState);
    assert.ok(cfg.interactables.some(i=>!i.crossing));
    for (const item of cfg.interactables) {
      // Position player 1.5m south of item, looking north (yaw = 0)
      if (item.crossing) continue; // Door approach and height are exercised above.
      const floorY = item.floorY ?? item.y - 1.5;
      const found = findInteractiveTarget({ x: item.x, y: floorY, z: item.z + 1.5 }, 0, 0, cfg.interactables);
      assert.ok(found, `Expected target near ${item.id} in ${layer}`);
    }
  }
});

test('shipped GLB models parse cleanly via Three.js GLTFLoader', async () => {
  const loader = new GLTFLoader();
  for (const name of ['paper-prism-lamp.glb', 'spatial-tuning-fork.glb']) {
    const file = path.join(root, 'public/assets/p34/models', name);
    const buf = fs.readFileSync(file);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const gltf = await new Promise((resolve, reject) => loader.parse(ab, '', resolve, reject));
    assert.ok(gltf.scene && gltf.scene.children.length >= 3, `${name} should contain 3D mesh nodes`);
  }
});

test('upper objects cannot be used through the floor', () => {
  const state = { ...newJourney(), westAligned: true, bridgeSolid: true };
  const cfg = getLayerConfig('atrium', state);
  const raised = cfg.interactables.filter(item => item.floorY !== undefined);
  for (const item of raised) {
    assert.equal(findInteractiveTarget({ x: item.x, y: 0, z: item.z + 1 }, 0, 0, [item]), null);
  }
});

test('stacks and loft entities inhabit their layers without blocking routes, and world audio fails safe when muted', () => {
  for (const layerId of ['stacks', 'loft']) {
    const cfg = getLayerConfig(layerId, { ...newJourney(), stacksUnlocked: true });
    const scene = new THREE.Scene();
    let dialogueOpen = false;
    const api = addResidents(THREE, scene, cfg, () => ({ x: 0, y: 0, z: 3, yaw: 0, pitch: 0 }), () => false, {
      layerId,
      isDialogueOpen: () => dialogueOpen,
    });
    const before = api.snapshot();
    assert.equal(before.layer, layerId);
    api.update(0.1);
    dialogueOpen = true;
    api.update(0.1);
    assert.ok(scene.children.length >= 2);
  }
  const sound = createWorldAudio({ motion: { sound: false } });
  sound.setLayer('loft');
  sound.playFootstep('wood', false);
  sound.playInteraction('fork');
  sound.updateSpatial({ x: 0, z: 0, yaw: 0 }, 'loft', null, 0.05);
});


test('the east wing preserves overshoot, width and height, and releases its closed loop after the sundial trace', () => {
  const state={...newJourney(),phase:'closed'}, cfg=getLayerConfig('atrium',state);
  const before={x:21,y:0,z:-47.94}, after={...before,z:-48.06};
  assert.deepEqual(wrapWing(before,after,cfg),{...after,z:after.z+24});
  assert.equal(wrapWing(after,before,cfg),null);
  assert.equal(wrapWing({...before,x:0},{...after,x:0},cfg),null);
  assert.equal(wrapWing(before,after,getLayerConfig('atrium',{...state,traces:['atrium']})),null);
  assert.ok(!cfg.interactables.some(i=>!i.crossing && i.kind!=='memory-trace'));
});
