import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SalonVisit,createHair,hairPoint,MIN_HAIR_LENGTH,SALON_STYLES} from '../salon-model.js';
import {SalonSession,salonHTML,SALON_PORTRAIT,SALON_SHORT_PORTRAIT} from '../salon.js';
import {SALON_CUES,salonVoiceTexts,salonCue} from '../salon-voice.js';
import {drawSalonHair,drawHairMatte} from '../salon-art.js';
function fixture(options={}){
 let key=0,visible=true,stops=0;const timers=new Map(),events=new Map(),photoEvents=new Map(),said=[],effects=[];
 const photo={complete:true,naturalWidth:900,addEventListener:(type,fn)=>photoEvents.set(type,fn),removeEventListener:type=>photoEvents.delete(type)};
 const cursor={hidden:true,style:{}},root={addEventListener:(type,fn)=>events.set(type,fn),removeEventListener:type=>events.delete(type),querySelector:s=>s==='.salon-photo'?photo:s==='.salon-short-photo'?options.shortImage||null:s==='.salon-cursor'?cursor:null};
 const session=new SalonSession({root,visible:()=>visible,schedule:(fn,ms)=>{timers.set(++key,{fn,ms});return key;},cancel:id=>timers.delete(id),say:async text=>{said.push(text);return true;},stopAudio:()=>stops++,effect:tool=>effects.push(tool),now:()=>1000,...options});
 session.paint=()=>{};session.paintHair=()=>{};session.photoReady=true;
 return {session,root,photo,cursor,timers,events,photoEvents,said,effects,stops:()=>stops,hide:()=>visible=false,show:()=>visible=true};
}
test('salon starts with deterministic independent hair locks and no persisted progress',()=>{
 const a=new SalonVisit(),b=new SalonVisit();assert.equal(a.hair.length,50);assert.equal(new Set(a.hair.map(h=>h.id)).size,50);assert.deepEqual(a.hair,createHair());a.applyZone('fringe');assert.equal(b.trimmed,0);assert.equal(a.canFinish,true);assert.equal(a.tool,'scissors');assert.equal(a.done,false);
});
test('only game hair hit regions can be cut; face, invalid inputs and oversized radius cannot affect it',()=>{
 const state=new SalonVisit(),before=JSON.stringify(state.hair);for(const [x,y] of [[300,440],[300,580],[NaN,100],[100,Infinity],[-1000,-1000]])assert.deepEqual(state.cutAt(x,y),[]);assert.equal(JSON.stringify(state.hair),before);
 const tip=hairPoint(state.hair[16],.94,state);assert.ok(state.cutAt(tip.x,tip.y).length);assert.ok(state.hair.some(h=>h.length<1));assert.ok(state.hair.every(h=>h.length>=MIN_HAIR_LENGTH));const nearby=state.cutAt(20,20,10000);assert.equal(nearby.length,0);
});
test('repeated zone cutting is bounded and completed style cannot be modified until growth reset',()=>{
 const state=new SalonVisit();assert.equal(state.finish(),false);assert.deepEqual(state.applyZone('constructor'),[]);for(let n=0;n<20;n++)state.applyZone('fringe');assert.ok(state.hair.filter(h=>h.zone==='fringe').every(h=>h.length===MIN_HAIR_LENGTH));assert.deepEqual(state.applyZone('fringe'),[]);
 assert.equal(state.finish(),true);assert.equal(state.finish(),false);assert.deepEqual(state.applyZone('left'),[]);assert.equal(state.selectTool('comb'),false);assert.equal(state.reset(),true);assert.deepEqual(state.hair,createHair());assert.equal(state.done,false);
});
test('blunt fringe preset creates an even, finishable haircut',()=>{
 const state=new SalonVisit(),changed=state.applyStyle('blunt');
 assert.deepEqual(SALON_STYLES,['blunt','side-part','asymmetric','fluffy-short']);
 assert.equal(changed.length,50);assert.equal(state.style,'blunt');assert.equal(state.canFinish,true);
 assert.deepEqual([...new Set(state.hair.filter(h=>h.zone==='fringe').map(h=>h.length))],[.62]);
 assert.equal(state.comb,0);assert.equal(state.blown,false);
});
test('side part preset sweeps a graduated fringe to one side',()=>{
 const state=new SalonVisit();state.applyStyle('side-part');const fringe=state.hair.filter(h=>h.zone==='fringe');
 assert.equal(state.style,'side-part');assert.equal(state.comb,1);assert.equal(state.blown,false);
 assert.equal(fringe[0].length,.42);assert.equal(fringe.at(-1).length,.78);assert.ok(fringe.every((lock,index)=>!index||lock.length>=fringe[index-1].length));
});
test('asymmetric preset leaves the right side visibly longer than the left',()=>{
 const state=new SalonVisit();state.applyStyle('asymmetric');const left=state.hair.filter(h=>h.zone==='left'),right=state.hair.filter(h=>h.zone==='right');
 assert.equal(state.style,'asymmetric');assert.ok(left.every(lock=>lock.length===.34));assert.ok(right.every(lock=>lock.length===.78));
 assert.equal(state.comb,1);assert.equal(state.blown,false);
});
test('fluffy short preset trims every zone and applies blow-dried volume',()=>{
 const state=new SalonVisit();state.applyStyle('fluffy-short');
 assert.equal(state.style,'fluffy-short');assert.equal(state.comb,0);assert.equal(state.blown,true);
 assert.ok(state.hair.filter(h=>h.zone==='fringe').every(lock=>lock.length===.44));
 assert.ok(state.hair.filter(h=>h.zone!=='fringe').every(lock=>lock.length===.38));
});
test('style presets respect completed and paused states, while growth clears the selection',()=>{
 const state=new SalonVisit();state.applyStyle('blunt');state.finish();const finished=JSON.stringify(state.hair);
 assert.deepEqual(state.applyStyle('side-part'),[]);assert.equal(JSON.stringify(state.hair),finished);assert.equal(state.style,'blunt');
 state.reset();assert.equal(state.style,'');state.paused=true;assert.deepEqual(state.applyStyle('fluffy-short'),[]);assert.equal(state.trimmed,0);
});
test('manual scissors and tool adjustments clear the selected preset',()=>{
 const state=new SalonVisit();state.applyStyle('blunt');state.applyZone('left');assert.equal(state.style,'');
 state.applyStyle('side-part');state.selectTool('comb');state.applyZone('left');assert.equal(state.style,'');
});
test('four accessible style cards apply a preset through the salon session',()=>{
 const html=salonHTML();assert.equal((html.match(/data-salon="style"/g)||[]).length,4);
 for(const label of ['齊瀏海','側分','不對稱','蓬鬆短髮'])assert.match(html,new RegExp(label));
 const f=fixture({reducedMotion:true});f.session.action('style','blunt');
 assert.equal(f.session.state.style,'blunt');assert.equal(f.session.state.canFinish,true);assert.equal(f.effects.at(-1),'scissors');
});
test('reapplying a preset repaints when only its styling state needs restoring',()=>{
 const f=fixture({reducedMotion:true});let paints=0;f.session.paint=()=>paints++;
 f.session.action('style','blunt');f.session.action('tool','comb');f.session.action('zone','left');
 assert.equal(f.session.state.style,'');assert.equal(f.session.state.comb,-1);paints=0;
 f.session.action('style','blunt');assert.equal(f.session.state.style,'blunt');assert.equal(f.session.state.comb,0);assert.equal(paints,1);
});
test('comb and dryer affect hair shape, not hair count, photo or completion records',()=>{
 const state=new SalonVisit();assert.equal(state.selectTool('invalid'),false);state.selectTool('comb');const before=state.hair.map(h=>h.length);assert.equal(state.useAt(300,650,20),false);assert.ok(state.applyZone('left').length);assert.equal(state.comb,-1);assert.ok(state.applyZone('right').length);assert.equal(state.comb,1);
 state.selectTool('dryer');assert.ok(state.applyZone('fringe').length);assert.equal(state.blown,true);assert.deepEqual(state.applyZone('fringe'),[]);assert.deepEqual(state.hair.map(h=>h.length),before);assert.equal(state.canFinish,false);
});
test('before comparison and resting reject changes and do not lose current style',()=>{
 const state=new SalonVisit();state.applyZone('left');const before=JSON.stringify(state.hair);state.compare();assert.equal(salonCue(state),SALON_CUES.before);assert.deepEqual(state.applyZone('right'),[]);assert.equal(state.selectTool('dryer'),false);assert.equal(state.finish(),false);state.compare();assert.equal(JSON.stringify(state.hair),before);
 state.paused=true;assert.equal(state.reset(),false);assert.equal(state.compare(),false);assert.deepEqual(state.cutAt(200,200),[]);state.paused=false;assert.equal(state.finish(),true);assert.equal(salonCue(state),SALON_CUES.finished);
});
test('salon pointer tap commits on pointerup, ignores other pointers and releases capture',()=>{
 const f=fixture();let captured=false,releases=0;const target={getBoundingClientRect:()=>({left:0,top:0,width:600,height:800}),setPointerCapture:()=>captured=true,hasPointerCapture:()=>captured,releasePointerCapture:()=>{captured=false;releases++;}};const point=hairPoint(f.session.state.hair[16],.94),event={pointerId:7,clientX:point.x,clientY:point.y,button:0,target:{closest:()=>target},preventDefault(){}};
 f.session.pointerDown(event);assert.equal(f.session.state.trimmed,0);f.session.pointerUp({...event,pointerId:8});assert.equal(captured,true);f.session.pointerUp(event);assert.ok(f.session.state.trimmed>0);assert.equal(captured,false);assert.equal(releases,1);assert.equal(f.cursor.hidden,false);for(const work of [...f.timers.values()])work.fn();assert.equal(f.cursor.hidden,true);const count=f.session.state.trimmed;f.session.pointerUp(event);assert.equal(f.session.state.trimmed,count);
});
test('drag interpolation cuts crossed hair while cancellation stops old or hidden pointer work',()=>{
 const f=fixture(),state=f.session.state;f.session.stroke({x:110,y:260},{x:500,y:260});assert.ok(state.trimmed>20);const before=JSON.stringify(state.hair);f.session.gesture={id:1,target:{hasPointerCapture:()=>false}};f.session.pointerCancel();assert.equal(f.session.gesture,null);f.hide();f.session.stroke({x:140,y:280},{x:400,y:270});assert.equal(JSON.stringify(state.hair),before);
});
test('pause clears pending effects, voice and gestures; returning requires explicit resume',async()=>{
 const f=fixture();f.session.action('zone','fringe');let late=0;f.session.later(()=>late++,650);const old=[...f.timers.values()][0].fn;f.hide();f.session.pause();assert.equal(f.timers.size,0);assert.equal(f.session.state.paused,true);old();assert.equal(late,0);const before=JSON.stringify(f.session.state.hair);f.show();f.session.action('zone','left');assert.equal(JSON.stringify(f.session.state.hair),before);f.session.action('resume');assert.equal(f.session.state.paused,false);old();assert.equal(late,0);f.session.action('zone','left');assert.notEqual(JSON.stringify(f.session.state.hair),before);
});
test('finish is narrated once, growth restores locks, and reduced motion creates no fragments',()=>{
 const f=fixture({reducedMotion:true});f.session.action('zone','fringe');assert.equal(f.timers.size,0);f.session.action('finish');const count=f.effects.length;f.session.action('finish');assert.equal(f.effects.length,count);assert.equal(f.said.filter(t=>t===SALON_CUES.finished).length,1);f.session.action('grow');assert.equal(f.session.state.trimmed,0);assert.equal(f.session.state.done,false);assert.equal(f.said.at(-1),SALON_CUES.grown);
});
test('same replay shares pending voice, while new tool and leaving cancel queued safety speech',async()=>{
 const queued=[],resolve=[];const f=fixture({say:text=>{queued.push(text);return new Promise(r=>resolve.push(r));}});const a=f.session.narrate([SALON_CUES.welcome,SALON_CUES.safety]),b=f.session.narrate([SALON_CUES.welcome,SALON_CUES.safety]);assert.equal(a,b);assert.equal(queued.length,1);f.session.action('tool','comb');resolve[0](true);await Promise.resolve();assert.deepEqual(queued,[SALON_CUES.welcome,SALON_CUES.comb]);f.session.destroy();resolve[1](true);await Promise.resolve();assert.equal(queued.length,2);
});
test('photo errors disable editing, cancel voice/gesture, and stale load cannot revive a destroyed session',()=>{
 const f=fixture();f.session.mount();assert.equal(f.events.size,7);assert.equal(f.photoEvents.size,2);f.session.photoError();assert.equal(f.session.photoReady,false);f.session.action('zone','fringe');assert.equal(f.session.state.trimmed,0);f.session.photoLoad();assert.equal(f.session.photoReady,true);f.session.action('zone','fringe');assert.ok(f.session.state.trimmed);f.session.destroy();assert.equal(f.events.size,0);assert.equal(f.photoEvents.size,0);const before=JSON.stringify(f.session.state.hair);f.session.photoError();f.session.photoLoad();f.session.action('grow');assert.equal(JSON.stringify(f.session.state.hair),before);
});
test('failed audio leaves retry available without disabling silent editing',async()=>{
 const f=fixture({say:async()=>false});assert.equal(await f.session.narrate(),false);assert.equal(f.session.voiceFailed,true);f.session.action('zone','left');assert.ok(f.session.state.trimmed);
});
test('hair rendering clears only the transparent game layer and respects comparison without state mutation',()=>{
 let paths=0,clears=0;const ctx={clearRect:(...r)=>{assert.deepEqual(r,[0,0,600,800]);clears++;},save(){},restore(){},beginPath(){paths++;},moveTo(){},lineTo(){},stroke(){},createLinearGradient:()=>({addColorStop(){}})};
 const state=new SalonVisit();state.applyZone('left');const before=JSON.stringify(state.hair);drawSalonHair(ctx,state);state.before=true;drawSalonHair(ctx,state);assert.equal(paths,50*12*2);assert.equal(clears,2);assert.equal(JSON.stringify(state.hair),before);
 assert.ok(state.hair.filter(h=>h.zone==='fringe').every(h=>h.tip.y<300));
});
test('portrait and every short cue are real local assets, with original photo excluded from offline pack',()=>{
 const mapping=JSON.parse(fs.readFileSync('content/salon-audio.json','utf8')).audio,files=new Set(JSON.parse(fs.readFileSync('asset-manifest.json','utf8')).files.map(f=>f.url));assert.deepEqual(Object.keys(mapping).sort(),salonVoiceTexts().sort());assert.equal(Object.keys(mapping).length,11);
 for(const file of ['salon.js','salon-model.js','salon-art.js','salon-voice.js','salon.css','content/salon-audio.json',SALON_PORTRAIT])assert.ok(files.has(file),file);assert.equal(files.has('assets/characters/nickson-salon-20261020.png'),false);assert.ok(![...files].some(f=>f.includes('S__30883921')));
 const png=fs.readFileSync(SALON_PORTRAIT.replace('.webp','.png'));assert.equal(png.readUInt8(25),6);const webp=fs.readFileSync(SALON_PORTRAIT);assert.equal(webp.toString('ascii',0,4),'RIFF');assert.equal(webp.toString('ascii',8,12),'WEBP');assert.ok(webp[20]&16);
 for(const file of Object.values(mapping)){assert.ok(files.has(file));const wav=fs.readFileSync(file);assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');let fmt,data;for(let i=12;i+8<wav.length;){const type=wav.toString('ascii',i,i+4),size=wav.readUInt32LE(i+4);if(type==='fmt ')fmt=wav.subarray(i+8,i+8+size);if(type==='data')data=wav.subarray(i+8,i+8+size);i+=8+size+size%2;}assert.equal(fmt.readUInt16LE(14),16);const seconds=data.length/fmt.readUInt32LE(8);assert.ok(seconds>.5&&seconds<9);let peak=0;for(let i=0;i+1<data.length;i+=2)peak=Math.max(peak,Math.abs(data.readInt16LE(i)));assert.ok(peak>1000);}
 assert.match(salonHTML(),/data-salon="zone"/);assert.match(salonHTML(),/真的剪刀，要請大人幫忙/);
});

test('stylized salon variants retain source history, transparency and matching canvas registration',()=>{
 const prompts=JSON.parse(fs.readFileSync('assets/salon.prompts.json','utf8')),manifest=JSON.parse(fs.readFileSync('asset-manifest.json','utf8')),files=new Set(manifest.files.map(f=>f.url));
 for(const webp of [SALON_PORTRAIT,SALON_SHORT_PORTRAIT]){
  assert.match(webp,/storybook.*v4\.webp$/);const pngPath=webp.replace(/\.webp$/,'.png'),png=fs.readFileSync(pngPath),encoded=fs.readFileSync(webp);
  assert.equal(png.readUInt8(25),6);assert.ok(encoded[20]&16);assert.ok(files.has(webp));assert.equal(files.has(pngPath),false);
  const asset=prompts.assets.find(a=>a.webp===webp);assert.ok(asset);assert.equal(asset.transparentBackground,true);assert.deepEqual(asset.webpSize,{width:900,height:1200});assert.match(asset.prompt,/fictional|虛構/i);
 }
 assert.equal(prompts.assets.filter(a=>a.webp.includes('storybook')).length,2);
 assert.match(salonHTML(),/繪本動畫角色/);assert.doesNotMatch(salonHTML(),/本人的照片|依 Nickson 照片/);
});

test('aligned photo hair is sampled once and masked continuously, without per-lock texture strips',()=>{
 const images=[];let fills=0,paths=0;const matte={canvas:{kind:'matte'},clearRect(){},save(){},restore(){},beginPath(){paths++;},moveTo(){},lineTo(){},closePath(){},fill(){fills++;},stroke(){},createLinearGradient:()=>({addColorStop(){}})};
 const ctx={clearRect(){},save(){},restore(){},drawImage:(...args)=>images.push(args)},photo={naturalWidth:900,naturalHeight:1201},state=new SalonVisit(),before=JSON.stringify(state.hair);
 drawSalonHair(ctx,state,photo,matte);assert.equal(images.length,2);assert.equal(images[0][0],photo);assert.deepEqual(images[0].slice(1),[0,0,600,800]);assert.equal(images[1][0],matte.canvas);assert.equal(fills,50);assert.equal(paths,50*7);assert.equal(ctx.globalCompositeOperation,'destination-in');assert.equal(JSON.stringify(state.hair),before);
 assert.equal(matte.globalCompositeOperation,undefined);
 const manifest=JSON.parse(fs.readFileSync('asset-manifest.json','utf8'));for(const file of [SALON_PORTRAIT,SALON_SHORT_PORTRAIT])assert.ok(manifest.files.some(f=>f.url===file));assert.ok(!manifest.files.some(f=>f.url==='assets/characters/nickson-salon-short-v2.png'));
 const source=JSON.parse(fs.readFileSync('SOURCE.json','utf8'));assert.equal(source.sourceCommit,'71c56caf661617d64d667550f26ec1df25dc4862');assert.ok(source.runtimePortraits.includes(SALON_PORTRAIT));
});

test('superseded snip feedback and background cancellation cannot hide or revive a newer tool reaction',()=>{
 const f=fixture();f.session.pulse('salon-snipping',180);const stale=[...f.timers.values()][0].fn;f.session.pulse('salon-snipping',180);const current=f.session.jobs.get('salon-snipping');stale();assert.equal(f.session.jobs.get('salon-snipping'),current);assert.equal(f.timers.size,1);f.session.pause();assert.equal(f.session.jobs.size,0);assert.equal(f.timers.size,0);
});

test('matte covers only the hair bands and exposes a genuinely shorter contour after trimming',()=>{
 const collect=state=>{const ends=[];const ctx={clearRect(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo:(x,y)=>ends.push({x,y}),closePath(){},fill(){},stroke(){},createLinearGradient:()=>({addColorStop(){}})};drawHairMatte(ctx,state);return ends;};
 const state=new SalonVisit(),before=collect(state);for(let n=0;n<5;n++)for(const zone of ['left','fringe','right'])state.applyZone(zone);const after=collect(state);
 assert.equal(after.length,0);assert.ok(before.every(p=>p.y<350));state.before=true;assert.deepEqual(collect(state),before);
});

test('a late long-photo load cannot hide a failed short-photo retry, and both layers must be ready',()=>{
 const events=new Map(),shortImage={complete:false,naturalWidth:0,addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
 const f=fixture({shortImage});f.photo.complete=false;f.photo.naturalWidth=0;f.session.mount();assert.equal(f.session.photoReady,false);assert.equal(events.size,2);shortImage.complete=true;events.get('error')();f.photo.complete=true;f.photo.naturalWidth=900;f.photoEvents.get('load')();assert.equal(f.session.photoReady,false);assert.equal(f.session.photoFailed,true);f.session.action('zone','fringe');assert.equal(f.session.state.trimmed,0);
 shortImage.naturalWidth=900;events.get('load')();assert.equal(f.session.photoReady,true);assert.equal(f.session.photoFailed,false);f.session.destroy();assert.equal(events.size,0);
});

test('normal capture release after a tap does not erase the snip reaction; actual lost capture cancels dragging',()=>{
 const f=fixture();f.cursor.hidden=false;f.session.captureLost({pointerId:2});assert.equal(f.cursor.hidden,false);let released=0;f.session.gesture={id:2,target:{hasPointerCapture:()=>true,releasePointerCapture:()=>released++}};f.session.captureLost({pointerId:3});assert.ok(f.session.gesture);f.session.captureLost({pointerId:2});assert.equal(f.session.gesture,null);assert.equal(f.cursor.hidden,true);assert.equal(released,1);
});
