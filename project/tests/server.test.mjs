import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
test('HTTP demo, disabled live mode and static-file boundary',async()=>{
 const proc=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4189',HOST:'127.0.0.1',ENABLE_LIVE_SEARCH:'false'},stdio:['ignore','pipe','pipe']});
 try{await new Promise((resolve,reject)=>{proc.stdout.once('data',resolve);proc.once('error',reject);proc.once('exit',code=>reject(new Error('Server exited '+code)));});
 const base='http://127.0.0.1:4189';
 assert.equal((await (await fetch(base+'/api/config')).json()).live,false);
 const req=mode=>fetch(base+'/api/search',{method:'POST',headers:{'Content-Type':'application/json','X-Cub4-Client':'lead-finder'},body:JSON.stringify({niche:'Dentist',location:'Austin',limit:2,mode})});
 const demo=await (await req('demo')).json();assert.equal(demo.leads.length,2);assert.equal(demo.demo,true);
 assert.equal((await req('live')).status,503);
 assert.equal((await fetch(base+'/.env')).status,404);
 assert.equal((await fetch(base+'/api/search',{method:'POST',headers:{'X-Cub4-Client':'lead-finder',Origin:'https://evil.example'}})).status,403);
 }finally{proc.kill();}
});
