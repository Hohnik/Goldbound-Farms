import http from 'node:http';
import {readFileSync} from 'node:fs';
const publicRoot=new URL('./public/',import.meta.url);
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',json:'application/json; charset=utf-8',svg:'image/svg+xml'};
const port=Number(process.env.PORT||4173);
http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return}
 try{
  const url=new URL(req.url,'http://localhost'),name=url.pathname==='/'?'index.html':url.pathname.slice(1);
  if(name.includes('/')||name.includes('..')){res.writeHead(404);res.end();return}
  let body;try{body=readFileSync(new URL(name,publicRoot))}catch{res.writeHead(404);res.end();return}
  res.writeHead(200,{'Content-Type':types[name.split('.').pop()]||'text/plain','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(500);res.end('Request failed')}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://localhost:${port}`));
