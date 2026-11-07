import test from 'node:test';
import assert from 'node:assert/strict';
import { createMotion } from '../public/p34-motion.js';

test('continuous sounds reuse a source, stop on mute/blur, and release on scene disposal',async()=>{
  const sources=[];
  const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
  const node=()=>({gain:param(),frequency:param(),pan:param(),connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;queueMicrotask(()=>this.onended?.());}});
  globalThis.document=Object.assign(new EventTarget(),{hidden:false});
  globalThis.window=new EventTarget();globalThis.matchMedia=()=>Object.assign(new EventTarget(),{matches:false});
  globalThis.AudioContext=class {
    currentTime=0;state='running';sampleRate=8;destination={};
    createOscillator(){const n=node();sources.push(n);return n;}
    createBufferSource(){const n=node();sources.push(n);return n;}
    createGain=node;createBiquadFilter=node;createStereoPanner=node;
    createBuffer(_channels,length){return {getChannelData:()=>new Float32Array(length)};}
    resume(){this.state='running';return Promise.resolve();}
    suspend(){this.state='suspended';return Promise.resolve();}
    close(){this.state='closed';return Promise.resolve();}
  };
  const controller=new AbortController();
  try{
    const motion=createMotion(controller.signal),beam=motion.sustain('laser');
    beam.update(true);assert.equal(sources.length,0,'no autoplay before the sound switch');
    motion.setSound(true);beam.update(true,-.5);const first=sources.at(-1),count=sources.length;
    beam.update(true,.5);assert.equal(sources.length,count);
    motion.setSound(false);beam.update(true);assert.equal(first.stopped,true);
    motion.setSound(true);beam.update(true);const resumed=sources.at(-1);
    document.hidden=true;beam.update(true);assert.equal(resumed.stopped,true);
    document.hidden=false;beam.update(true);const last=sources.at(-1);
    beam.dispose();await Promise.resolve();assert.equal(last.disconnected,true);
    const noise=motion.sustain('static');noise.update(true);const bed=sources.at(-1);
    controller.abort();await Promise.resolve();assert.equal(bed.stopped,true);assert.equal(bed.disconnected,true);
  }finally{
    controller.abort();for(const key of ['document','window','matchMedia','AudioContext'])delete globalThis[key];
  }
});
