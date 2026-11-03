import test from 'node:test';
import assert from 'node:assert/strict';
import { paperCommand } from '../public/paper-world.js';
import { paperContent } from '../public/paper-content.js';

test('normal routes do not initialize the abnormal wrappers',async()=>{
 globalThis.location={search:''};
 try{await import('../public/paper-trace.js');await import('../public/paper-social.js');const {initPaperMaterial}=await import('../public/paper-material.js');initPaperMaterial()();}finally{delete globalThis.location;}
});
test('retired puzzle answers do not advance the new story',()=>{
 for(const command of ['rubbing','tune 034','write social.addr Amiyadesi','cat room.png'])assert.equal(paperCommand(command).action,undefined);
});
test('terminal can close, return to normal, and control motion',()=>{
 for(const [input,action]of [['exit','close'],['home','normal'],['motion off','still'],['motion on','motion'],['clear','clear']])assert.equal(paperCommand(input).action,action);
 assert.match(paperCommand('hello').text,/我/);
 assert.equal('music'in paperContent,false);
});
