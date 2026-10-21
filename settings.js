export const SETTINGS_KEY='cut-hair-settings';
export const DEFAULT_SETTINGS=Object.freeze({speechVolume:100,effectsVolume:60,speed:3,motion:true});
const volume=(value,fallback)=>value!==null&&value!==''&&Number.isFinite(Number(value))?Math.max(0,Math.min(100,Math.round(Number(value)))):fallback;
export function normalizeSettings(value){const s=value&&typeof value==='object'?value:{};return {speechVolume:volume(s.speechVolume,100),effectsVolume:volume(s.effectsVolume,60),speed:Number.isInteger(Number(s.speed))&&Number(s.speed)>=1&&Number(s.speed)<=5?Number(s.speed):3,motion:s.motion!==false};}
export function readSettings(storage){try{return normalizeSettings(JSON.parse(storage.getItem(SETTINGS_KEY)));}catch{return {...DEFAULT_SETTINGS};}}
export function writeSettings(storage,settings){try{storage.setItem(SETTINGS_KEY,JSON.stringify(normalizeSettings(settings)));return true;}catch{return false;}}
