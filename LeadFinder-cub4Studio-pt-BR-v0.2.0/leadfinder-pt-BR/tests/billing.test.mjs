import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../lib/store.mjs';
import {createAuth} from '../lib/auth.mjs';
import {createBilling} from '../lib/billing.mjs';
import {getPlan,listPlans} from '../lib/plans.mjs';
import {parseWebhookPayload,verifyWebhookSignature,webhookManifest} from '../lib/mercadopago.mjs';

test('catalog keeps the proposed BRL plans and quotas', () => {
  assert.equal(getPlan('Profissional').quota, 300);
  assert.deepEqual(listPlans().map(plan => [plan.id, plan.amount, plan.quota]), [
    ['essencial', 51.85, 100],
    ['profissional', 103.75, 300],
    ['escala', 155.65, 600]
  ]);
});

test('webhook signature follows the Mercado Pago manifest', () => {
  const secret = 'test-secret';
  const dataId = 'PAY123ABC';
  const requestId = 'req-1';
  const ts = '1704908010';
  const manifest = webhookManifest({dataId, requestId, ts});
  assert.equal(manifest, 'id:pay123abc;request-id:req-1;ts:1704908010;');
  const v1 = createHmac('sha256', secret).update(manifest).digest('hex');
  assert.equal(verifyWebhookSignature({signature:`ts=${ts},v1=${v1}`, requestId, dataId, secret}), true);
  assert.equal(verifyWebhookSignature({signature:`ts=${ts},v1=${v1}`, requestId, dataId, secret:'other'}), false);
  assert.deepEqual(parseWebhookPayload({type:'payment', data:{id:'99'}}, {}), {type:'payment', dataId:'99', liveMode:false, action:''});
});

test('subscription reserve is per user and blocks inactive accounts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lf-bill-'));
  try {
    const store = await createStore(join(dir, 'accounts.json'));
    const auth = createAuth(store);
    const billing = createBilling(store, {});
    const user = await auth.register({email:'c@example.com', password:'senha-forte'});
    assert.equal(billing.statusFor(user.id).status, 'none');
    await assert.rejects(() => billing.reserve(user.id, 10), /Assinatura inativa/);
    await billing.activateForTests(user.id, 'essencial');
    const first = await billing.reserve(user.id, 40);
    assert.equal(first.remaining, 60);
    await assert.rejects(() => billing.reserve(user.id, 80), /Franquia mensal/);
    const other = await auth.register({email:'d@example.com', password:'senha-forte'});
    await billing.activateForTests(other.id, 'profissional');
    const otherQuota = await billing.reserve(other.id, 25);
    assert.equal(otherQuota.quota, 300);
    assert.equal(billing.statusFor(user.id).remaining, 60);
  } finally {
    await rm(dir, {recursive:true, force:true});
  }
});

test('checkout stays pending until Mercado Pago credentials exist', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lf-chk-'));
  try {
    const store = await createStore(join(dir, 'accounts.json'));
    const auth = createAuth(store);
    const billing = createBilling(store, {});
    const user = await auth.register({email:'e@example.com', password:'senha-forte'});
    assert.equal(billing.configured(), false);
    await assert.rejects(() => billing.startCheckout(user, 'essencial'), /ainda não configurado/);
  } finally {
    await rm(dir, {recursive:true, force:true});
  }
});
