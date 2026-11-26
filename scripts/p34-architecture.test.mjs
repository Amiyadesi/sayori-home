import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/third-party/three/three.module.min.js';
import { createBuilding } from '../public/p34-building.js';
import { atriumVista, libraryVista, loftVista, stacksVista } from '../public/p34-vistas.js';
import { deepConfig, populateDeep } from '../public/p34-deep.js';
import { createBody, advanceBody, TICK } from '../public/p34-kinematics.js';

// Only the material maps need a canvas. The tested geometry, instance matrices,
// scene graph, spatial index and player controller are the shipped modules.
function fixture(t,tone,software=true) {
  const noop=()=>{},context=new Proxy({},{
    get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop:noop}):noop
  });
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>context})};
  t.after(()=>{if(previous)globalThis.document=previous;else delete globalThis.document;});
  const scene=new T.Scene(),renderer={capabilities:{getMaxAnisotropy:()=>1}};
  scene.userData.software=true;
  const b=createBuilding(T,scene,renderer,{tone,software});
  return {world:b.physics,b,renderer,scene};
}
function walk(world,start,waypoints){
  const p=createBody({x:start[0],y:start[1],z:start[2]});
  for(let i=0;i<5;i++)advanceBody(p,world,0,0,TICK);
  for(const [x,z] of waypoints){
    const ticks=Math.ceil((Math.hypot(x-p.x,z-p.z)/3.2+2)/TICK);
    for(let i=0;i<ticks && Math.hypot(x-p.x,z-p.z)>.09;i++){
      const d=Math.hypot(x-p.x,z-p.z);
      advanceBody(p,world,3.2*(x-p.x)/d,3.2*(z-p.z)/d,TICK);
      assert.equal(p.rescue,null,'walking route fell');
    }
    assert.ok(Math.hypot(x-p.x,z-p.z)<.11,`blocked before (${x}, ${z}) at ${p.x},${p.y},${p.z}`);
  }
  return p;
}
test('compiled stone/furniture blocks its sides and keeps its top; curved arch is open even rotated',t=>{
  const {b,world}=fixture(t,'atrium');
  b.box(30,.2,30,0,-.1,0,b.floor);
  b.column(1.2,5,1.2,-4,0,-4);
  b.arch(0,0,-3,3.6,1.8,.5,.85,Math.PI/2);
  b.desk(4,0,1,2,1.3,1.05);
  const glass=new T.MeshBasicMaterial({transparent:true,opacity:.2});
  b.slab(1.1,1.6,.9,-2,.8,3,glass);
  b.bakeMasonry();
  for(const [x,z] of [[-4,-4],[4,1],[-2,3],[0,-.98]])
    assert.ok(world.blocked(x,z,.01),`missing solid at ${x},${z}`);
  assert.ok(!world.blocked(0,-3,.01));
  assert.ok(world.ceiling(0,-3,1.72,5,0)>3.5);
  assert.ok(Math.abs(world.support(4,1,2).y-1.05)<.01);
  assert.equal(world.support(4,1,2).material,'wood');
});
test('hidden/translated/rotated mechanisms use live mesh poses, never parked collider doubles',t=>{
  const {b,scene,world}=fixture(t,'drafts');
  const rig=new T.Group();rig.userData.movingSolid=true;scene.add(rig);
  b.box(1,.3,6,0,1,3,b.floor,rig);rig.visible=false;b.bakeMasonry();
  assert.equal(world.support(0,3,1.3),null);
  rig.visible=true;world.update();
  assert.equal(world.support(0,3,1.3).y.toFixed(2),'1.15');
  rig.rotation.y=Math.PI/2;rig.position.x=2;world.update();
  assert.equal(world.support(0,3,2),null);
  assert.ok(world.support(5,0,2));
  rig.userData.collisionDisabled=true;world.update();assert.equal(world.support(5,0,2),null);
});
test('atrium west garden, twin tower stair, rooftop and returning aqueduct are physically connected',t=>{
  const {b,scene,world}=fixture(t,'atrium');atriumVista(T,scene,b);b.bakeMasonry();
  const body=walk(world,[-33,0,5],[[-34,-12],[-34,-28],[-37.5,-28.4],[-37.5,-42]]);
  assert.ok(Math.abs(body.y-8)<.01);
  assert.ok(world.support(0,-31,4.1));
  assert.equal(world.support(48,2,0),null,'open chasm is not a floor');
});
test('pool stairways and piers are the same instances you see; real outer baths reach the oculus',t=>{
  const {b,scene,renderer,world}=fixture(t,'poolrooms'),config=deepConfig('poolrooms',{});
  const room=populateDeep({THREE:T,scene,renderer,software:true,config,layer:'poolrooms',building:b,reduced:()=>false});t.after(()=>room.dispose());
  b.bakeMasonry();
  assert.ok(world.blocked(1.88,-8.4,-.79));
  assert.ok(!world.blocked(0,-8.4,-.79));
  assert.ok(world.blocked(8,-66,-.79));
  for(const d of config.interactables.filter(i=>i.crossing))assert.ok(!world.blocked(d.x,d.z,d.floorY+.01),d.id);
  const body=walk(world,[6,1.8,11],[[26.8,11],[26.8,-25],[26.8,-33.8],[26.8,-37],[-17.5,-37],[-17.5,-47]]);
  assert.ok(Math.abs(body.y-1.85)<.015);
});
test('stacks side galleries, library desks beyond shelves and loft dome sill have real support',t=>{
  const {b,world,scene}=fixture(t,'stacks');stacksVista(T,scene,b);b.bakeMasonry();
  assert.ok(walk(world,[18.5,0,8],[[18.5,-7],[18.5,-15]]).y>2.35);
  {const {b,world,scene}=fixture(t,'library');libraryVista(T,scene,b);b.bakeMasonry();
    assert.ok(world.support(14,0,.5));assert.ok(world.support(0,-85,2));}
  {const {b,world,scene}=fixture(t,'loft');loftVista(T,scene,b);b.bakeMasonry();
    for(let i=0;i<12;i++){
      const a=(i+.5)*Math.PI/6;assert.ok(world.support(11.7*Math.sin(a),11.7*Math.cos(a),.1));
      assert.ok(world.blocked(12.7*Math.sin(a),12.7*Math.cos(a),0));
    }}
});
test('fold-desk staircase reaches its mezzanine with the live controller',t=>{
  const {b,world}=fixture(t,'atrium',false);
  b.box(27,.2,25,0,-.1,0,b.floor);
  for (let i=0;i<13;i++){
    const z=-2-i*.375,y=.12+i*.245;
    b.slab(3.85,.19,.48,-9.4,y-.095,z,b.plaster);
    b.box(3.6,.023,.048,-9.4,y-.025,z+.247,b.edge);
  }
  b.slab(19,.34,3.98,-1.95,3.03,-8.59,b.plaster);
  b.slab(19.06,.08,3.96,-1.95,3.17,-8.59,b.edge);
  b.bakeMasonry();
  assert.ok(walk(world,[-9.4,0,-1],[[-9.4,-8.2]]).y>3.15);
});
