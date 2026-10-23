import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const projectRoot=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.wav':'audio/wav','.webp':'image/webp','.png':'image/png'};
export function createStaticServer(root=projectRoot){return http.createServer(async(req,res)=>{try{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
 const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name)),relative=path.relative(root,file);
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||relative.split(/[\\/]/).some(p=>p.startsWith('.')||p==='node_modules')){res.writeHead(403);return res.end();}
 const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Content-Length':data.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch(error){res.writeHead(error instanceof URIError?400:404);res.end('Not found');}});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT)||4176;createStaticServer().listen(port,'0.0.0.0',()=>console.log(`Nickson Salon: http://localhost:${port}`));}
