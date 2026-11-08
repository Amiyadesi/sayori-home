import test from 'node:test';
import assert from 'node:assert/strict';
import { letterPayload, letterRequest, LETTER_PATH, LETTER_ENDPOINT } from '../public/p34-guestbook.js';

const letter = { name: '路过的人', mail: 'visitor@example.test', text: '第一行\n<script>bad()</script> & 第二行' };
const userAgent = 'Mozilla/5.0 (Project 34 browser test)';

test('letters use their own server partition and escape text, not the real blog guestbook', () => {
  const payload = letterPayload(letter, 'https://example.test/?paper=0617&room=guestbook', 'test-token', userAgent);
  assert.equal(payload.url, LETTER_PATH);
  assert.notEqual(payload.url, '/guestbook/');
  assert.match(payload.comment, /<br>&lt;script&gt;bad\(\)&lt;\/script&gt; &amp;/);
  assert.equal(payload.mail, letter.mail);
  assert.equal(payload.ua, userAgent, 'The live Twikoo API requires ua in the JSON body');
  for (const bad of [{ name: '' }, { name: 'a'.repeat(41) }, { mail: 'not mail' }, { text: ' ' }, { text: 'a'.repeat(1001) }]) {
    assert.throws(() => letterPayload({ ...letter, ...bad }, 'https://example.test/', 'test-token', userAgent));
  }
});

test('a receipt is required: HTTP errors, rejection and malformed success never count as sent', async () => {
  const original = globalThis.fetch;
  const payload = letterPayload(letter, 'https://example.test/', 'test-token', userAgent);
  const signal = new AbortController().signal;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, LETTER_ENDPOINT);
      assert.equal(options.credentials, 'omit');
      assert.deepEqual(JSON.parse(options.body), payload);
      return Response.json({ id: 'test-receipt' });
    };
    assert.equal((await letterRequest(payload, signal)).id, 'test-receipt');
    for (const response of [new Response('', { status: 503 }), Response.json({ code: 403, message: '验证失败' }), Response.json({ code: 0 }), Response.json(null)]) {
      globalThis.fetch = async () => response;
      await assert.rejects(letterRequest(payload, signal));
    }
  } finally { globalThis.fetch = original; }
});
