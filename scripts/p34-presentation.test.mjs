import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/third-party/three/three.module.min.js';
import { bookPose,createPresentation } from '../public/p34-presentation.js';

test('a hinged spread is readable only after the cover and leaves have turned',()=>{
  const start=bookPose(0),mid=bookPose(.35),open=bookPose(1);
  assert.equal(start.cover,0);assert.equal(mid.ink,0);assert.equal(open.ink,1);
  assert(mid.cover>mid.leaves[0] && mid.leaves.every((v,i,a)=>!i || v<a[i-1]));
  assert(Math.abs(open.cover-165*Math.PI/180)<1e-8);
  assert(open.lift>0 && mid.lift<open.lift);
});

test('the eye and book progress over frames, reverse mid-turn and end at the original pose',()=>{
  const camera=new T.PerspectiveCamera();camera.position.set(-2,1.67,3);camera.rotation.set(-.13,.53,.01);
  const home=camera.position.clone(),q=camera.quaternion.clone(),target=new T.Vector3(0,2,1);
  const p=createPresentation(T,camera,()=>false), cover=new T.Object3D(),rig={pose(n){cover.rotation.z=bookPose(n).cover;}};
  p.focus('book',target,new T.Vector3(0,1,0),rig);p.tick(.15);
  assert(camera.position.distanceTo(home)>0 && camera.position.distanceTo(target)>0);
  const mid=cover.rotation.z,eye=camera.position.clone();
  p.close();assert.equal(camera.position.distanceTo(eye),0);p.tick(.06);assert(cover.rotation.z<mid && cover.rotation.z>0);
  for(let i=0;i<40;i++)p.tick(1/60);
  assert.equal(p.active,false);assert.equal(cover.rotation.z,0);assert(camera.position.distanceTo(home)<1e-7);assert(q.angleTo(camera.quaternion)<1e-7);
});

test('crossing renders a full veil before exchanging rooms and reveals from a moving eye',()=>{
  const camera=new T.PerspectiveCamera(),p=createPresentation(T,camera,()=>false);
  const alpha=[];let arrivals=0;
  p.travel(()=>{assert.equal(alpha.at(-1),1);arrivals++;camera.position.set(4,2,6);},a=>alpha.push(a));
  p.tick(.15);assert(camera.position.z<0);assert.equal(arrivals,0);p.tick(.09);assert.equal(alpha.at(-1),1);
  p.tick(.03);assert.equal(arrivals,1);assert(camera.position.z>6);p.tick(.4);
  assert.equal(alpha.at(-1),0);assert.equal(p.active,false);assert.deepEqual(camera.position.toArray(),[4,2,6]);
});
