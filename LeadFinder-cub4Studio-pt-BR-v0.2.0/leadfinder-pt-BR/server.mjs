import http from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateSearch,demoLeads} from './lib/leads.mjs';
import {beginSearch,checkSearch} from './lib/outscraper.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const arg=(name)=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};
const port=Number(arg('--port')||process.env.PORT||4173), host=arg('--host')||process.env.HOST||'127.0.0.1';
const preview=process.env.ENABLE_SAMPLE_DATA==='true';
const live=process.env.ENABLE_LIVE_SEARCH==='true'&&!!process.env.OUTSCRAPER_API_KEY;
const cap=Math.max(0,Number(process.env.MAX_MONTHLY_RECORDS||100));
const jobs=new Map(),cache=new Map(); let busy=false,lastLive=0;
await mkdir(root+'.data',{recursive:true});
const month=new Date().toISOString().slice(0,7);
let ledger={month,reserved:0};
try {const old=JSON.parse(await readFile(root+'.data/usage.json','utf8')); if(old.month===month) ledger=old;} catch(e) {if(e.code!=='ENOENT') throw new Error('Usage ledger unreadable; refusing to reset usage.');}
const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"};
const send=(res,status,data)=>{res.writeHead(status,headers);res.end(JSON.stringify(data));};
async function body(req){let text='';for await(const c of req){text+=c;if(text.length>2048)throw new Error('Request too large.');}return JSON.parse(text);}
const server=http.createServer(async(req,res)=>{
 try {
 const url=new URL(req.url,'http://localhost');
 if(req.method==='POST') {
  if(req.headers.origin && req.headers.origin!==(process.env.APP_ORIGIN||`http://${req.headers.host}`))return send(res,403,{error:'Cross-origin requests are not allowed.'});
  if(req.headers['x-cub4-client']!=='lead-finder')return send(res,403,{error:'Invalid client.'});
 }
 if(url.pathname==='/api/config')return send(res,200,{live,preview});
 if(url.pathname==='/api/search'&&req.method==='POST'){
  const b=await body(req),s=validateSearch(b);
  if(b.mode==='demo'){if(!preview)return send(res,503,{error:'Dados ilustrativos desativados. Configure a busca real ou ative os exemplos explicitamente.'});return send(res,200,{leads:demoLeads(s.niche,s.location,s.limit),demo:true});}
  if(b.mode!=='live')return send(res,400,{error:'Selecione uma fonte de busca válida.'});
  if(!live)return send(res,503,{error:'Busca real ainda indisponível. Entre em contato com a cub4Studio.'});
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||req.headers['x-forwarded-for']||req.headers['forwarded'])return send(res,403,{error:'Buscas reais restritas ao uso local até a implementação de autenticação e cobrança por cliente.'});
  const ck=JSON.stringify(s).toLowerCase();if(cache.has(ck))return send(res,200,{...cache.get(ck),cached:true});
  if(busy||Date.now()-lastLive<10000)return send(res,429,{error:'Aguarde antes de iniciar outra busca.'});
  if(ledger.reserved+s.limit>cap)return send(res,402,{error:'Limite mensal local atingido. Confira o consumo no provedor antes de ampliar.'});
  busy=true;lastLive=Date.now();
  try {
   ledger.reserved+=s.limit;await writeFile(root+'.data/usage.json',JSON.stringify(ledger));
   const result=await beginSearch(s,process.env.OUTSCRAPER_API_KEY);
   if(result.pending){const jobId=randomUUID();jobs.set(jobId,{providerId:result.providerId,key:ck,last:0});return send(res,202,{pending:true,jobId});}
   cache.set(ck,result);return send(res,200,result);
  }finally{busy=false;}
 }
 if(url.pathname.startsWith('/api/jobs/')&&req.method==='GET'){
  const job=jobs.get(url.pathname.split('/').pop());if(!job)return send(res,404,{error:'Sessão de busca expirada. Confira o painel do provedor antes de repetir.'});
  if(Date.now()-job.last<5000)return send(res,202,{pending:true});job.last=Date.now();
  const result=await checkSearch(job.providerId,process.env.OUTSCRAPER_API_KEY);
  if(!result.pending){cache.set(job.key,result);jobs.delete(url.pathname.split('/').pop());}return send(res,result.pending?202:200,result);
 }
 const routes={'/app':'public/workspace.html','/landing.css':'public/landing.css','/landing.js':'public/landing.js','/logo.svg':'public/logo.svg','/':'public/index.html','/app.js':'public/app.js','/style.css':'public/style.css','/leads.mjs':'lib/leads.mjs'};
 if(req.method!=='GET'||!routes[url.pathname])return send(res,404,{error:'Not found'});
 const data=await readFile(root+routes[url.pathname]); const ext=url.pathname.split('.').pop();
 res.writeHead(200,{...headers,'Content-Type':ext==='svg'?'image/svg+xml':ext==='png'?'image/png':ext==='css'?'text/css':ext==='js'||ext==='mjs'?'text/javascript':'text/html; charset=utf-8'});res.end(data);
 }catch(e){send(res,400,{error:e.name==='TimeoutError'?'O provedor demorou a responder. Confira seu painel antes de repetir.':e.message||'Não foi possível concluir a solicitação.'});}
});
server.listen(port,host,()=>console.log(`cub4Studio Lead Finder running at http://${host}:${port} | ${live?'live configured':'live unavailable'}`));
