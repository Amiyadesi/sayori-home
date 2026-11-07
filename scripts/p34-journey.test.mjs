import test from 'node:test';
import assert from 'node:assert/strict';
import { newJourney, journeyEvent, readJourney, trialReady, cookieJourney, availableVersions } from '../public/p34-journey.js';

test('page visits do not create experiences; real failed attempts also qualify for feedback', () => {
  const s = newJourney();
  assert.equal(s.phase, 'arrive');
  assert.throws(() => journeyEvent(s, 'visit'), /Unknown/);
  assert.equal(readJourney(null).state.phase, 'arrive');
  assert.throws(() => journeyEvent(s, 'feedback', { version: 'draft', value: 'clear' }), /play/i);
  let next = s;
  for (let i = 0; i < 3; i++) {
    next = journeyEvent(next, 'launch', { version: 'draft', node: 0 });
    next = journeyEvent(next, 'miss', { version: 'draft' });
  }
  assert.equal(trialReady(next, 'draft'), true);
  next = journeyEvent(next, 'feedback', { version: 'draft', value: 'clear' });
  assert.equal(next.phase, 'tuned');
  assert.equal(next.feedback.draft, 'clear');
  assert.equal(next.flights.draft.wins, 0);
});

function played(s, version) {
  s = journeyEvent(s, 'launch', { version, node: 0 });
  for (const node of [1, 2]) s = journeyEvent(s, 'land', { version, node });
  return s;
}
function reachDecision(opinion) {
  let s = played(newJourney(), 'draft');
  s = journeyEvent(s, 'feedback', { version: 'draft', value: 'clear' });
  s = played(s, 'tuned'); s = journeyEvent(s, 'feedback', { version: 'tuned', value: 'free' });
  s = played(s, 'guided'); return journeyEvent(s, 'opinion', opinion);
}

test('criticism, praise and uncertainty share a coherent conflict without a morality score', () => {
  for (const opinion of ['free', 'clear', 'both', 'unsure']) {
    const s = reachDecision(opinion);
    assert.equal(s.phase, 'choice'); assert.equal(s.opinion, opinion);
    assert.equal('trust' in s, false); assert.equal('pressure' in s, false);
    assert.equal(journeyEvent(s, 'withdraw').phase, 'closed');
  }
});

test('reunion needs cross-site evidence and a real detour; ending needs a real creative test', () => {
  let s = journeyEvent(reachDecision('both'), 'withdraw');
  assert.throws(() => journeyEvent(s, 'land', { version: 'tuned', node: 6 }), /evidence/);
  s = journeyEvent(s, 'difference');
  assert.throws(() => journeyEvent(s, 'diagram'), /source note/);
  s = journeyEvent(s, 'opened', 'long-way'); s = journeyEvent(s, 'diagram');
  s = journeyEvent(s, 'land', { version: 'tuned', node: 5 });
  s = journeyEvent(s, 'land', { version: 'tuned', node: 6 });
  assert.equal(s.phase, 'found');
  s = journeyEvent(s, 'keepsake', 'route'); s = journeyEvent(s, 'make');
  assert.throws(() => journeyEvent(s, 'continue'), /creation/);
  s = journeyEvent(s, 'place', [330, -220]);
  s = journeyEvent(s, 'test', true); s = journeyEvent(s, 'continue');
  assert.equal(s.phase, 'after'); assert.equal(s.keepsake, 'route');
  assert.deepEqual(availableVersions(s), ['draft', 'tuned', 'guided']);
  assert.notDeepEqual(s.position, [330, -220]);
  assert.deepEqual(s.keptPosition, [330, -220]);
});

test('save round-trip preserves the complete story; corrupt and future saves are reported', () => {
  const s = reachDecision('free'), raw = JSON.stringify(s);
  assert.deepEqual(readJourney(raw).state, s);
  assert.deepEqual(cookieJourney(`other=keep; p34_journey_v1=${encodeURIComponent(raw)}`).state, s);
  assert.ok(encodeURIComponent(raw).length < 3500);
  for (const input of ['{', JSON.stringify({ ...s, v: 4 }), JSON.stringify({ ...s, position: [-1, 0] }), JSON.stringify({ ...s, flights: {} })]) assert.ok(readJourney(input).error);
  assert.ok(cookieJourney('p34_journey_v1=%zz').error);
  assert.ok(readJourney(JSON.stringify({ ...s, extra: '长'.repeat(450) })).error);
  assert.equal(cookieJourney('p34_story=legacy; p34_world_v1=legacy').state.phase, 'arrive');
});

test('a portable shared sketch survives recovery; earlier v1 saves remain readable', () => {
  const sketch = [[.1,.2],[.3,.6],[.5,.2],[.8,.7]];
  const s = journeyEvent(newJourney(), 'light-saved', sketch);
  assert.deepEqual(readJourney(JSON.stringify(s)).state.lightSketch, sketch);
  const old = { ...s }; delete old.lightSketch; delete old.campaign;
  assert.equal(readJourney(JSON.stringify(old)).error, '');
  assert.ok(readJourney(JSON.stringify({ ...s, lightSketch: [[-1, 9]] })).error);
});

test('saving a stale open game does not erase another tab’s completed routes', () => {
  let s = newJourney();
  const stale = structuredClone(s.campaign);
  s = journeyEvent(s, 'campaign-save', { ...s.campaign, records: { 2: { shots: 6, seconds: 85 } } });
  s = journeyEvent(s, 'campaign-save', { ...stale, records: { 3: { shots: 4, seconds: 50 } } });
  assert.deepEqual(Object.keys(s.campaign.records), ['2', '3']);
});

test('the full atlas does not falsely count as playing the early double-moon revision', () => {
  const s = journeyEvent(newJourney(), 'campaign-save', { v: 1, selected: 3, checkpoint: null, records: { 0: { shots: 3, seconds: 20 }, 1: { shots: 4, seconds: 30 }, 2: { shots: 5, seconds: 50 } } });
  assert.equal(trialReady(s, 'draft'), false);
  assert.throws(() => journeyEvent(s, 'feedback', { version: 'draft', value: 'clear' }), /play/);
});
