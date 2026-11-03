import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDefaultWorldState,parseWorldState,serializeWorldState,mergeWorldStates,advanceEncounterState,readWorldCookie,stepSpring,resolveCookieDomain,mountLivingWorld,HER_NOTES,parseSceneHash,serializeSceneHash,sceneDocumentTitle } from '../public/p34-living.js';
import { segmentGraphemes } from '../public/p34-motion.js';

test('normal route performs no DOM, audio or state initialization',()=>{
 globalThis.location={search:''};
 try{const stop=mountLivingWorld();assert.equal(typeof stop,'function');stop();}finally{delete globalThis.location;}
});
test('saved legacy world flags keep their meanings and affinity',()=>{
 const old=parseWorldState('v1.home.1.1.5.1.1.1.4.playful.28');assert.equal(old.valid,true);
 assert.equal(serializeWorldState(old.state),'v1.home.1.1.5.1.1.1.4.playful.28');
 for(const raw of [null,'','v2.home.1','v1.evil.1.1.1.0.0.0.0.warm'])assert.equal(parseWorldState(raw).valid,false);
 assert.deepEqual(readWorldCookie('other=1'),createDefaultWorldState());
});
test('both entry orders preserve independent home and blog encounters',()=>{
 for(const [first,second] of [['home','blog'],['blog','home']]){
  const a=advanceEncounterState(createDefaultWorldState(),first),b=advanceEncounterState(a.state,second);
  assert.equal(a.encounterType,first+'-first');assert.equal(b.state.first,first);
  assert.equal(b.state.hm,1);assert.equal(b.state.bm,1);
  assert.equal(mergeWorldStates(a.state,b.state).st,b.state.st);
 }
 assert.equal(resolveCookieDomain('blog.sayori.org'),'.sayori.org');assert.equal(resolveCookieDomain('localhost'),'');
});
test('release spring settles with real initial momentum',()=>{
 let p=80,v=600;
 for(let i=0;i<180;i++){const s=stepSpring(p,v,0,220,21);p=s.pos;v=s.vel;}
 assert.equal(p,0);assert.equal(v,0);
 assert.deepEqual(segmentGraphemes('你👩‍💻é'),['你','👩‍💻','é']);
});
test('in-document scene hash parser validates boundaries and round-trips notes',()=>{
 assert.ok(HER_NOTES.length>=3);
 const firstId=HER_NOTES[0].id;
 assert.deepEqual(parseSceneHash('','home'),{valid:true,view:'space',noteId:null});
 assert.deepEqual(parseSceneHash('','blog'),{valid:true,view:'blog',noteId:null});
 assert.deepEqual(parseSceneHash('#blog','home'),{valid:true,view:'blog',noteId:null});
 assert.deepEqual(parseSceneHash('#space','blog'),{valid:true,view:'space',noteId:null});
 const noteScene=parseSceneHash('#note-'+firstId,'home');
 assert.deepEqual(noteScene,{valid:true,view:'post',noteId:firstId});
 assert.equal(serializeSceneHash(noteScene),'#note-'+firstId);
 assert.doesNotMatch(sceneDocumentTitle(noteScene),/Amiya/);
 assert.doesNotMatch(sceneDocumentTitle({view:'blog'}),/Amiya/);
 assert.doesNotMatch(sceneDocumentTitle({view:'space'}),/Amiya/);
 for(const bad of ['#note-missing','#../../evil','#<script>',null]){
  const parsed=parseSceneHash(bad,'blog');
  assert.equal(parsed.valid,false);assert.equal(parsed.view,'blog');assert.equal(parsed.noteId,null);
 }
});
test('both sites ship the same active world; retired horror engines are absent',()=>{
 const home=new URL('../public/',import.meta.url),blog=new URL('../../sayori-blog/public/',import.meta.url);
 for(const file of ['p34-living.js','p34-living.css','p34-motion.js','p34-motion.css','p34-arc.js','p34-arc.css','p34-dialogue.js','p34-dialogue.css','p34-story.js','p34-typewalk.js','p34-works.js'])assert.equal(fs.readFileSync(new URL(file,home),'utf8'),fs.readFileSync(new URL(file,blog),'utf8'),file);
 for(const file of ['p34-organic.js','p34-organic.css'])assert.equal(fs.existsSync(new URL(file,home)),false);
 assert.equal(fs.existsSync(new URL('p34-decay.js',blog)),false);
});
