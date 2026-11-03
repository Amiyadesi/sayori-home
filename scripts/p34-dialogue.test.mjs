import test from 'node:test';
import assert from 'node:assert/strict';
import { dialogueNode, timeOfVisit, lingerReady } from '../public/p34-dialogue.js';
import { parseSceneHash, serializeSceneHash } from '../public/p34-arc.js';
import { createStory, discover, CHAPTERS, CLUES } from '../public/p34-story.js';

test('authored dialogue actions resolve across sites, chapters and visit periods without changing saves', () => {
  for (const site of ['home', 'blog', 'store']) for (const chapter of CHAPTERS) for (const period of ['night', 'morning', 'afternoon', 'evening']) {
    const story = { ...createStory(), chapter, clues: CLUES }, before = structuredClone(story);
    const queue = ['root'], visited = new Set();
    while (queue.length) {
      const id = queue.shift(); if (visited.has(id)) continue; visited.add(id);
      const node = dialogueNode(id, story, { site, period, lingered: true });
      if (node.action) { assert.ok(['return', 'close', 'search', 'navigate'].includes(node.action)); continue; }
      assert.ok(node.text && node.pose, id); assert.ok(node.choices.length || node.leave, id);
      assert.equal(new Set(node.choices.map(c => c.id)).size, node.choices.length);
      if (node.scene) assert.equal(parseSceneHash(serializeSceneHash(node.scene)).valid, true);
      queue.push(...node.choices.map(c => c.id));
    }
    assert.deepEqual(story, before);
  }
});
test('questions unlock by exploration; navigation and reading execute once', () => {
  let s = createStory();
  assert.equal(dialogueNode('notes', s).choices.some(c => c.id === 'old'), false);
  assert.notEqual(dialogueNode('old', s).pose, 'align');
  s = discover(s, 'old-version').story;
  assert.ok(dialogueNode('notes', s).choices.some(c => c.id === 'old'));
  s = discover(s, 'update-log').story;
  assert.ok(dialogueNode('notes', s).choices.some(c => c.id === 'edit'));
  assert.deepEqual(dialogueNode('return', s), { action: 'return' });
  assert.deepEqual(dialogueNode('return', s, { site: 'store' }), { action: 'close' });
  assert.equal(dialogueNode('read', s).leave, true);
  assert.equal(dialogueNode('read', s).scene.view, 'blog');
  assert.equal(dialogueNode('space', s).reveal, true);
  assert.throws(() => dialogueNode('not-an-action', s), /Unknown Project 34/);
});
test('local visit periods differ; linger needs active time AND quiet', () => {
  assert.deepEqual([0, 4, 5, 10, 11, 16, 17, 23].map(timeOfVisit), ['night', 'night', 'morning', 'morning', 'afternoon', 'afternoon', 'evening', 'evening']);
  assert.throws(() => timeOfVisit(24), RangeError);
  const s = createStory();
  assert.equal(new Set(['night', 'morning', 'afternoon', 'evening'].map(period => dialogueNode('notes', s, { period }).choices.find(c => c.id === 'time').label)).size, 4);
  assert.equal(lingerReady(84999, 18000), false); assert.equal(lingerReady(85000, 17999), false); assert.equal(lingerReady(85000, 18000), true);
  assert.equal(dialogueNode('root', s).choices.some(c => c.id === 'linger'), false);
  assert.equal(dialogueNode('root', s, { lingered: true }).choices[0].id, 'linger');
});
