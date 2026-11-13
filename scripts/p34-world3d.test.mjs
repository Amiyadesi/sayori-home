import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getLayerConfig,
  computeFloorElevation,
  resolvePlayerMovement,
  checkSightlineAlignment,
  findInteractiveTarget,
} from '../public/p34-world3d.js';
import { newJourney, journeyEvent } from '../public/p34-journey.js';
import { GLTFLoader } from '../public/third-party/three/GLTFLoader.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
