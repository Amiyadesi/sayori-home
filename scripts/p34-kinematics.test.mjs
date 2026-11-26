import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceBody, createBody, queueJump, TICK} from '../public/p34-kinematics.js';

function trial(heightAt){
  const p=createBody({x:0,y:0,z:0}), world={
    support(x,z,limit){const y=heightAt(x,z);return Number.isFinite(y)&&y<=limit ? {y,id:'ledge'} : null;},
    blocked:()=>false,ceiling:()=>Infinity,
  };
  const run=(x=0)=>advanceBody(p,world,x,0);
  run();return {p,world,run};
}
test('jump accelerates up, falls continuously, lands once and buffers a second jump',()=>{
  const {p,run}=trial(()=>0);queueJump(p);
  let peak=0,landings=0,jumps=0;
  for(let i=0;i<115;i++){
    if(p.y>0 && p.y<.2 && p.vy<-3)queueJump(p);
    const before=p.y,e=run(); peak=Math.max(peak,p.y);
    if(e.jump)jumps++; if(e.landed)landings++;
    assert.ok(Math.abs(p.y-before)<.09);
  }
  assert.ok(peak>1.1 && peak<1.4);assert.equal(landings,1);assert.equal(jumps,2);
});
test('leaving a ledge preserves momentum and grants a late jump; lowering floors never pull feet down',()=>{
  const {p,run}=trial(x=>x<.45?0:-2);
  while(p.grounded)run(4);
  assert.ok(p.vx>3 && p.y>-.01);
  for(let i=0;i<7;i++)run(4);
  queueJump(p);assert.ok(run(4).jump);
  while(p.vy>0)run(4);
  while(!p.grounded) {const y=p.y;assert.ok(!run().catch);assert.ok(y-p.y<.12);}
  assert.equal(p.y,-2);
});
test('abyss permits a free fall, brakes below the lip and glides back to a supported ledge',()=>{
  const {p,run}=trial(x=>x<.7?0:-Infinity);
  let airborne=0, caughtAt=0, rescuedAt=0;
  for(let i=0;i<210;i++){
    const before={...p},e=run(4);
    if(!p.grounded && !p.rescue)airborne++;
    if(e.catch){caughtAt=i;assert.ok(p.y<-1.6 && p.vy<-7);}
    if(e.rescued){rescuedAt=i;break;}
    assert.ok(Math.abs(before.y-p.y)<.15 && Math.abs(before.x-p.x)<.15);
  }
  assert.ok(airborne*TICK>=.43);assert.ok(Math.abs((rescuedAt-caughtAt)*TICK-.65)<.02);
  assert.ok(p.grounded && p.x<.7);assert.equal(p.y,0);
});
test('a floor far below a plunge pool does not suppress the catch',()=>{
  const {p,run}=trial(x=>x<.5?0:-12);
  for(let i=0;i<120 && !p.rescue;i++)run(4);
  assert.ok(p.rescue && p.y< -1 && p.y> -4);
});
