import test from 'node:test';
import assert from 'node:assert/strict';
import { OrbitFlight, segmentWall } from '../public/p34-orbit-core.js';
import { FLIGHT_LEVELS, newCampaign, readCampaign } from '../public/p34-flight-levels.js';

// Witness routes use actual swept collisions, not direct placement on a destination.
const routes = [
  [1,2,3], [2,1,3,4], [1,2,5,3,4],
  [{winds:[3],node:1},2], [{winds:[3,3],node:1},2,3], [3,0,{winds:[3],node:2},{winds:[0],node:1},4],
  [1,2,3], [2,1,3,4], [1,4,2,5,3,5,6], [8,6,1,3,2,4,5,7],
  [1,2], [1,2], [1,2,6,4,3,4,5], [2,1,3,1,2,0,4],
  [{winds:[3],node:1},{winds:[0],node:2},6,5,3,6,{winds:[2],node:0},4,7],
  [1,2,3,8,4,5,6,7,4,3,9], [1,7,2,3,10,5,4,5,3,7,6,0,8,9],
  [2,9,1,3,5,8,11,12,6,5,4,13,10],
];

export function flightTo(g, target) {
  for(let i=0;i<720;i++) {
    const trial=new OrbitFlight({version:g.version,level:g.level,resume:g.checkpoint()});
    trial.angle=i*Math.PI/360; trial.place(); trial.release();
    for(let k=0;k<1000 && trial.phase==='flight';k++) trial.step(1/120);
    if(trial.current!==target || !['orbit','won'].includes(trial.phase)) continue;
    g.angle=i*Math.PI/360; g.place(); g.release();
    for(let k=0;k<1000 && g.phase==='flight';k++) g.step(1/120);
    return;
  }
  assert.fail(`${g.level.title}: no flight ${g.current} → ${target}, mask ${g.mask}`);
}

for(let id=0;id<FLIGHT_LEVELS.length;id++) test(`hand-authored route ${id+1}: ${FLIGHT_LEVELS[id].title}`,()=>{
  const g=new OrbitFlight({version:'tuned',level:FLIGHT_LEVELS[id]});
  for(const move of routes[id]) {
    if(typeof move==='object') {
      move.winds.forEach((direction,i)=>{while(g.winds[i].direction!==direction) g.rotateWind(i);});
      flightTo(g,move.node);
    } else flightTo(g,move);
  }
  assert.equal(g.phase,'won');
  assert.equal(g.keys.size,g.moons.filter(m=>m.key).length);
  if(id===3) assert.ok(g.events.some(e=>e.type==='wind'));
  if(id===5) assert.equal(new Set(g.events.filter(e=>e.type==='wind').map(e=>e.direction)).size,2);
  if(id===12) assert.deepEqual(new Set(g.events.filter(e=>e.type==='fold').map(e=>e.index)),new Set([0,1]));
  if(id===10 || id===11 || id===13) assert.ok(g.events.some(e=>e.type==='fold'));
});

test('gates collide when closed, change on real landing, and undo restores the puzzle',()=>{
  assert.notEqual(segmentWall({x:0,y:0},{x:200,y:0},[100,-100,100,100]),null);
  const g=new OrbitFlight({version:'tuned',level:FLIGHT_LEVELS[6]});
  g.aimAt(410,-180); g.release();
  for(let i=0;i<500&&g.phase==='flight';i++) g.step(1/120);
  assert.equal(g.current,0); assert.ok(g.events.some(e=>e.reason==='wall'));
  g.undo(); flightTo(g,1); assert.equal(g.mask,1);
  flightTo(g,2); assert.equal(g.keys.size,1);
  g.undo(); assert.equal(g.current,1); assert.equal(g.keys.size,0); assert.equal(g.mask,1);
  g.undo(); assert.equal(g.current,0); assert.equal(g.mask,0);
});

test('aim, prediction and checkpoints keep physical state, time and input honest',()=>{
  const g=new OrbitFlight({version:'tuned',level:FLIGHT_LEVELS[0]});
  g.aimAt(250,-160); const before=g.checkpoint(), p=g.prediction();
  assert.equal(p.hit,1); assert.deepEqual(g.checkpoint(),before);
  g.held=true; const angle=g.angle; g.step(.3); assert.equal(g.angle,angle);
  g.release(); for(let i=0;i<500&&g.phase==='flight';i++)g.step(1/120);
  assert.equal(g.current,1);
  const save={...g.checkpoint(),level:0};
  const data={...newCampaign(),checkpoint:save};
  assert.deepEqual(readCampaign(JSON.stringify(data)),data);
  const restore=new OrbitFlight({version:'tuned',level:FLIGHT_LEVELS[0],resume:save});
  assert.deepEqual(restore.checkpoint(),g.checkpoint());
  for(const bad of ['{',JSON.stringify({...data,v:9}),JSON.stringify({...data,checkpoint:{...save,node:500}}),JSON.stringify({...data,checkpoint:{...save,level:'0'}}),JSON.stringify({...data,selected:1}),JSON.stringify({...data,checkpoint:{...save,keys:[0]}})]) assert.throws(()=>readCampaign(bad));
});
