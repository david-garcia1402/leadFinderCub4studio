import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {pathToFileURL} from 'node:url';
import {createStore} from '../lib/store.mjs';
import {createAuth} from '../lib/auth.mjs';
import {createBilling} from '../lib/billing.mjs';
import {createSearchBudget} from '../lib/search-budget.mjs';

test('integrated searches use the server key, isolate jobs and enforce a durable global budget',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'lf-managed-')),file=join(dir,'accounts.json');
 const store=await createStore(file),auth=createAuth(store),billing=createBilling(store,{}),users={};
 for(const name of ['alice','bob','unpaid','expired','capped']){
  const user=await auth.register({email:name+'@example.com',password:'test-password'});
  users[name]={id:user.id,cookie:'lf_session='+(await auth.login({email:user.email,password:'test-password'})).token};
  if(name!=='unpaid')await billing.activateForTests(user.id,'essencial');
 }
 await store.update(data=>{data.subscriptions.find(row=>row.userId===users.expired.id).currentPeriodEnd='2020-01-01T00:00:00Z';});
 const mock=join(dir,'mock.mjs'),calls=join(dir,'calls.jsonl');
 await writeFile(mock,`import {appendFile} from 'node:fs/promises';const original=fetch;globalThis.fetch=async(url,options)=>{const parsed=new URL(url);if(parsed.hostname!=='api.outscraper.com')return original(url,options);await appendFile(${JSON.stringify(calls)},JSON.stringify({key:options.headers['X-API-KEY'],path:parsed.pathname})+'\\n');if(parsed.pathname==='/google-maps-search'&&parsed.searchParams.get('query').includes('Plumber'))return Response.json({status:'Pending',id:'provider-job'},{status:202});return Response.json({status:'Success',data:[[{name:'Test business',place_id:'test-place'}]]});};`);
 const env={...process.env,DATA_DIR:dir,HOST:'127.0.0.1',PORT:'4197',APP_ORIGIN:'http://127.0.0.1:4197',ENABLE_LIVE_SEARCH:'true',OUTSCRAPER_API_KEY:'server-secret-key',OUTSCRAPER_RECORD_CAP:'4'};
 let proc;
 const start=async()=>{proc=spawn(process.execPath,['--import',pathToFileURL(mock).href,'server.mjs'],{env,stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{proc.stdout.once('data',resolve);proc.once('error',reject);proc.once('exit',code=>reject(new Error('Server exit '+code)));});};
 const stop=async()=>{if(proc?.exitCode===null&&proc.signalCode===null){const done=once(proc,'exit');proc.kill();await done;}};
 const req=(name,path,method='GET',payload)=>fetch('http://127.0.0.1:4197'+path,{method,signal:AbortSignal.timeout(5000),headers:{'X-Cub4-Client':'lead-finder','Content-Type':'application/json',...(name?{cookie:users[name].cookie}:{})},...(payload?{body:JSON.stringify(payload)}:{})});
 const search={niche:'Dentist',location:'Austin',limit:2,mode:'live'};
 try{
  await start();
  assert.equal((await req(null,'/api/search','POST',search)).status,401);
  for(const name of ['unpaid','expired'])assert.equal((await req(name,'/api/search','POST',search)).status,402);
  assert.equal((await req('alice','/api/integrations/outscraper','POST',{apiKey:'client-key'})).status,404);
  const first=await req('alice','/api/search','POST',search);assert.equal(first.status,200);assert.doesNotMatch(await first.text(),/server-secret-key/);
  const cached=await (await req('alice','/api/search','POST',search)).json();assert.equal(cached.cached,true);assert.equal(cached.quota.remaining,98);
  assert.equal((await req('alice','/api/search','POST',{...search,niche:'Electrician'})).status,429);
  const pending=await (await req('bob','/api/search','POST',{...search,niche:'Plumber'})).json();assert.equal(pending.pending,true);
  const reused=await (await req('bob','/api/search','POST',{...search,niche:'Plumber'})).json();assert.equal(reused.jobId,pending.jobId);assert.equal(reused.quota.remaining,98);
  assert.equal((await req('alice','/api/jobs/'+pending.jobId)).status,404);
  assert.equal((await req('bob','/api/jobs/'+pending.jobId)).status,200);
  assert.equal((await req('capped','/api/search','POST',search)).status,503);
  let disk=await createStore(file);assert.equal(disk.snapshot().providerUsage[0].reserved,4);assert.equal(createBilling(disk,{}).statusFor(users.capped.id).remaining,100);
  await stop();await start();assert.equal((await req('capped','/api/search','POST',search)).status,503);
  const logged=(await readFile(calls,'utf8')).trim().split('\n').map(JSON.parse);
  assert.deepEqual(logged,[{key:'server-secret-key',path:'/google-maps-search'},{key:'server-secret-key',path:'/google-maps-search'},{key:'server-secret-key',path:'/requests/provider-job'}]);
  assert.doesNotMatch(await (await req('alice','/api/config')).text(),/server-secret-key/);
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});

test('budget expiration, explicit renewal and concurrent reservations cannot silently spend',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'lf-budget-'));
 try{
  const store=await createStore(join(dir,'data.json')),auth=createAuth(store),billing=createBilling(store,{});
  const user=await auth.register({email:'budget@example.com',password:'test-password'});await billing.activateForTests(user.id,'essencial');
  const now=new Date(),env={OUTSCRAPER_API_KEY:'server-key',OUTSCRAPER_RECORD_CAP:'10',OUTSCRAPER_BUDGET_START:now.toISOString()};
  const budget=createSearchBudget(store,env);
  const results=await Promise.allSettled([budget.reserve(user.id,10,billing,now),budget.reserve(user.id,10,billing,now)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(billing.statusFor(user.id).reserved,10);
  const reopened=createSearchBudget(await createStore(join(dir,'data.json')),env);await assert.rejects(()=>reopened.reserve(user.id,1,billing,now));
  const old=new Date(now.getTime()-31*86400000).toISOString();const expired=createSearchBudget(store,{...env,OUTSCRAPER_BUDGET_START:old});await assert.rejects(()=>expired.reserve(user.id,1,billing,now));
  assert.equal(billing.statusFor(user.id).reserved,10);
  const renewed=createSearchBudget(store,{...env,OUTSCRAPER_BUDGET_START:new Date(now.getTime()-1000).toISOString()});await renewed.reserve(user.id,1,billing,now);assert.equal(store.snapshot().providerUsage[0].reserved,1);
  assert.equal(createSearchBudget(store,{OUTSCRAPER_API_KEY:'secret',OUTSCRAPER_RECORD_CAP:'oops'}).configured,false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
