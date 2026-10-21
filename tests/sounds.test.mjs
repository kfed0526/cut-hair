import test from 'node:test';
import assert from 'node:assert/strict';
import {GameSounds} from '../sounds.js';
function fakeContext(){
 const events=[],nodes=[];
 const param=()=>({value:0,setValueAtTime(value,time){events.push({action:'set',value,time});},linearRampToValueAtTime(value,time){events.push({action:'ramp',value,time});},exponentialRampToValueAtTime(value,time){events.push({action:'ramp',value,time});}});
 const node=()=>{const n={frequency:param(),connect(){},disconnect(){this.disconnected=true;},start(time){events.push({action:'start',time});},stop(time){this.stopped=true;events.push({action:'stop',time});}};nodes.push(n);return n;};
 return {state:'suspended',currentTime:10,sampleRate:8000,destination:{},events,nodes,resumes:0,resume(){this.resumes++;this.state='running';return Promise.resolve();},createGain(){return {gain:param(),connect(){},disconnect(){}};},createOscillator:node,createBufferSource:node,createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}};
}
test('tap unlock reuses a context, success is short, mute and stop cancel playback',()=>{
 let created=0;const context=fakeContext(),s=new GameSounds(()=>{created++;return context;});
 assert.equal(s.correct(),0);s.unlock();assert.equal(s.correct(),420);assert.equal(s.nodes.size,3);assert.equal(context.events.filter(e=>e.action==='start').length,3);
 const prior=[...s.nodes];s.stop();assert.ok(prior.every(n=>n.stopped&&n.disconnected));assert.equal(s.nodes.size,0);s.unlock();assert.equal(created,1);
 s.enabled=false;const starts=context.events.filter(e=>e.action==='start').length;s.correct();s.dance();assert.equal(context.events.filter(e=>e.action==='start').length,starts);
});
test('celebration schedules rhythm, claps and slides within nine seconds; skip cancels all',()=>{
 const context=fakeContext(),s=new GameSounds(()=>context);s.unlock();s.dance(9);
 assert.ok(s.nodes.size>40);assert.ok(context.events.filter(e=>e.action==='start').every(e=>e.time>=10&&e.time<19));assert.ok(context.events.filter(e=>e.action==='stop').every(e=>e.time<=19));
 const nodes=[...s.nodes];s.stop();assert.equal(s.nodes.size,0);assert.ok(nodes.every(n=>n.stopped&&n.disconnected));
 context.state='suspended';s.unlock();assert.equal(context.state,'running');assert.equal(context.resumes,2);
});
test('unsupported Web Audio does not block the game',()=>{const s=new GameSounds(()=>{throw Error('unsupported');});assert.doesNotThrow(()=>s.unlock());assert.equal(s.correct(),0);assert.doesNotThrow(()=>s.dance(9));});

test('salon effects share the context and volume, reject unknown tools and obey mute and cancellation',()=>{
 const context=fakeContext(),sound=new GameSounds(()=>context);assert.equal(sound.salon('scissors'),false);sound.unlock();sound.setVolume(.3);assert.equal(sound.output.gain.value,.135);
 for(const tool of ['scissors','comb','dryer','finish']){assert.equal(sound.salon(tool),true);assert.ok(sound.nodes.size>0);const old=[...sound.nodes];sound.stop();assert.ok(old.every(n=>n.stopped));}
 assert.equal(sound.salon('bad'),false);sound.enabled=false;assert.equal(sound.salon('scissors'),false);assert.equal(sound.nodes.size,0);
});
test('festival effects use the shared mute and cancellation controls',()=>{
 const context=fakeContext(),s=new GameSounds(()=>context);s.unlock();
 for(const effect of ['pop','firework','drum','row','bite','rustle','wish','correct']){s.festival(effect);assert.ok(s.nodes.size>0);const old=[...s.nodes];s.stop();assert.ok(old.every(n=>n.stopped));}
 s.enabled=false;const starts=context.events.filter(e=>e.action==='start').length;s.festival('firework');assert.equal(context.events.filter(e=>e.action==='start').length,starts);
});


test('sand rustle is short, shares the unlocked context and obeys mute and stop',()=>{
 const context=fakeContext(),sound=new GameSounds(()=>context);sound.sand();assert.equal(sound.nodes.size,0);sound.unlock();sound.sand();assert.equal(sound.nodes.size,2);assert.ok(context.events.filter(e=>e.action==='stop').every(e=>e.time<10.2));sound.stop();assert.equal(sound.nodes.size,0);sound.enabled=false;sound.sand();assert.equal(sound.nodes.size,0);
});

test('four instruments produce distinct voices and obey mute, invalid-note and stop controls',()=>{const context=fakeContext(),s=new GameSounds(()=>context);assert.equal(s.instrument('piano',0),false);s.unlock();const voices=[];for(const kind of ['piano','xylophone','drum','shaker']){const before=context.events.length;assert.equal(s.instrument(kind,2),true);assert.ok(s.nodes.size>=2);voices.push(JSON.stringify(context.events.slice(before).filter(e=>e.action==='set'&&e.value>30).map(e=>e.value)));s.stop();assert.equal(s.nodes.size,0);}assert.equal(new Set(voices).size,4);const starts=context.events.filter(e=>e.action==='start').length;s.enabled=false;assert.equal(s.instrument('piano',0),false);s.enabled=true;assert.equal(s.instrument('unknown',0),false);assert.equal(s.instrument('piano',8),false);assert.equal(context.events.filter(e=>e.action==='start').length,starts);});
