// Developer QA only: node scripts/offline-smoke.mjs <Playwright node_modules folder>
import {createRequire} from 'node:module';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createStaticServer} from '../server.mjs';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.argv[2],'playwright'));
const browser=await chromium.launch({headless:true}),results=[];
const out=path.resolve('.local-assets/validation');await fs.mkdir(out,{recursive:true});
try{
  for(const [width,height,prefix] of [[1180,714,'/'],[320,800,'/cut-hair/'],[820,1180,'/cut-hair/']]){
    let stopped=false,broken=false,updated=false;
    const server=createStaticServer(),serve=server.listeners('request')[0];server.removeAllListeners('request');
    server.on('request',(req,res)=>{
      if(stopped){res.writeHead(503);return res.end('Server unavailable');}
      if(broken&&req.url.includes('c7e783075dd32e56.wav')){res.writeHead(404);return res.end();}
      if(updated&&req.url===prefix+'sw.js'){
        fs.readFile('sw.js','utf8').then(text=>{res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-cache'});res.end(text.replace(/const VERSION="[^"]+";/,'const VERSION="qa-next-version";'));});return;
      }
      if(prefix!=='/'&&req.url.startsWith(prefix))req.url='/'+req.url.slice(prefix.length);
      serve(req,res);
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base=`http://127.0.0.1:${server.address().port}${prefix}`;
    const context=await browser.newContext({viewport:{width,height},hasTouch:width!==1180,isMobile:width!==1180});
    await context.addInitScript(()=>{try{localStorage.setItem('cut-hair-settings','{"speechVolume":70,"effectsVolume":0,"motion":false}');}catch{/* about:blank has no storage origin. */}});
    const errors=[];context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
    let page=await context.newPage();
    try{
      // A failed first install must never claim offline readiness or keep a partial pack.
      if(width===320){
        broken=true;await page.goto(base);await page.waitForFunction(()=>document.querySelector('#offline-retry').hidden===false);
        assert.equal(await page.evaluate(()=>navigator.serviceWorker.controller),null);
        assert.deepEqual(await page.evaluate(()=>caches.keys()),[]);
        broken=false;await page.locator('#start').click();await page.locator('#offline-retry').click();
      }else await page.goto(base);
      await page.waitForFunction(()=>document.querySelector('#offline-status').textContent.includes('✓'));
      await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
      // Updating during a haircut must wait; the active worker and canvas stay intact.
      if(width===1180){
        await page.locator('#start').click();await page.locator('.salon-ready').waitFor();
        const before=await page.locator('.salon-hair').evaluate(c=>c.toDataURL());
        updated=true;await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
        await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting);
        assert.equal(await page.locator('.salon-hair').evaluate(c=>c.toDataURL()),before);
        await page.waitForFunction(()=>document.querySelector('#offline-status').textContent.includes('新版已下載'));
        const version=await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return [r.active.state,r.waiting.state];});
        assert.deepEqual(version,['activated','installed']);
      }
      // Fresh page, disconnected browser and unavailable server: no HTTP cache escape.
      stopped=true;await context.setOffline(true);await page.close();page=await context.newPage();
      await page.goto(base+'?from=home-screen');
      await page.waitForFunction(()=>document.querySelector('#offline-status').textContent.includes('✓'));
      await page.locator('#start').click();await page.locator('.salon-ready').waitFor();
      for(const id of ['cat','dog','monkey','nickson']){
        await page.locator(`[data-salon="character"][data-salon-value="${id}"]`).click();
        await page.locator('.salon-ready').waitFor();
        assert.equal(await page.locator('.salon-photo').evaluate(img=>img.complete&&img.naturalWidth>0),true);
        assert.equal(await page.locator('.salon-short-photo').evaluate(img=>img.complete&&img.naturalWidth>0),true);
      }
      await page.locator('[data-salon="style"][data-salon-value="blunt"]').click();
      await page.locator('[data-salon="tool"][data-salon-value="shampoo"]').click();
      await page.locator('[data-salon="zone"][data-salon-value="left"]').click();
      assert.equal(await page.locator('.salon-soapy').count(),1);
      await page.locator('[data-salon="tool"][data-salon-value="dryer"]').click();
      await page.locator('[data-salon="zone"][data-salon-value="left"]').click();
      await page.locator('[data-salon="finish"]').click();
      assert.equal(await page.locator('.salon-finished').isVisible(),true);
      // Verify all WAV bodies, Safari byte ranges and actual offline audio decoding/playback.
      const clips=Object.values(JSON.parse(await fs.readFile('content/salon-audio.json','utf8')).audio);
      for(const clip of clips){
        const result=await page.evaluate(async clip=>{const r=await fetch(clip);return [r.status,(await r.arrayBuffer()).byteLength];},clip);
        assert.deepEqual(result,[200,(await fs.stat(clip)).size]);
      }
      for(const [range,status,length] of [['bytes=0-99',206,100],['bytes=-50',206,50],['bytes=999999999-',416,0],['bytes=0-0,2-2',416,0]]){
        assert.deepEqual(await page.evaluate(async({clip,range})=>{const r=await fetch(clip,{headers:{Range:range}});return [r.status,(await r.arrayBuffer()).byteLength];},{clip:clips[0],range}),[status,length]);
      }
      await page.evaluate(async clip=>{const audio=new Audio(clip);window.__offlineAudio=audio;await audio.play();},clips[0]);
      await page.waitForFunction(()=>window.__offlineAudio.currentTime>.1);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
      await page.screenshot({path:path.join(out,`offline-${width}.png`),fullPage:true});
      await page.reload();await page.locator('#start').waitFor({state:'visible'});assert.equal(await page.locator('#start').isEnabled(),true);
      assert.deepEqual(errors,[]);
      results.push({width,height,prefix,passed:true,freshOfflineLaunch:true,serverUnavailable:true,allCharacters:true,allVoiceClips:true,wavRanges:true,audioPlayback:true,gameplay:true,reload:true,failedInstallRetry:width===320,updateWaits:width===1180,noOverflow:true});
    }finally{await context.close();await new Promise(resolve=>server.close(resolve));}
  }
  await fs.writeFile(path.join(out,'offline-results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
