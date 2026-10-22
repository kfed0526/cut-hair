// Salon progress is pretend play, kept only in this page visit. No photo or learning-record writes.
export const SALON_SIZE={width:600,height:800};
export const SALON_TOOLS=['scissors','comb','dryer'];
export const SALON_ZONES=['left','fringe','right'];
export const SALON_STYLES=['blunt','side-part','asymmetric','fluffy-short'];
export const MIN_HAIR_LENGTH=.28;
function styleLength(style,lock,index,total){
 if(style==='blunt')return lock.zone==='fringe'?.62:.58;
 if(style==='side-part')return lock.zone==='fringe'?Math.round((.42+.36*index/(total-1))*1000)/1000:lock.zone==='left'?.42:.58;
 if(style==='asymmetric')return lock.zone==='fringe'?Math.round((.38+.37*index/(total-1))*1000)/1000:lock.zone==='left'?.34:.78;
 if(style==='fluffy-short')return lock.zone==='fringe'?.44:.38;
 return lock.length;
}
export function createHair(){
 const hair=[];
 for(let i=0;i<32;i++){
  const u=i/31;
  hair.push({id:hair.length,zone:'fringe',root:{x:89+u*421,y:8},bend:{x:96+u*409,y:135},tip:{x:103+u*389,y:272-60*u+2*Math.sin(i*2.3)},length:1,width:19});
 }
 for(const side of ['left','right'])for(let i=0;i<9;i++){
  const sign=side==='left'?-1:1,u=i/8;
  hair.push({id:hair.length,zone:side,root:{x:300+sign*(193+u*39),y:40},bend:{x:300+sign*(194+u*28),y:side==='left'?200:164},tip:{x:300+sign*(184+u*30),y:(side==='left'?312:264)+u*16},length:1,width:15});
 }
 return hair;
}
export function hairPoint(lock,t,state={}){
 const a=1-t,lean=(state.comb||0)*t*t*15,fluff=state.blown?-8*Math.sin(t*Math.PI):0;
 return {x:a*a*lock.root.x+2*a*t*lock.bend.x+t*t*lock.tip.x+lean,y:a*a*lock.root.y+2*a*t*lock.bend.y+t*t*lock.tip.y+fluff};
}
export function nearestHairPoint(lock,x,y,state={}){
 let closest={distance:Infinity,t:0};
 for(let t=MIN_HAIR_LENGTH;t<=lock.length+.001;t+=.025){const point=hairPoint(lock,Math.min(t,lock.length),state),distance=Math.hypot(point.x-x,point.y-y);if(distance<closest.distance)closest={...point,t:Math.min(t,lock.length),distance};}
 return closest;
}
export class SalonVisit{
 constructor(){this.reset();}
 get trimmed(){return this.hair.filter(lock=>lock.length<1).length;}
 get canFinish(){return this.trimmed>0&&!this.paused&&!this.before&&!this.done;}
 get editable(){return !this.paused&&!this.before&&!this.done;}
 reset(){if(this.paused)return false;this.hair=createHair();this.tool='scissors';this.style='';this.comb=0;this.blown=false;this.done=false;this.before=false;this.paused=false;return true;}
 selectTool(tool){if(!this.editable||!SALON_TOOLS.includes(tool)||this.tool===tool)return false;this.tool=tool;return true;}
 cutAt(x,y,radius=23){
  if(!this.editable||this.tool!=='scissors'||![x,y,radius].every(Number.isFinite)||radius<0)return [];
  const removed=[];
  for(const lock of this.hair){const near=nearestHairPoint(lock,x,y,this);if(near.distance>Math.min(radius,35))continue;const length=Math.max(MIN_HAIR_LENGTH,near.t-.05);if(length>=lock.length-.015)continue;removed.push({id:lock.id,point:hairPoint(lock,length,this),from:lock.length,to:length});lock.length=length;}
  if(removed.length)this.style='';return removed;
 }
 useAt(x,y,dx=0){
  if(!this.editable||![x,y,dx].every(Number.isFinite))return false;
  if(!this.hair.some(lock=>nearestHairPoint(lock,x,y,this).distance<40))return false;
  if(this.tool==='comb'){const direction=Math.abs(dx)<2?(x<300?-1:1):Math.sign(dx);if(this.comb===direction)return false;this.comb=direction;this.style='';return true;}
  if(this.tool==='dryer'){if(this.blown)return false;this.blown=true;this.style='';return true;}
  return false;
 }
 applyZone(zone){
  if(!this.editable||!SALON_ZONES.includes(zone))return [];
  const locks=this.hair.filter(lock=>lock.zone===zone);
  if(this.tool==='scissors'){const removed=[];for(const lock of locks){const length=Math.max(MIN_HAIR_LENGTH,lock.length-.22);if(lock.length-length>.01){removed.push({id:lock.id,point:hairPoint(lock,length,this),from:lock.length,to:length});lock.length=length;}}if(removed.length)this.style='';return removed;}
  const lock=locks[Math.floor(locks.length/2)],point=hairPoint(lock,.5,this);return this.useAt(point.x,point.y,zone==='left'?-20:20)?[{point}]:[];
 }
 applyStyle(style){
  if(!this.editable||!SALON_STYLES.includes(style))return [];
  this.style=style;this.comb=['side-part','asymmetric'].includes(style)?1:0;this.blown=style==='fluffy-short';
  const fringe=this.hair.filter(lock=>lock.zone==='fringe'),changed=[];
  for(const lock of this.hair){const from=lock.length,index=fringe.indexOf(lock),to=styleLength(style,lock,index,fringe.length);if(Math.abs(from-to)>.001){lock.length=to;changed.push({id:lock.id,point:hairPoint(lock,to,this),from,to});}}
  return changed;
 }
 finish(){if(!this.canFinish)return false;this.done=true;return true;}
 compare(){if(this.paused)return false;this.before=!this.before;return true;}
}
