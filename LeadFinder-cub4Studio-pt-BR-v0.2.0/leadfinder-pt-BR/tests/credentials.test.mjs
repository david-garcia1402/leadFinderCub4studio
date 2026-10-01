import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../lib/store.mjs';
import {createCredentials} from '../lib/credentials.mjs';

test('customer keys survive restart, remain encrypted and cannot be swapped between users', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lf-keys-'));
  const file = join(dir, 'accounts.json');
  const env = {CREDENTIAL_ENCRYPTION_KEY:Buffer.alloc(32, 7).toString('base64')};
  try {
    const store = await createStore(file);
    const keys = createCredentials(store, env);
    assert.equal(keys.status('a').connected, false);
    await keys.save('a', 'customer-a-private-key');
    await keys.save('b', 'customer-b-private-key');
    assert.equal(keys.read('a').apiKey, 'customer-a-private-key');
    assert.equal(keys.read('b').apiKey, 'customer-b-private-key');
    assert.doesNotMatch(await readFile(file, 'utf8'), /customer-[ab]-private-key/);
    assert.doesNotMatch(JSON.stringify(keys.status('a')), /private-key|ciphertext|tag|iv/);
    const reopened = await createStore(file);
    assert.equal(createCredentials(reopened, env).read('a').apiKey, 'customer-a-private-key');
    assert.throws(() => createCredentials(reopened, {CREDENTIAL_ENCRYPTION_KEY:Buffer.alloc(32, 8).toString('base64')}).read('a'), /indisponível/);
    const rowA = store.snapshot().credentials.find(row => row.userId === 'a');
    const rowB = store.snapshot().credentials.find(row => row.userId === 'b');
    Object.assign(rowB, {...rowA, userId:'b'});
    assert.throws(() => keys.read('b'), /indisponível/);
    const oldVersion = keys.read('a').version;
    await keys.save('a', 'replacement-private-key');
    assert.notEqual(keys.read('a').version, oldVersion);
    await keys.remove('a');
    assert.equal(keys.status('a').connected, false);
    assert.throws(() => keys.read('a'), /Conecte sua chave/);
    assert.equal(createCredentials(await createStore(file), env).status('a').connected, false);
  } finally {
    await rm(dir, {recursive:true, force:true});
  }
});

test('missing or invalid server encryption key fails closed and inputs never appear in errors', async () => {
  const store = {snapshot:() => ({credentials:[]}), update:async () => {throw new Error('unexpected write');}};
  for (const encoded of ['', 'wrong', Buffer.alloc(31).toString('base64')]) {
    const keys = createCredentials(store, {CREDENTIAL_ENCRYPTION_KEY:encoded});
    assert.equal(keys.configured, false);
    await assert.rejects(keys.save('a', 'private-key-value'), /indisponível/);
    assert.throws(() => keys.read('a'), /indisponível/);
  }
  const keys = createCredentials(store, {CREDENTIAL_ENCRYPTION_KEY:Buffer.alloc(32, 1).toString('base64')});
  for (const value of [null, {}, 'short', 'secret with spaces', 'a'.repeat(513), 'secret\nheader']) {
    await assert.rejects(keys.save('a', value), {message:'Cole uma chave do Outscraper válida, sem espaços.'});
  }
});
