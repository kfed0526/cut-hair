import {SalonVisit,SalonSession,salonHTML} from './salon.js';
import {LessonSpeech} from './speech.js';
import {GameSounds} from './sounds.js';
import {readSettings,writeSettings,normalizeSettings} from './settings.js';

const root=document.querySelector('#game'),start=document.querySelector('#start'),welcome=document.querySelector('#welcome'),state=new SalonVisit();
let storage;try{storage=window.localStorage;}catch{/* A private browser can still play without saved settings. */}
let settings=readSettings(storage),session=null,started=false,audio={};
const speech=new LessonSpeech({synth:window.speechSynthesis,Utterance:window.SpeechSynthesisUtterance,Audio:window.Audio}),sounds=new GameSounds(),motion=window.matchMedia('(prefers-reduced-motion: reduce)');
root.innerHTML=salonHTML();
function applySettings(){speech.setVolume(settings.speechVolume/100);sounds.setVolume(settings.effectsVolume/100);sounds.enabled=settings.effectsVolume>0;if(session){session.clear();session.reducedMotion=!settings.motion||motion.matches;session.paint();}document.querySelector('#speech-volume').value=settings.speechVolume;document.querySelector('#speech-value').textContent=settings.speechVolume+'%';document.querySelector('#effects-volume').value=settings.effectsVolume;document.querySelector('#effects-value').textContent=settings.effectsVolume+'%';document.querySelector('#speech-speed').value=settings.speed;document.querySelector('#motion').checked=settings.motion;}
function mount(){session=new SalonSession({root,state,reducedMotion:!settings.motion||motion.matches,unlock:()=>sounds.unlock(),say:text=>speech.play(text,{clip:audio[text],lang:'zh-TW',level:settings.speed,selection:'recorded'}),stopAudio:()=>{speech.cancel();sounds.stop();},effect:kind=>sounds.salon(kind)});session.mount();if([...root.querySelectorAll('.salon-photo,.salon-short-photo')].some(image=>image.complete&&!image.naturalWidth))session.photoError();}
applySettings();
start.addEventListener('click',()=>{if(started||document.hidden)return;started=true;welcome.hidden=true;root.inert=false;sounds.unlock();mount();root.querySelector('h1').tabIndex=-1;root.querySelector('h1').focus({preventScroll:true});window.scrollTo(0,0);});
function changeSetting(event){const field=event.target.closest('[data-setting]');if(!field)return;const value=field.type==='checkbox'?field.checked:field.value;settings=normalizeSettings({...settings,[field.dataset.setting]:value});applySettings();document.querySelector('#storage-status').textContent=writeSettings(storage,settings)?'':'這個瀏覽器無法保存設定，本次仍可以玩。';}
document.querySelector('#parent-settings').addEventListener('input',changeSetting);
motion.addEventListener?.('change',applySettings);
document.addEventListener('visibilitychange',()=>{if(document.hidden)session?.pause();});
window.addEventListener('pagehide',()=>{session?.destroy();session=null;state.paused=true;});
window.addEventListener('pageshow',()=>{if(started&&!session)mount();});
document.querySelector('#retry-load').addEventListener('click',()=>location.reload());
try{const response=await fetch('./content/salon-audio.json');if(!response.ok)throw Error('audio manifest');const data=await response.json();if(!data.audio||Object.keys(data.audio).length!==11)throw Error('audio mapping');audio=data.audio;start.disabled=false;start.textContent='✂ 開始剪髮';}catch{document.querySelector('#load-status').textContent='聲音資料載入失敗，請重新載入，或確認本機伺服器已啟動。';document.querySelector('#retry-load').hidden=false;}
