import test from 'node:test';
import assert from 'node:assert/strict';
import { LINES, CHOICES } from '../public/p34-script.js';

const strings = value => typeof value === 'string' ? [value] : Object.values(value).flatMap(strings);

test('the editable script contains text, and her lines keep the author’s punctuation rule', () => {
  assert.ok(strings(LINES).every(line => line.trim() && !/[。.]$/.test(line)));
  assert.ok(strings(CHOICES).every(label => label.trim()));
});
