import test from 'node:test';
import assert from 'node:assert/strict';
import { LINES, CHOICES } from '../public/p34-script.js';
import { RESPONSES, TRACES } from '../public/p34-journey.js';

const strings = value => typeof value === 'string' ? [value] : Object.values(value).flatMap(strings);

test('the editable script contains text, and her lines keep the author’s punctuation rule', () => {
  assert.ok(strings(LINES).every(line => line.trim() && !/[。.]$/.test(line)));
  assert.ok(strings(CHOICES).every(label => label.trim() && !/[。.]$/.test(label)));
});

test('every creative stance has its own answer and every missing echo has a concrete clue', () => {
  for (const id of RESPONSES) assert.ok(CHOICES.disagreement[id] && LINES.drafts.heard[id]);
  assert.equal(new Set(Object.values(LINES.drafts.heard)).size, RESPONSES.length);
  for (const id of TRACES) assert.ok(LINES.echoes[id]);
  for (const axis of ['height', 'span', 'tone']) assert.equal(LINES.loft.shaping[axis].length, 3);
});
