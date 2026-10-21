export const SPEECH_LEVELS = [
  {level:1,label:'1 · 很慢',tts:0.65,audio:0.75},
  {level:2,label:'2 · 慢',tts:0.8,audio:0.875},
  {level:3,label:'3 · 標準',tts:0.95,audio:1},
  {level:4,label:'4 · 稍快',tts:1.1,audio:1.125},
  {level:5,label:'5 · 快',tts:1.25,audio:1.25},
];
export function speechLevel(value){const n=Number(value);return Number.isInteger(n)&&n>=1&&n<=5?n:3;}
export function voiceId(voice){return voice.voiceURI||`${voice.lang}|${voice.name}`;}
function matching(voice,language){
  const lang=voice.lang?.replaceAll('_','-').toLowerCase()||'';
  if(language==='en-US')return /^en(?:-|$)/.test(lang);
  if(language==='ja-JP')return /^ja(?:-|$)/.test(lang);
  // Mandarin instructions should not silently switch to Cantonese.
  return /^(?:zh|cmn)(?:-|$)/.test(lang)&&!/(?:-hk|-yue)/.test(lang)&&!/cantonese|廣東|粤语|粵語/i.test(voice.name);
}
function rank(voice,language){
  const name=`${voice.name} ${voice.voiceURI||''}`;
  const lang=voice.lang?.replaceAll('_','-').toLowerCase();
  let score=lang===language.toLowerCase()?100:0;
  if(language==='zh-TW'&&/zh-hant|cmn-tw/.test(lang))score+=100;
  // These labels are hints, not a guarantee of subjective voice quality.
  if(/natural|neural|premium|enhanced|高品質|自然|增強/i.test(name))score+=250;
  if(/google/i.test(name))score+=150;
  if(/desktop/i.test(name))score-=100;
  if(voice.default)score+=5;
  return score;
}
export function availableVoices(voices,language){return voices.filter(v=>matching(v,language)).sort((a,b)=>rank(b,language)-rank(a,language));}
export function chooseVoice(voices,language,selection='auto'){
  const list=availableVoices(voices,language);
  if(selection==='recorded')return null;
  return list.find(v=>voiceId(v)===selection)||list[0]||null;
}

// Each play has a generation and a settled cancellation promise. Replaying or
// navigating away cannot let a late TTS error start the backup audio.
export class LessonSpeech {
  constructor({synth,Utterance,Audio,setTimer=(...args)=>globalThis.setTimeout(...args),clearTimer=timer=>globalThis.clearTimeout(timer)}={}){
    Object.assign(this,{synth,Utterance,Audio,setTimer,clearTimer});
    this.volume=1;this.activeKey='';this.playPromise=null;this.generation=0;this.pending=null;this.audio=null;this.utterance=null;
    this.voices(); // Ask the browser to populate delayed voice lists during startup.
  }
  voices(){try{return this.synth?.getVoices?.()||[];}catch{return [];}}
  setVolume(value){this.volume=Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):1));if(this.audio)this.audio.volume=this.volume;if(this.utterance)this.utterance.volume=this.volume;}
  play(text,options={}){const key=JSON.stringify([text,options.lang,options.clip,options.level,options.selection,this.volume]);if(this.playPromise&&this.activeKey===key)return this.playPromise;const promise=this.playOnce(text,options);this.activeKey=key;this.playPromise=promise;const clear=()=>{if(this.playPromise===promise){this.playPromise=null;this.activeKey='';}};promise.then(clear,clear);return promise;}
  cancel(){this.playPromise=null;this.activeKey='';
    this.generation++;
    this.pending?.(false);
    try{this.synth?.cancel();}catch{}
    try{this.audio?.pause();}catch{}
    this.utterance=null;
  }
  attempt(token,start,timeout){
    return new Promise(resolve=>{
      let settled=false,cleanup=()=>{};
      const finish=ok=>{if(settled)return;settled=true;this.clearTimer(timer);cleanup();if(this.pending===finish)this.pending=null;resolve(Boolean(ok)&&token===this.generation);};
      const timer=this.setTimer(()=>{try{this.synth?.cancel();this.audio?.pause();}catch{}finish(false);},timeout);
      this.pending=finish;
      try{cleanup=start(finish)||(()=>{});}catch{finish(false);}
    });
  }
  async playOnce(text,{lang='en-US',clip,level=3,selection='auto'}={}){
    this.cancel();const token=this.generation;if(this.volume===0)return true;
    const speed=SPEECH_LEVELS[speechLevel(level)-1];
    // Bundled Nanami recordings have consistent loudness across iPad and desktop.
    // An explicitly selected device voice still takes precedence over recordings.
    const voice=lang==='ja-JP'&&selection==='auto'&&clip?null:chooseVoice(this.voices(),lang,selection);
    const timeout=Math.max(15000,Math.ceil(text.length*200/speed.tts));
    if(voice&&this.Utterance&&this.synth?.speak){
      const ok=await this.attempt(token,finish=>{
        const utterance=new this.Utterance(text);this.utterance=utterance;
        utterance.voice=voice;utterance.lang=voice.lang||lang;utterance.rate=speed.tts;utterance.pitch=1;utterance.volume=this.volume;
        utterance.onend=()=>finish(true);utterance.onerror=()=>finish(false);
        this.synth.resume?.();this.synth.speak(utterance);
        return ()=>{utterance.onend=null;utterance.onerror=null;if(this.utterance===utterance)this.utterance=null;};
      },timeout);
      if(ok)return true;
      if(token!==this.generation)return false;
      try{this.synth.cancel();}catch{}
    }
    if(!clip||!this.Audio||token!==this.generation)return false;
    return this.attempt(token,finish=>{
      this.audio??=new this.Audio();const audio=this.audio;
      audio.src=clip;audio.playbackRate=speed.audio;audio.preservesPitch=true;audio.volume=this.volume;
      if('webkitPreservesPitch'in audio)audio.webkitPreservesPitch=true;
      audio.onended=()=>finish(true);audio.onerror=()=>finish(false);
      audio.play().catch(()=>finish(false));
      return ()=>{audio.onended=null;audio.onerror=null;};
    },timeout);
  }
}
