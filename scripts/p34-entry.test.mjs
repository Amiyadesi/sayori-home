import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/p34-entry.js', import.meta.url), 'utf8');

test('normal pages never acquire the loading cover', () => {
  vm.runInNewContext(source, { URLSearchParams, location: { search: '' } });
});

test('first paint follows the saved tone, and a failed import releases the cover with an error', () => {
  for (const phase of ['arrive', 'closed', 'found', 'after']) {
    const classes = new Set(), properties = {}, listeners = {}, notices = [];
    const root = { dataset: {}, style: { setProperty: (key, value) => { properties[key] = value; } },
      classList: { add: key => classes.add(key), remove: key => classes.delete(key) } };
    const document = { documentElement: root, referrer: 'https://example.test/writing/?paper=0617',
      cookie: `p34_journey_v2=${encodeURIComponent(JSON.stringify({ phase }))}`,
      head: { append() {} }, body: { prepend: node => notices.push(node) }, createElement: () => ({ setAttribute() {} }) };
    vm.runInNewContext(source, { document, URL, URLSearchParams, history: { state: null },
      location: { search: '?paper=0617', origin: 'https://example.test' }, window: { addEventListener: (key, fn) => { listeners[key] = fn; } } });
    assert.ok(classes.has('p34-loading'));
    assert.equal(properties['--p34-entry-color'], ['closed', 'found'].includes(phase) ? '#08090a' : '#294b7a');
    assert.equal(root.dataset.p34FromDesk, 'false');
    listeners['p34:entry-error']();
    assert.ok(!classes.has('p34-loading'));
    assert.match(notices[0].textContent, /没能打开/);
  }
});
