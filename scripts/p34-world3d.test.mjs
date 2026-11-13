import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getLayerConfig,
  getLibraryConfig,
  crossedDoor,
  computeFloorElevation,
  resolvePlayerMovement,
  checkSightlineAlignment,
  findInteractiveTarget,
} from '../public/p34-world3d.js';
import { newJourney, journeyEvent } from '../public/p34-journey.js';
import { GLTFLoader } from '../public/third-party/three/GLTFLoader.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('library books have physical reading stations without granting main-route unlocks', () => {
  const posts = ['long-way', 'rain-folder', 'pulling-light'].map(slug => ({ slug, title: slug }));
  const config = getLibraryConfig(posts);
  assert.equal(config.interactables.filter(i => i.kind === 'book').length, posts.length);
  assert.equal(config.interactables.some(i => i.kind === 'projector' || i.kind === 'portal'), false);
  const book = config.interactables.find(i => i.kind === 'book');
  const before = { x: book.x, y: 0, z: book.z + 1.5 };
  const after = resolvePlayerMovement(before, book.x, book.z, config);
  assert.equal(after.z, before.z);
  assert.equal(findInteractiveTarget(before, 0, 0, config.interactables)?.slug, book.slug);
});

test('ordinary doors trigger only on crossing their opening, at the right height and direction', () => {
  const config = getLayerConfig('atrium', { westAligned: true });
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

test('West gallery non-Euclidean loop wraps player until sightline is aligned, then enables staircase elevation', () => {
  const unalignedState = newJourney();
  const cfg1 = getLayerConfig('atrium', unalignedState);

  // Walking north in the west gallery (X = -9.4, Z -> -5.5) triggers the loop back to Z = +4.8
  const looped = resolvePlayerMovement({ x: -9.4, y: 0, z: -4.9 }, -9.4, -5.5, cfg1, unalignedState);
  assert.equal(looped.looped, true);
  assert.equal(looped.z, 4.8);

  // Standing in the vantage circle (-6.5, 1.5) and looking West/North-West aligns the sightline
  assert.equal(checkSightlineAlignment({ x: -6.5, y: 0, z: 1.5 }, 1.1), true);
  assert.equal(checkSightlineAlignment({ x: 0, y: 0, z: 8.0 }, 1.1), false);

  // Once aligned, walking north up the West Staircase raises player Y smoothly to 3.2m
  const alignedState = journeyEvent(unalignedState, 'align-west');
  const cfg2 = getLayerConfig('atrium', alignedState);
  let pos = { x: -9.4, y: 0, z: -1.9 };
  for (let z = -2.2; z >= -7.2; z -= 0.5) {
    pos = resolvePlayerMovement(pos, -9.4, z, cfg2, alignedState);
    assert.equal(pos.looped, false);
  }
  assert.ok(pos.y >= 3.1, `Expected player to reach mezzanine height 3.2m, got ${pos.y}`);
});

test('2D Light Lab bridge solidification opens the chasm to the North High Platform', () => {
  const initial = journeyEvent(newJourney(), 'align-west');
  const cfgBlocked = getLayerConfig('atrium', initial);
  // Attempting to walk from mezzanine (Z = -10.2, Y = 3.2) onto the unsolidified light bridge (Z = -11.5) is blocked by chasm-guard
  const blocked = resolvePlayerMovement({ x: 0, y: 3.2, z: -10.2 }, 0, -11.5, cfgBlocked, initial);
  assert.ok(blocked.z > -10.5, `Expected chasm collider to block at Z > -10.5, got ${blocked.z}`);

  // After saving an arched curve in the 2D Light Lab, bridgeSolid is true and player can cross to Z = -15.5 (Y = 3.6m)
  const bridged = journeyEvent(initial, 'light-saved', [[0.1, 0.7], [0.35, 0.22], [0.65, 0.25], [0.9, 0.7]]);
  const cfgOpen = getLayerConfig('atrium', bridged);
  let pos = { x: 0, y: 3.2, z: -10.2 };
  for (let z = -10.6; z >= -15.6; z -= 0.5) {
    pos = resolvePlayerMovement(pos, 0, z, cfgOpen, bridged);
  }
  assert.ok(pos.z <= -15.0 && pos.y >= 3.5, `Expected player on High Platform, got z=${pos.z}, y=${pos.y}`);
});

test('interactive target finder locates portals, terminals and clues across all three layers', () => {
  const unlockedState = {
    ...newJourney(),
    westAligned: true,
    bridgeSolid: true,
    stacksUnlocked: true,
  };
  for (const layer of ['atrium', 'stacks', 'loft']) {
    const cfg = getLayerConfig(layer, unlockedState);
    assert.ok(cfg.interactables.length >= 6, `Layer ${layer} has丰富交互点`);
    for (const item of cfg.interactables) {
      // Position player 1.5m south of item, looking north (yaw = 0)
      const floorY = computeFloorElevation(item.x, item.z + 1.5, Math.max(0, (item.y || 1.5) - 1.5), cfg.surfaces);
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

test('upper objects cannot be used through the floor and empty space is not walkable', () => {
  const state = { ...newJourney(), westAligned: true, bridgeSolid: true };
  const cfg = getLayerConfig('atrium', state);
  const raised = cfg.interactables.filter(item => item.floorY !== undefined);
  for (const item of raised) {
    assert.equal(findInteractiveTarget({ x: item.x, y: 0, z: item.z + 1 }, 0, 0, [item]), null);
  }
  const edge = resolvePlayerMovement({ x: 8, y: 0, z: -12.4 }, 8, -13, cfg, state);
  assert.equal(edge.z, -12.4);
  assert.equal(checkSightlineAlignment({ x: -6.5, z: 1.5 }, 0), false);
});
