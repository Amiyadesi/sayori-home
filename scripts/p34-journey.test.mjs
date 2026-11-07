import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { newJourney, journeyEvent, readJourney, trialReady, cookieJourney, availableVersions, STAGE_COUNT } from '../public/p34-journey.js';
import { playDelta } from '../public/p34-breakout.js';
import { reboundSketch } from '../public/p34-adventure.js';

const zero=()=>({launches:0,returns:0,misses:0,clears:0,hits:0,perfect:0,seconds:0});
function event(s,edition,delta,extra={}) {return journeyEvent(s,'play',{edition,mode:'trial',kind:'play',stage:0,score:100,seconds:20,delta:{...zero(),...delta},...extra});}
function played(s,edition) {return event(s,edition,{launches:1,returns:6,hits:8,seconds:22},{kind:'return',offset:.4,vx:250,vy:-500});}
function decision(opinion='both') {
  let s=played(newJourney(),'draft');s=journeyEvent(s,'feedback',{version:'draft',value:'clear'});
  s=played(s,'tuned');s=journeyEvent(s,'feedback',{version:'tuned',value:'free'});
  s=played(s,'guided');return journeyEvent(s,'opinion',opinion);
}
function reunited(){
  let s=journeyEvent(decision(),'withdraw');s=journeyEvent(s,'difference');s=journeyEvent(s,'opened','long-way');s=journeyEvent(s,'diagram');
  return journeyEvent(s,'found');
}
test('visits never count as play, and failed real trials qualify without a winning requirement',()=>{
  const s=newJourney();assert.equal(s.phase,'arrive');assert.throws(()=>journeyEvent(s,'visit'),/Unknown/);
  assert.throws(()=>journeyEvent(s,'feedback',{version:'draft',value:'clear'}),/play/i);
  const next=event(s,'draft',{launches:3,misses:3,seconds:28});assert.ok(trialReady(next,'draft'));
  assert.equal(journeyEvent(next,'feedback',{version:'draft',value:'clear'}).phase,'tuned');
  assert.equal(next.plays.draft.clears,0);
});
test('campaign play does not impersonate a same-layout comparison',()=>{
  const s=event(newJourney(),'draft',{launches:1,returns:12,hits:40,clears:1,seconds:70},{mode:'campaign',kind:'clear'});
  assert.equal(trialReady(s,'draft'),false);assert.equal(s.campaign.unlocked,1);
});
test('all opinions lead to the same creator-owned conflict, without morality scores',()=>{
  for(const opinion of ['free','clear','both','unsure']){const s=decision(opinion);assert.equal(s.phase,'choice');assert.equal(s.opinion,opinion);assert.ok(!('trust'in s)&&!('pressure'in s));assert.equal(journeyEvent(s,'withdraw').phase,'closed');}
});
test('closed exploration finds her without starting a game or inventing more play',()=>{
  let s=journeyEvent(decision(),'withdraw');assert.throws(()=>journeyEvent(s,'found'),/evidence/i);
  assert.throws(()=>journeyEvent(s,'diagram'),/source note/i);
  assert.throws(()=>event(s,'draft',{}, {mode:'seeking',kind:'found'}),/Unknown game session/);
  assert.throws(()=>event(s,'draft',{}, {mode:'campaign'}),/Closed works/);
  const play=structuredClone(s.plays),last=[...s.lastReturn];
  s=journeyEvent(s,'difference');s=journeyEvent(s,'opened','long-way');s=journeyEvent(s,'diagram');
  assert.equal(s.phase,'closed');
  s=journeyEvent(s,'found');assert.equal(s.phase,'found');
  assert.deepEqual(s.plays,play);assert.deepEqual(s.lastReturn,last);
});
test('the clue unlocks when the drawn ray actually reaches the right opening',()=>{
  assert.equal(reboundSketch(0,'draft').exit,false);
  assert.equal(reboundSketch(.6,'draft').exit,false);
  const free=reboundSketch(.9,'draft');assert.equal(free.exit,true);assert.match(free.path,/L956 /);
  assert.equal(reboundSketch(.9,'guided').exit,false);
});
test('ending requires placement and actual attempts, keeps the old placement, and leaves all revisions playable',()=>{
  let s=reunited();s=journeyEvent(s,'keepsake','round');s=journeyEvent(s,'make');assert.throws(()=>journeyEvent(s,'continue'),/change together/);
  s=event(s,'tuned',{}, {mode:'workshop',kind:'place',x:900});assert.equal(s.workshop.x,900);assert.equal(s.workshop.placed,true);
  s=event(s,'tuned',{launches:1,misses:1},{mode:'workshop',kind:'miss'});assert.throws(()=>journeyEvent(s,'continue'),/change together/);
  s=event(s,'tuned',{launches:1,misses:1},{mode:'workshop',kind:'miss'});s=journeyEvent(s,'continue');
  assert.equal(s.phase,'after');assert.equal(s.workshop.kept,900);assert.notEqual(s.workshop.x,900);assert.deepEqual(availableVersions(s),['draft','tuned','guided']);
});
test('the chosen return stays on the desk when later games produce different returns',()=>{
  let s=reunited();const remembered=[...s.lastReturn];s=journeyEvent(s,'keepsake','round');s=journeyEvent(s,'make');
  s=event(s,'tuned',{returns:1},{mode:'workshop',kind:'return',offset:-.7,vx:-500,vy:-300});
  assert.deepEqual(s.keptReturn,remembered);assert.notDeepEqual(s.lastReturn,remembered);
  assert.deepEqual(readJourney(JSON.stringify(s)).state.keptReturn,remembered);
  const old={...s};delete old.keptReturn;assert.equal(readJourney(JSON.stringify(old)).error,'');
  assert.ok(readJourney(JSON.stringify({...s,keptReturn:[3,0]})).error);
});
test('complete campaign and story fit the cookie and round-trip without dropping records',()=>{
  let s=reunited();s=journeyEvent(s,'keepsake','empty');s=journeyEvent(s,'make');s=event(s,'tuned',{}, {mode:'workshop',kind:'place',x:1400});
  s=event(s,'tuned',{launches:1,clears:1},{mode:'workshop',kind:'clear'});s=journeyEvent(s,'continue');
  for(let stage=0;stage<STAGE_COUNT;stage++)s=event(s,'draft',{launches:2,returns:25,clears:1,hits:60,seconds:99},{mode:'campaign',kind:'clear',stage,score:19580,seconds:99});
  s=journeyEvent(s,'light-saved',[[.1,.2],[.3,.6],[.5,.2],[.8,.7]]);
  const raw=JSON.stringify(s);assert.ok(encodeURIComponent(raw).length<=3800,encodeURIComponent(raw).length);
  assert.equal(readJourney(raw).error,'');assert.deepEqual(readJourney(raw).state,s);
  assert.deepEqual(cookieJourney(`other=keep;p34_journey_v2=${encodeURIComponent(raw)}`).state,s);
});
test('clear then exit resumes the next stage; an older game cannot erase another completed stage',()=>{
  let s=event(newJourney(),'draft',{clears:1},{mode:'campaign',kind:'clear'});
  s=event(s,'draft',{}, {mode:'campaign',kind:'exit'});assert.equal(s.campaign.stage,1);
  s=event(s,'draft',{clears:1},{mode:'campaign',kind:'clear',stage:1});
  s=event(s,'draft',{clears:1},{mode:'campaign',kind:'clear',stage:0});assert.deepEqual(Object.keys(s.campaign.records),['0','1']);
});
test('old bird saves retain acquaintance/light/letters, not invented breakout play',()=>{
  const old={v:1,phase:'after',light:2,lightSketch:[[.1,.2],[.3,.6],[.5,.2],[.8,.7]],leftLetter:true,touched:true,flights:{draft:{wins:19}}};
  const imported=cookieJourney(`p34_journey_v1=${encodeURIComponent(JSON.stringify(old))}`);
  assert.equal(imported.error,'');assert.equal(imported.migrated,true);assert.equal(imported.state.phase,'shared');assert.deepEqual(imported.state.lightSketch,old.lightSketch);assert.equal(imported.state.leftLetter,true);assert.equal(imported.state.plays.draft.clears,0);
  const early=newJourney();delete early.trials;delete early.lastReturn;assert.equal(readJourney(JSON.stringify(early)).error,'');
});
test('corrupt, oversized and future saves fail at the boundary',()=>{
  const s=newJourney();for(const raw of ['{',JSON.stringify({...s,v:9}),JSON.stringify({...s,plays:{}}),JSON.stringify({...s,workshop:{...s.workshop,x:-2}}),JSON.stringify({...s,lastReturn:[Infinity,0]}),JSON.stringify({...s,extra:'长'.repeat(450)})])assert.ok(readJourney(raw).error);
  assert.ok(cookieJourney('p34_journey_v2=%zz').error);
});
test('cumulative reports count once, and counter reversal is an error',()=>{
  const r={kind:'return',elapsed:20,counts:{launches:1,returns:3,misses:0,clears:0,hits:6,perfect:1}};
  const a=playDelta(r,{}),b=playDelta(r,a.current);assert.equal(a.delta.returns,3);assert.deepEqual(b.delta,zero());assert.throws(()=>playDelta({...r,elapsed:19},a.current),/倒退/);
});
test('active story no longer imports the rejected game or speaks in full stops',()=>{
  const source=fs.readFileSync(new URL('../public/p34-adventure.js',import.meta.url),'utf8');assert.doesNotMatch(source,/p34-orbit|纸燕|月亮|。/);
});
