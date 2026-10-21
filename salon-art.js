import {hairPoint,MIN_HAIR_LENGTH} from './salon-model.js';
export function salonToolSVG(tool){
 const body=tool==='scissors'?'<g class="salon-blade salon-blade-left"><circle cx="17" cy="44" r="8" fill="#d5dcd8" stroke="#35525b" stroke-width="4"/><path d="M22 38 43 8q-2 17-14 27Z" fill="#bcc9cc" stroke="#6a8088"/><path d="m26 30 15-20" stroke="#f7fbf9" stroke-width="1.5"/></g><g class="salon-blade salon-blade-right"><circle cx="43" cy="44" r="8" fill="#d5dcd8" stroke="#35525b" stroke-width="4"/><path d="M38 38 17 8q2 17 14 27Z" fill="#cbd5d6" stroke="#6a8088"/><path d="m34 30-15-20" stroke="#fff" stroke-width="1.5"/></g><circle cx="30" cy="28" r="3" fill="#71868b" stroke="#f4f7f4"/>':tool==='comb'?'<path d="M13 13h35v12H13z" fill="#ba8c57"/><path d="M16 22v27m6-27v27m6-27v27m6-27v27m6-27v27m6-27v27" stroke="#8e633b" stroke-width="4" stroke-linecap="round"/>':'<path d="M8 16q0-9 10-9h23v28H18Q8 35 8 25Z" fill="#7c9c95"/><path d="m41 11 13 5v13l-13 4" fill="#4d6e69"/><path d="m22 35 5 21h11l-6-23" fill="#536f6b"/><circle cx="19" cy="21" r="6" fill="none" stroke="#e6ece4" stroke-width="2"/>';
 return `<svg viewBox="0 0 60 60" aria-hidden="true">${body}</svg>`;
}
// Neighbouring locks add coverage; they never erase one another or use unrelated texture strips.
export function drawHairMatte(ctx,state){
 ctx.clearRect(0,0,600,800);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 const style=state.before?{comb:0,blown:false}:state;
 for(const lock of state.hair){
  const length=state.before?1:lock.length;if(length<=MIN_HAIR_LENGTH+.001)continue;const points=Array.from({length:25},(_,i)=>hairPoint(lock,i/24*length,style));
  const width=lock.width*1.2,half=i=>width/2*(i<22?1:1-(i-22)/2*.42);
  const top=points[0],tip=points.at(-1),fade=ctx.createLinearGradient(top.x,top.y,tip.x,tip.y);
  fade.addColorStop(0,'#fff');fade.addColorStop(.94,'#fff');fade.addColorStop(1,'transparent');
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x-half(i),p.y):ctx.moveTo(p.x-half(i),p.y));for(let i=24;i>=0;i--)ctx.lineTo(points[i].x+half(i),points[i].y);ctx.closePath();ctx.fillStyle=fade;ctx.fill();
  for(let i=0;i<6;i++){
   const end=Math.max(.05,length-(i%3)*.008),from=hairPoint(lock,Math.max(0,end-.055),style),to=hairPoint(lock,end,style),offset=(i/5-.5)*width;
   ctx.beginPath();ctx.moveTo(from.x+offset,from.y);ctx.lineTo(to.x+offset*.85,to.y+1.3);ctx.strokeStyle='#ffffff99';ctx.lineWidth=.65;ctx.stroke();
  }
 }
 ctx.restore();
}
export function drawSalonHair(ctx,state,portrait,matte){
 ctx.clearRect(0,0,600,800);ctx.save();
 if(portrait?.naturalWidth&&matte){
  drawHairMatte(matte,state);
  // Sample aligned original hair once, retaining continuous real highlights and strand flow.
  // The matte excludes facial features; only its coverage changes when cutting.
  ctx.drawImage(portrait,0,0,600,800);ctx.globalCompositeOperation='destination-in';ctx.drawImage(matte.canvas,0,0);ctx.restore();return;
 }
 const style=state.before?{comb:0,blown:false}:state;
 for(const lock of state.hair)for(let strand=0;strand<12;strand++){
  const length=state.before?1:lock.length;if(length<=MIN_HAIR_LENGTH+.001)continue;const spread=(strand/11-.5)*lock.width;
  ctx.beginPath();for(let i=0;i<=24;i++){const p=hairPoint(lock,i/24*length,style);if(i)ctx.lineTo(p.x+spread,p.y);else ctx.moveTo(p.x+spread,p.y);}
  ctx.strokeStyle=`hsla(28,24%,${18+strand%6*2}%,.8)`;ctx.lineWidth=.7;ctx.stroke();
 }
 ctx.restore();
}
