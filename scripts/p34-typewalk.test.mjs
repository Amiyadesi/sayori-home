import test from 'node:test';
import assert from 'node:assert/strict';
import { WALK_LEVELS, makeWalker, stepWalker } from '../public/p34-typewalk.js';
import { createStory, advanceChapter } from '../public/p34-story.js';

test('typewalk milestones extend progression without redefining old saves',()=>{
 const s={...createStory(),chapter:'explore',met:1,trust:20,post:1};
 assert.equal(advanceChapter(s).chapter,'explore');
 const next=advanceChapter(s,2);assert.equal(next.chapter,'doubt');assert.equal(next.post,1);
});
test('caret lands on one-way text, jumps and cannot jump again in midair',()=>{
 const floor={id:'start',x:0,y:365,w:400,kind:'static'};
 const p=makeWalker(floor);
 stepWalker(p,{axis:0,jumpPressed:true,jumpHeld:true},[floor]);
 assert.ok(p.vy<0);assert.equal(p.ground,null);
 for(let i=0;i<20;i++)stepWalker(p,{axis:0,jumpHeld:true},[floor]);
 const oldVelocity=p.vy;
 stepWalker(p,{axis:0,jumpPressed:true,jumpHeld:true},[floor]);
 assert.ok(p.vy>oldVelocity);
 for(let i=0;i<150;i++)stepWalker(p,{axis:0,jumpHeld:false},[floor]);
 assert.equal(p.ground,'start');assert.equal(p.y,365);
});
test('coyote time, jump buffering and elastic words preserve a forgiving path',()=>{
 const floor={id:'start',x:0,y:365,w:100,kind:'static'},p=makeWalker(floor);
 p.x=105;
 stepWalker(p,{axis:1},[floor]);
 stepWalker(p,{axis:1,jumpPressed:true,jumpHeld:true},[floor]);
 assert.ok(p.vy<0);
 const spring={id:'spring',x:0,y:330,w:200,kind:'spring'},q={...makeWalker(spring),y:325,vy:200,ground:null,jumpHeld:true};
 let bounced=false;
 for(let i=0;i<8;i++){const events=stepWalker(q,{axis:0,jumpHeld:true},[spring]);bounced ||= events.includes('bounce');}
 assert.ok(bounced);assert.ok(q.vy < -700);
 stepWalker(q,{axis:0,jumpHeld:false},[spring]);assert.ok(q.vy < -700,'releasing jump must not cut an automatic spring launch');
 const r={...makeWalker(floor),y:361,vy:120,ground:null,coyote:0};
 stepWalker(r,{axis:0,jumpPressed:true,jumpHeld:true},[floor]);
 for(let i=0;i<8;i++)stepWalker(r,{axis:0,jumpHeld:true},[floor]);
 assert.ok(r.vy<0);
 for(const l of WALK_LEVELS){assert.equal(l.words[0][0],'start');assert.ok(l.words.some(w=>w[0]===l.goal));}
});
