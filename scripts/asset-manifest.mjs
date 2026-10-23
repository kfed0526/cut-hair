import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const paths=fs.readdirSync(root).filter(f=>f!=='sw.js'&&/\.(js|css|html|webmanifest)$/.test(f));
const runtimePortraits=new Set(JSON.parse(fs.readFileSync(path.join(root,'SOURCE.json'))).runtimePortraits);
function walk(dir){for(const item of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const file=dir+'/'+item.name;if(item.isDirectory())walk(file);else if(dir==='content'&&/\.json$/.test(file)||/\.wav$/.test(file)||runtimePortraits.has(file))paths.push(file);}}
walk('content');walk('assets');
for(const icon of ['salon-180.png','salon-192.png','salon-512.png'])paths.push('assets/icons/'+icon);
const files=paths.sort().map(url=>{const data=fs.readFileSync(path.join(root,url));return {url,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};});
const manifest={name:'cut-hair',version:JSON.parse(fs.readFileSync(path.join(root,'package.json'))).version,totalBytes:files.reduce((n,f)=>n+f.bytes,0),files};
fs.writeFileSync(path.join(root,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const template=fs.readFileSync(path.join(root,'scripts/sw-template.txt'),'utf8');
const version=createHash('sha256').update(JSON.stringify(files)+template).digest('hex').slice(0,20);
fs.writeFileSync(path.join(root,'sw.js'),template.replace('__VERSION__',JSON.stringify(version)).replace('__FILES__',JSON.stringify(files.map(file=>file.url))));
console.log(`${files.length} browser assets, ${(manifest.totalBytes/1048576).toFixed(2)} MiB; generated offline worker ${version}.`);
