import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { paperCommand, paperRecord } from '../public/paper-world.js';
import { paperContent } from '../public/paper-content.js';
const read = name => fs.readFileSync(new URL('../public/' + name, import.meta.url), 'utf8');

test('normal routes do not initialize paper UI or request story content', async () => {
  globalThis.location = { search: '' };
  try {
    // No document, storage or matchMedia: accidental initialization fails here.
    await import('../public/paper-trace.js');
    await import('../public/paper-social.js');
  } finally { delete globalThis.location; }
  for (const name of ['paper-trace.js', 'paper-social.js']) {
    const text = read(name);
    assert.ok(text.indexOf("get('paper') === '0617'") < text.indexOf("import('./"));
  }
});

test('shared fictional chronology distinguishes a manual index from executable evidence', () => {
  assert.equal(paperRecord.date, '2026-06-17');
  assert.equal(paperRecord.zone, 'UTC+8');
  assert.equal(paperRecord.build, 'P34-0617');
  assert.equal(paperRecord.version, '0.3.4');
  assert.match(paperRecord.index, /02:13.*人工.*不是导出或运行证明/);
  assert.match(paperRecord.author, /03:40.*没有可执行文件/);
  assert.match(paperRecord.changed, /同一构建.*第二扇门.*署名/);
  assert.match(paperCommand('cat 0617').text, /2026-06-17 UTC\+8/);
});

test('terminal no longer validates answers, unlocks routes, or treats a phrase as a key', () => {
  for (const command of ['write social.addr Amiyadesi', 'write about.copy 0.3.4', 'write services.log 87', 'status', 'back', 'open inbox', 'open blog.0617', '我记得']) {
    assert.equal(paperCommand(command).action, undefined);
    assert.equal(paperCommand(command).text, '文件或命令不存在。');
  }
});

test('native terminal recovery and motion commands remain available', () => {
  for (const [command, action] of [[' EXIT ', 'close'], ['/restore', 'close'], ['home', 'normal'], ['motion off', 'still'], ['motion on', 'motion'], ['clear', 'clear']]) {
    assert.equal(paperCommand(command).action, action);
  }
  assert.match(paperCommand('ls').text, /0617.txt/);
  assert.match(paperCommand('cat room.png').text, /原稿：一扇门/);
});

test('no clue docks, walkthroughs, embedded chat or signature checklists survive', () => {
  const publicLayer = ['paper-trace.js', 'paper-world.js', 'paper-content.js', 'paper-social.js', 'paper-trace.css'].map(read).join('\n');
  assert.doesNotMatch(publicLayer, /trace-clue-dock|trace-dock-|trace-window|postMessage|localStorage|checkPaperAnswer|write (?:social|about|services)\.|87 分钟|我记得|线索解锁|关键词获得|签名核对进度|\/desk/);
  assert.doesNotMatch(read('paper-trace.js'), /iframe|chat\.sayori\.org|window\.open|preventDefault\(\)[\s\S]*stopImmediatePropagation/);
  assert.doesNotMatch(read('paper-trace.css'), /trace-breathe|trace-skew|transition:\s*all/);
});

test('both normal home entries go to home; chat exists only as a contextual social item', () => {
  assert.match(read('index.html'), /class="desk-odd-object" href="\/\?paper=0617"/);
  assert.match(read('script.notebook.js'), /cmd === 'open 0617'[\s\S]*?assign\('\/\?paper=0617'\)/);
  assert.deepEqual(paperContent.social, [{ label: 'Sayori Chat', handle: 'chat.sayori.org', href: 'https://chat.sayori.org/' }]);
  assert.doesNotMatch(read('paper-social.js'), /replaceChildren|preventDefault|social\.addr/);
  assert.equal(paperContent.contact.links.length, 1);
  assert.equal(paperContent.contact.links[0].href, '/social/?paper=0617');
});

test('material is local, anomaly-gated, restores doll and defers lifecycle to common runtime', () => {
  const material = read('paper-material.js');
  assert.match(material, /new WeakMap/);assert.match(material, /mounted.has\(body\)/);assert.match(material, /mountP34/);assert.match(material, /runtime.destroy/);assert.match(material, /pagehide/);assert.match(material, /lifecycle.abort/);
  assert.match(material, /sayori-torn-display.png/);assert.match(material, /removeAttribute\('srcset'\)/);assert.match(material, /originals/);
  assert.doesNotMatch(material, /canvas|checkPaperAnswer/);assert.match(read('p34-organic.css'), /prefers-reduced-motion:reduce/);assert.match(read('paper-trace.js'), /trace-reader-signature/);

});
