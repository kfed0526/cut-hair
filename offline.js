const status=document.querySelector('#offline-status'),retry=document.querySelector('#offline-retry');
let registration,busy=false;
function offerRetry(visible){retry.hidden=!visible;document.querySelector('#welcome-offline-retry').hidden=!visible;}
function show(text){status.textContent=text;document.querySelector('#welcome-offline-status').textContent=text;}
async function check(){
  const worker=navigator.serviceWorker.controller||registration?.active;
  if(!worker)return;
  const result=await new Promise(resolve=>{
    const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve({ready:false});},10000);
    channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data);};
    worker.postMessage({type:'OFFLINE_STATUS'},[channel.port2]);
  });
  if(result.ready){show(registration?.waiting?'✓ 離線準備完成。新版已下載，關閉所有遊戲視窗再開啟即可使用新版。':'✓ 離線準備完成，可以斷網玩。');offerRetry(false);}
  else{show('離線資料尚未備妥，請保持連網並重試下載。');offerRetry(true);}
}
function watch(worker){
  if(!worker)return;
  worker.addEventListener('statechange',()=>{
    if(worker.state==='activated')check().catch(failed);
    if(worker.state==='installed'&&navigator.serviceWorker.controller)show('✓ 離線準備完成。新版已下載，關閉所有遊戲視窗再開啟即可使用新版。');
    if(worker.state==='redundant')failed();
  });
}
function failed(){show('離線下載未完成；目前仍可連網玩。請確認連線與儲存空間，再重試。');offerRetry(true);}
async function prepare(){
  if(busy)return;busy=true;offerRetry(false);show('正在下載離線遊戲、全部角色與語音，請保持連網…');
  try{
    registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
    registration.addEventListener('updatefound',()=>watch(registration.installing));
    watch(registration.installing);
    if(registration.active)await check();
    if(registration.waiting)show('✓ 離線準備完成。新版已下載，關閉所有遊戲視窗再開啟即可使用新版。');
    if(!registration.active&&!registration.installing&&!registration.waiting)await registration.update();
  }catch{failed();}finally{busy=false;}
}
if('serviceWorker' in navigator&&window.isSecureContext){
  navigator.serviceWorker.addEventListener('controllerchange',()=>check().catch(failed));
  retry.addEventListener('click',prepare);
  document.querySelector('#welcome-offline-retry').addEventListener('click',prepare);
  prepare();
}else show('此開啟方式無法保存離線遊戲。iPad 請用 Safari 開啟 HTTPS 網址。');
