import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { roomFromURL, roomHref, mountSpace } from '../public/p34-space.js';
import { lightPoint, INITIAL_LIGHT, readSketches } from '../public/p34-light.js';
import { playPassage, cancelPassage } from '../public/p34-passage.js';

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

test('Home and Blog ship exactly the same space and light implementation', () => {
  for (const file of ['p34-space.js', 'p34-space.css', 'p34-light.js', 'p34-space-content.js', 'p34-passage.js', 'p34-journey.js', 'p34-flight-levels.js', 'p34-orbit-core.js', 'p34-orbit.js', 'p34-adventure.js', 'p34-adventure.css']) {
    const blog = new URL(`../../sayori-blog/public/${file}`, import.meta.url);
    if (fs.existsSync(blog)) assert.equal(fs.readFileSync(new URL(`../public/${file}`, import.meta.url), 'utf8'), fs.readFileSync(blog, 'utf8'), file);
  }
});
