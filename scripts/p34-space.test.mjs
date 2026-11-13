import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { roomFromURL, roomHref, mountSpace } from '../public/p34-space.js';
import { lightPoint, INITIAL_LIGHT, readSketches } from '../public/p34-light.js';
import { playPassage, cancelPassage } from '../public/p34-passage.js';
import { SHARED_P34_FILES } from './sync-p34-space.mjs';
import { createSpatialDialogue, wrapSpatialText } from '../public/p34-typography.js';
import { LINES, CHOICES } from '../public/p34-script.js';
import { FontLoader } from '../public/third-party/three/FontLoader.js';
import { TextGeometry } from '../public/third-party/three/TextGeometry.js';

test('spatial dialogue wraps Chinese and its font covers the live script with actual depth', () => {
  assert.deepEqual(wrapSpatialText('你从正面过来的？\n等一下', 5), ['你从正面过', '来的？', '等一下']);
  const data = JSON.parse(fs.readFileSync(new URL('../public/assets/p34/dialogue.typeface.json', import.meta.url)));
  const text = JSON.stringify({ LINES, CHOICES });
  for (const char of text) assert.ok(data.glyphs[char], `Missing 3D glyph: ${char}; run build-p34-font.mjs`);
  const geometry = new TextGeometry(CHOICES.askWho, { font: new FontLoader().parse(data), size: .2, depth: .02 });
  geometry.computeBoundingBox();
  assert.ok(geometry.boundingBox.max.z > geometry.boundingBox.min.z);
  geometry.dispose();
});

test('3D dialogue arrives and departs glyph by glyph, with immediate reduced motion', async () => {
  const fetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => JSON.parse(fs.readFileSync(new URL('../public/assets/p34/dialogue.typeface.json', import.meta.url))) });
  globalThis.document = { activeElement: null };
  let dialogue;
  try {
    let scene, reduced = false;
    dialogue = await createSpatialDialogue({ reduced: () => reduced });
    const renderer = { render(value) { scene = value; } };
    dialogue.show('你从正面', [], 1280, 800);
    dialogue.render(renderer, .05);
    const words = scene.children.find(child => child.isGroup);
    const glyphs = words.children[0].children;
    assert.equal(glyphs.length, 4);
    assert.ok(glyphs[0].visible);
    assert.equal(glyphs[3].visible, false);
    dialogue.render(renderer, .15);
    assert.ok(glyphs[0].position.z > glyphs[3].position.z);
    assert.ok(glyphs[0].rotation.y < glyphs[3].rotation.y);
    dialogue.render(renderer, 1);
    assert.ok(glyphs.every(glyph => glyph.position.z === 0 && glyph.material[0].opacity === 1));
    dialogue.show(null, [], 1280, 800);
    dialogue.render(renderer, .05);
    assert.ok(glyphs[0].material[0].opacity < glyphs[3].material[0].opacity);
    dialogue.render(renderer, 1);
    assert.equal(scene.children.filter(child => child.isGroup).length, 1);
    reduced = true;
    dialogue.show('等一下', [], 390, 844);
    dialogue.render(renderer, .001);
    assert.ok(words.children[0].children.every(glyph => glyph.visible && glyph.position.z === 0 && glyph.material[0].opacity === 1));
    dialogue.show(LINES.arrival[0], [], 390, 844);
    dialogue.render(renderer, .001);
    const worldWidth = 8 * Math.tan(34 * Math.PI / 180) * 390 / 844;
    assert.ok(words.children.length > 1);
    assert.ok(words.children.every(line => line.userData.span < worldWidth));
  } finally {
    dialogue?.dispose(); globalThis.fetch = fetch; delete globalThis.document;
  }
});

test('reduced motion never captures geometry or creates a passage overlay', async () => {
  globalThis.document = { hidden: false };
  try {
    const shell = {};
    await playPassage(shell, null, { reduced: () => true }, true);
    await playPassage(shell, null, { reduced: () => true }, false);
    cancelPassage(shell);
  } finally { delete globalThis.document; }
});

test('existing paper entry and deep room URLs retain their meaning', () => {
  for (const room of ['home', 'works', 'lab', 'archive', 'guestbook']) {
    const href = roomHref(room, 'http://127.0.0.1:8980/');
    assert.equal(roomFromURL(href), room);
    assert.equal(new URL(href, 'https://sayori.org').searchParams.get('paper'), '0617');
  }
  assert.equal(roomHref('blog'), 'https://blog.sayori.org/?paper=0617');
  assert.equal(roomFromURL('/?paper=0617&room=lab', 'blog'), 'blog');
  assert.equal(roomFromURL('/?room=<script>'), 'home');
  assert.throws(() => roomHref('missing'), /Unknown space/);
});

test('normal routes and SSR never touch DOM, storage or animation', async () => {
  (await mountSpace())();
  globalThis.location = { search: '' };
  try { (await mountSpace())(); } finally { delete globalThis.location; }
});

test('light spline passes through every handle and stays continuous', () => {
  for (let i = 0; i < INITIAL_LIGHT.length; i++) {
    const p = lightPoint(INITIAL_LIGHT, i / 3);
    assert.ok(Math.hypot(p[0] - INITIAL_LIGHT[i][0], p[1] - INITIAL_LIGHT[i][1]) < .00001);
  }
  let previous = lightPoint(INITIAL_LIGHT, 0);
  for (let i = 1; i <= 1000; i++) {
    const point = lightPoint(INITIAL_LIGHT, i / 1000);
    assert.ok(point.every(Number.isFinite));
    assert.ok(Math.hypot(point[0] - previous[0], point[1] - previous[1]) < .01);
    previous = point;
  }
});

test('local sketches validate version, time, count and normalized geometry at the boundary', () => {
  const entry = { version: 1, at: 1000, nodes: INITIAL_LIGHT };
  assert.deepEqual(readSketches(JSON.stringify([entry])), [entry]);
  for (const raw of ['null', '{}', 'not json', JSON.stringify([{ ...entry, version: 9 }]), JSON.stringify([{ ...entry, nodes: [[NaN, 3]] }])]) assert.deepEqual(readSketches(raw), []);
  assert.equal(readSketches(JSON.stringify(Array.from({ length: 20 }, (_, i) => ({ ...entry, at: i })))).length, 8);
  assert.equal(readSketches(JSON.stringify([{ ...entry, at: 'yesterday' }])).length, 0);
  assert.equal(readSketches(JSON.stringify([{ ...entry, at: 1e30 }])).length, 0);
});

test('Home and Blog ship the exact same shared 3D space and light implementation', () => {
  for (const file of SHARED_P34_FILES) {
    const blog = process.env.P34_BLOG_PUBLIC ? `${process.env.P34_BLOG_PUBLIC}/${file}` : new URL(`../../sayori-blog/public/${file}`, import.meta.url);
    if (process.env.P34_BLOG_PUBLIC || fs.existsSync(blog)) {
      assert.equal(fs.readFileSync(new URL(`../public/${file}`, import.meta.url), 'utf8'), fs.readFileSync(blog, 'utf8'), file);
    }
  }
});
