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
import {createCredentials} from '../lib/credentials.mjs';

test('paid customers use only their own key for search and polling; rotation, access gates and cached quotas', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lf-byok-http-'));
  const file = join(dir, 'accounts.json');
  const env = {CREDENTIAL_ENCRYPTION_KEY:Buffer.alloc(32, 3).toString('base64')};
  const store = await createStore(file);
  const auth = createAuth(store);
  const billing = createBilling(store, {});
  const credentials = createCredentials(store, env);
  const users = {};
  for (const name of ['alice','bob','unpaid','expired','missing','bob2']) {
    const user = await auth.register({email:name+'@example.com', password:'test-password'});
    users[name] = {user, cookie:'lf_session='+(await auth.login({email:user.email, password:'test-password'})).token};
    if (name !== 'unpaid') await billing.activateForTests(user.id, 'essencial');
    if (name !== 'missing') await credentials.save(user.id, name+'-private-api-key');
  }
  await store.update(data => {data.subscriptions.find(sub => sub.userId === users.expired.user.id).currentPeriodEnd = '2020-01-01T00:00:00Z';});
  // Intercept only provider requests in this subprocess. Never contact a real account.
  const mock = join(dir, 'provider-mock.mjs');
  const calls = join(dir, 'provider-calls.jsonl');
  await writeFile(mock, `
    import {appendFile} from 'node:fs/promises';
    const original = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      if (new URL(url).hostname !== 'api.outscraper.com') return original(url, options);
      const key = options.headers['X-API-KEY'];
      const path = new URL(url).pathname;
      await appendFile(${JSON.stringify(calls)}, JSON.stringify({key,path})+'\\n');
      if (path === '/google-maps-search' && key.startsWith('bob')) return Response.json({status:'Pending',id:'bob-job'}, {status:202});
      return Response.json({status:'Success',data:[[{name:key.startsWith('bob-')?'Bob business':'Alice business',place_id:key.startsWith('bob-')?'bob-place':'alice-place'}]]});
    };
  `);
  const proc = spawn(process.execPath, ['--import', pathToFileURL(mock).href, 'server.mjs'], {env:{...process.env,...env,DATA_DIR:dir,PORT:'4197',HOST:'127.0.0.1',APP_ORIGIN:'http://127.0.0.1:4197',ENABLE_LIVE_SEARCH:'true',OUTSCRAPER_API_KEY:'owner-key-must-never-be-used'}, stdio:['ignore','pipe','pipe']});
  const base = 'http://127.0.0.1:4197';
  let stderr = '';
  proc.stderr.on('data', chunk => {stderr += chunk;});
  const request = (name, path, method='GET', payload, extra={}) => fetch(base+path, {method, signal:AbortSignal.timeout(5000), headers:{'Content-Type':'application/json','X-Cub4-Client':'lead-finder',...(name?{cookie:users[name].cookie}:{}),...extra}, ...(payload?{body:JSON.stringify(payload)}:{})});
  const search = {niche:'Dentist', location:'Austin', limit:2, mode:'live'};
  try {
    await new Promise((resolve,reject) => {
      const timer = setTimeout(() => reject(new Error('Server startup timed out: '+stderr)), 5000);
      proc.stdout.once('data', () => {clearTimeout(timer);resolve();});
      proc.once('error', error => {clearTimeout(timer);reject(error);});
      proc.once('exit', c => {clearTimeout(timer);reject(new Error('Server exited '+c+': '+stderr));});
    });
    assert.equal((await request(null, '/api/integrations/outscraper')).status, 401);
    assert.equal((await request('alice','/api/integrations/outscraper','DELETE',null,{Origin:'https://evil.example'})).status, 403);
    assert.equal((await request(null,'/api/search','POST',search)).status, 401);
    assert.equal((await request('unpaid','/api/search','POST',search)).status, 402);
    assert.equal((await request('expired','/api/search','POST',search)).status, 402);
    assert.equal((await request('missing','/api/search','POST',search)).status, 409);
    assert.equal((await request('alice','/api/search','POST',search)).status, 200);
    const cached = await (await request('alice','/api/search','POST',search)).json();
    assert.equal(cached.cached, true);
    assert.equal(cached.quota.remaining, 98);
    assert.equal((await request('alice','/api/search','POST',{...search,niche:'Plumber'})).status, 429);
    const bob = await (await request('bob','/api/search','POST',search)).json();
    assert.equal(bob.pending, true);
    const sameJob = await (await request('bob','/api/search','POST',search)).json();
    assert.equal(sameJob.jobId, bob.jobId);
    assert.equal(sameJob.quota.remaining, 98);
    assert.equal((await request('alice','/api/jobs/'+bob.jobId)).status, 404);
    const bobResult = await (await request('bob','/api/jobs/'+bob.jobId)).json();
    assert.equal(bobResult.leads[0].name, 'Bob business');
    const loggedCalls = (await readFile(calls, 'utf8')).trim().split('\n').map(JSON.parse);
    assert.deepEqual(loggedCalls, [
      {key:'alice-private-api-key',path:'/google-maps-search'},
      {key:'bob-private-api-key',path:'/google-maps-search'},
      {key:'bob-private-api-key',path:'/requests/bob-job'}
    ]);
    const posted = await request('alice','/api/integrations/outscraper','POST',{apiKey:'replacement-secret-key', userId:users.bob.user.id});
    assert.equal(posted.status, 200);
    assert.doesNotMatch(await posted.text(), /replacement-secret-key|ciphertext/);
    assert.equal((await request('alice','/api/search','POST',search)).status, 429); // Old cache was removed.
    const disk = await createStore(file);
    assert.equal(createCredentials(disk, env).read(users.alice.user.id).apiKey, 'replacement-secret-key');
    assert.equal(createCredentials(disk, env).read(users.bob.user.id).apiKey, 'bob-private-api-key');
    assert.equal((await request('alice','/api/integrations/outscraper','DELETE')).status, 200);
    assert.equal((await request('alice','/api/search','POST',search)).status, 409);
    assert.equal((await (await request('bob','/api/integrations/outscraper')).json()).connected, true);
    assert.doesNotMatch(await (await request('bob','/api/me')).text(), /private-api-key|ciphertext/);
    const pending = await (await request('bob2','/api/search','POST',search)).json();
    assert.equal(pending.pending, true);
    assert.equal((await request('bob2','/api/integrations/outscraper','POST',{apiKey:'rotated-bob2-api-key'})).status, 200);
    assert.equal((await request('bob2','/api/jobs/'+pending.jobId)).status, 404);
    const afterRotation = (await readFile(calls,'utf8')).trim().split('\n').map(JSON.parse);
    assert.deepEqual(afterRotation.at(-1), {key:'bob2-private-api-key',path:'/google-maps-search'});
    assert.equal(afterRotation.length, 4);
  } finally {
    if (proc.exitCode === null && proc.signalCode === null) {
      const exited = once(proc, 'exit');
      proc.kill();
      await exited;
    }
    await rm(dir, {recursive:true, force:true});
  }
});
