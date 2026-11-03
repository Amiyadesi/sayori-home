import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStory, migrateFromWorld, serializeStory, parseStory, discover,
  finishWork, finishPostcard, talk, advanceChapter, worksLocked, worldMood, topicsFor, CHAPTERS,
} from '../public/p34-story.js';

test('new story token round-trips and rejects junk', () => {
  const s = createStory();
  s.met = 1; s.chapter = 'explore'; s.trust = 22; s.pressure = 8;
  s.clues = ['old-version', 'update-log'];
  s.works.light = 1;
  const token = serializeStory(s);
  const back = parseStory(token);
  assert.equal(back.valid, true);
  assert.equal(back.story.chapter, 'explore');
  assert.equal(back.story.trust, 22);
  assert.deepEqual(back.story.clues.sort(), ['old-version', 'update-log']);
  assert.equal(back.story.works.light, 1);
  assert.equal(back.story.works.words, 0);

  for (const bad of ['', 'v1.home.1', '3.1.1.0.0.0.0.0', '2.99.1.0.0.0.0.0']) {
    assert.equal(parseStory(bad).valid, false);
  }
});

test('old world cookie migrates only presence and a capped amount of affinity', () => {
  const legacy = { first: 'home', st: 3, aff: 80, hk: 1, ba: 1, dc: 1 };
  const s = migrateFromWorld(legacy);
  assert.equal(s.met, 1);
  assert.equal(s.chapter, 'explore');
  assert.equal(s.trust, 40);
  assert.deepEqual(s.clues, []);
  assert.equal(s.works.light, 0);

  const blank = migrateFromWorld({ first: 'none', st: 0, aff: 0 });
  assert.equal(blank.met, 0);
  assert.equal(blank.chapter, 'arrive');
});

test('finding a clue unlocks the matching topic and raises trust', () => {
  const base = { ...createStory(), met: 1, chapter: 'explore' };
  const { story, fresh, unlockedTopics } = discover(base, 'old-version');
  assert.equal(fresh, true);
  assert.equal(story.clues.includes('old-version'), true);
  assert.equal(story.trust, 6);
  assert.deepEqual(unlockedTopics, ['works', 'old']);

  // 同一条线索不会重复加
  const again = discover(story, 'old-version');
  assert.equal(again.fresh, false);
  assert.equal(again.story.trust, story.trust);
  assert.deepEqual(topicsFor(again.story), topicsFor(story));
});

test('chapters advance on play, pressure and clues rather than on a script', () => {
  let s = { ...createStory(), met: 1, chapter: 'explore', trust: 20 };
  s = finishWork(s, 'light');
  s = finishWork(s, 'words');
  s = advanceChapter(s);
  assert.equal(s.chapter, 'doubt');

  // 追问敏感话题会累积压力，压力到线才进入裂痕
  while (s.pressure < 45) s = talk(s, 'why-edit', 'blunt');
  s = advanceChapter(s);
  assert.equal(s.chapter, 'rift');

  while (s.pressure < 70) s = talk(s, 'ok', 'blunt');
  s = advanceChapter(s);
  assert.equal(s.chapter, 'closed');
  assert.equal(worksLocked(s), true);

  // 封闭期找不到线索就出不来
  s = advanceChapter(s);
  assert.equal(s.chapter, 'closed');
  s = discover(s, 'mirror-page').story;
  s = discover(s, 'empty-shelf').story;
  s = advanceChapter(s);
  assert.equal(s.chapter, 'search');
  s = discover(s, 'draft-note').story;
  s = advanceChapter(s);
  assert.equal(s.chapter, 'reconcile');
  assert.equal(worksLocked(s), true);

  // 和解需要信任，不是走完流程就自动好
  s = { ...s, trust: 20 };
  assert.equal(advanceChapter(s).chapter, 'reconcile');
  s = advanceChapter({ ...s, trust: 40 });
  assert.equal(s.chapter, 'free');
  assert.equal(worksLocked(s), false);
});

test('mood follows the chapter so the page can look like how she feels', () => {
  assert.equal(worldMood({ ...createStory(), chapter: 'explore', trust: 0 }), 'warm');
  assert.equal(worldMood({ ...createStory(), chapter: 'rift', pressure: 70 }), 'cracked');
  assert.equal(worldMood({ ...createStory(), chapter: 'closed' }), 'hollow');
  assert.equal(worldMood({ ...createStory(), chapter: 'free' }), 'warm');
  assert.equal(CHAPTERS.length, 8);
});

test('v2 story saves migrate without losing discoveries, relationships or retired work records',()=>{
  const old=parseStory('2.2.1.32.25.83.9.7');
  assert.equal(old.valid,true);assert.equal(old.story.chapter,'doubt');
  assert.equal(old.story.trust,32);assert.equal(old.story.pressure,25);
  assert.deepEqual(old.story.works,{light:1,words:1,drift:1});assert.equal(old.story.post,0);
  const next=finishPostcard(old.story,3);
  assert.equal(parseStory(serializeStory(next)).story.post,3);
  assert.deepEqual(next.works,old.story.works);
});

test('replaying creations and rereading clues cannot farm relationship progress',()=>{
  let s=finishPostcard(createStory(),1);const trust=s.trust;
  s=finishPostcard(s,1);assert.equal(s.trust,trust);
  const once=finishWork(s,'light');assert.equal(finishWork(once,'light').trust,once.trust);
  s=discover(s,'old-version').story;s=discover(s,'update-log').story;
  assert.equal(s.topics.length,new Set(s.topics).size);
  for(const bad of ['3.1.1.20.0.0.0.0.7','3.1.1.20.0.zz.0.0.0','2.1.1.NaN.0.0.0.0'])assert.equal(parseStory(bad).valid,false);
});
