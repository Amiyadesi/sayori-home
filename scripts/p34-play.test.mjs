import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/third-party/three/three.module.min.js';
import { createBuilding } from '../public/p34-building.js';
import { createPlayroom,guideRoute } from '../public/p34-play.js';
import { newJourney } from '../public/p34-journey.js';

function room(id,interactables=[]) {
  const prior=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>({createLinearGradient:()=>({addColorStop(){}}),fillRect(){}})})};
  let b;const scene=new T.Scene();
  try {b=createBuilding(T,scene,null,{tone:id,software:true});}
  finally {if(prior)globalThis.document=prior;else delete globalThis.document;}
  const wet=id==='poolrooms',base=wet?-.8:0;
  b.box(24,.3,18,wet?2:0,base-.15,wet?-3:10,b.floor);
  const camera=new T.PerspectiveCamera(),audio={playInteraction(){},playFootstep(){},playLanding(){}};
  const config={id,interactables,physics:b.physics},state=newJourney(),said=[];
  let current=state;
  const p={x:wet?-7.35:8.55,y:base,z:wet?-2:10,yaw:0,grounded:true};
  camera.position.set(p.x,p.y+1.65,p.z);
  const play=createPlayroom({THREE:T,scene,camera,config,state,readState:()=>current,building:b,audio,say:t=>said.push(t),memory:{},reduced:()=>false});
  b.bakeMasonry();
  const ticks=n=>{for(let i=0;i<n;i++){play.update(1/60,p);b.physics.update();}};
  return {play,config,p,physics:b.physics,ticks,said,state,scene,setState:s=>current=s};
}

test('taking the keystone removes its body; dropping restores it and a seated key unfolds real walkable leaves',()=>{
  const {play,config,p,physics,ticks}=room('poolrooms');
  const target=name=>config.interactables.find(t=>t.id===name);
  const first=target('keystone');
  assert.equal(physics.support(first.x,first.z,1).id,'keystone');
  assert.equal(physics.support(-16,-3,1),null);
  play.interact(first,p);ticks(24);
  assert.equal(play.snapshot().held,true);assert.equal(physics.support(first.x,first.z,1).id,'key-stand');
  p.x=-5;p.z=1;
  play.interact(null,p);ticks(25);
  assert.equal(play.snapshot().held,false);
  assert.equal(physics.support(-5,0,1).id,'keystone');
  play.interact(target('keystone'),p);
  p.x=-10.23;p.z=-3;assert.equal(play.target(p).id,'keystone-socket');
  play.interact(null,p);ticks(42);
  assert.ok(play.snapshot().bridge>0 && play.snapshot().bridge<1);
  ticks(100);
  assert.equal(play.snapshot().bridge,1);
  assert.ok(Math.abs(physics.support(-16,-3,1).y+.8)<1e-5);
  assert.equal(config.interactables.some(t=>t.id==='keystone'),false);
  assert.ok(physics.blocked(-26.63,-3,-.68));
  for(let i=0;i<5;i++){p.x=-19.17-i*1.55;p.y=-.32+.05*(i%3);p.z=-3+(.5-i%2)*1.28;ticks(2);}
  ticks(100);
  assert.equal(play.snapshot().bells,31);
  assert.equal(physics.blocked(-26.63,-3,-.64),false);
});

test('turning the stone dial rotates the load-bearing deck and opens the annex',()=>{
  const {play,config,p,physics,ticks}=room('drafts');
  assert.equal(physics.support(24,10.9,.48),null);
  assert.equal(physics.support(21.18,13.6,.48).id,'turnbridge');
  play.interact(config.interactables.find(t=>t.id==='walkway-dial'),p);ticks(22);
  assert.ok(play.snapshot().bridgeAngle>0 && play.snapshot().bridgeAngle<Math.PI/2);
  ticks(60);
  assert.equal(physics.support(24,10.9,.48).id,'turnbridge');
  assert.equal(physics.support(21.18,13.6,.48),null);
});

test('paper glider launches from the camera and follows an accessible path round a partition',()=>{
  const {play,p,ticks,scene}=room('poolrooms');
  assert.equal(play.guide(p),true);const initial=play.snapshot().gliderPosition;
  ticks(15);assert.ok(play.snapshot().glider);
  assert.ok(Math.hypot(...play.snapshot().gliderPosition.map((v,i)=>v-initial[i]))>.04);
  assert.ok(scene.getObjectByName('play-poolrooms').children.length>0);
  const route=guideRoute({x:0,y:0,z:0},{x:0,y:0,z:-8},{
    support:()=>({y:0}),blocked:(x,z)=>z< -2 && z> -5 && Math.abs(x)<2,
  });
  assert.ok(route.some(n=>Math.abs(n.x)>=2));
  assert.ok(route.at(-1).z< -6.5);
});

test('saving the fold redirects G to the newly open passage without remounting the atrium',()=>{
  const desk={id:'light-sculpture-rig',kind:'lab-link',x:3,y:1,z:7};
  const door={id:'portal-atrium-poolrooms',targetLayer:'poolrooms',kind:'portal',x:0,y:1.4,z:3,floorY:0,crossing:{z:3,direction:-1}};
  const {play,p,setState,state}=room('atrium',[desk,door]);
  p.x=0;p.z=10;
  play.guide(p);assert.equal(play.snapshot().glider,desk.id);
  setState({...state,bridgeSolid:true});
  play.guide(p);assert.equal(play.snapshot().glider,door.id);
});

test('the catch opens, follows the falling player, folds away, and has rotating lines',()=>{
  const {play,p,ticks,said}=room('atrium');
  play.catchStart(p);p.y=-2;ticks(7);
  assert.ok(play.snapshot().catchVisible && play.snapshot().catchAge>.1);
  play.catchEnd();ticks(22);assert.ok(!play.snapshot().catchVisible);
  play.catchStart(p);assert.notEqual(said.at(-1),said.at(-2));
});
