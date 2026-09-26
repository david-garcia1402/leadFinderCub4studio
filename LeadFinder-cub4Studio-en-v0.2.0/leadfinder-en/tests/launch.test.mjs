import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
test('launch defaults reject fictional data, support landing/workspace and respect configured HTTPS origin', async()=>{
 const proc=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4191',HOST:'127.0.0.1',APP_ORIGIN:'https://leadfinder.example',ENABLE_SAMPLE_DATA:'false',ENABLE_LIVE_SEARCH:'false'},stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{proc.stdout.once('data',resolve);proc.once('error',reject);proc.once('exit',c=>reject(new Error('Exit '+c)));});
  const base='http://127.0.0.1:4191';
  assert.deepEqual(await (await fetch(base+'/api/config')).json(),{live:false,preview:false});
  for(const route of ['/','/app','/logo.svg','/landing.css','/landing.js'])assert.equal((await fetch(base+route)).status,200);
  const req=mode=>fetch(base+'/api/search',{method:'POST',headers:{'Content-Type':'application/json','X-Cub4-Client':'lead-finder',Origin:'https://leadfinder.example'},body:JSON.stringify({niche:'Dentist',location:'Austin',limit:2,mode})});
  assert.equal((await req('demo')).status,503);
  assert.equal((await req('live')).status,503);
  assert.equal((await req('invalid')).status,400);
  assert.equal((await fetch(base+'/.data/usage.json')).status,404);
 }finally{proc.kill();}
});
