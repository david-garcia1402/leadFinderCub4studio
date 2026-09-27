import {currentMonth,getPlan,isActiveStatus,periodEnd,publicSubscription} from './plans.mjs';
import {newId} from './auth.mjs';
import {billingConfigured,checkoutUrl,createPreapproval,fetchAuthorizedPayment,fetchPayment,fetchPreapproval,mapPreapprovalStatus,parseWebhookPayload,verifyWebhookSignature,webhookSecret} from './mercadopago.mjs';

function subscriptionFor(data, userId) {
  return data.subscriptions.find(item => item.userId === userId) || null;
}

export function createBilling(store, env = process.env) {
  const token = () => String(env.MP_ACCESS_TOKEN || '').trim();
  const origin = () => String(env.APP_ORIGIN || '').replace(/\/$/, '');

  return {
    configured: () => billingConfigured(env),
    publicConfig() {
      return {
        provider: 'mercadopago',
        configured: billingConfigured(env),
        currency: 'BRL'
      };
    },

    statusFor(userId, now = new Date()) {
      return publicSubscription(subscriptionFor(store.snapshot(), userId), now);
    },

    async reserve(userId, limit, now = new Date()) {
      let reserved = null;
      await store.update(data => {
        const sub = subscriptionFor(data, userId);
        const view = publicSubscription(sub, now);
        if (!isActiveStatus(view.status)) throw Object.assign(new Error('Assinatura inativa. Conclua o checkout Mercado Pago para liberar buscas reais.'), {status:402});
        if (view.remaining < limit) throw Object.assign(new Error('Franquia mensal do plano atingida. Aguarde a renovação ou escolha um plano maior.'), {status:402});
        const month = currentMonth(now);
        if (sub.month !== month) {
          sub.month = month;
          sub.reserved = 0;
        }
        sub.reserved += limit;
        reserved = {reserved: sub.reserved, remaining: Math.max(0, view.quota - sub.reserved), quota: view.quota, planId: sub.planId};
      });
      return reserved;
    },

    async startCheckout(user, planId) {
      const plan = getPlan(planId);
      if (!plan) throw Object.assign(new Error('Selecione um plano válido.'), {status:400});
      if (!billingConfigured(env)) throw Object.assign(new Error('Checkout Mercado Pago ainda não configurado. Defina MP_ACCESS_TOKEN no servidor.'), {status:503});
      const appOrigin = origin();
      if (!/^https:\/\//.test(appOrigin)) throw Object.assign(new Error('Defina APP_ORIGIN com a origem HTTPS pública antes de iniciar o checkout.'), {status:503});
      const checkout = {
        id: newId('chk_'),
        userId: user.id,
        planId: plan.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        provider: 'mercadopago',
        preapprovalId: null
      };
      await store.update(data => {
        data.checkouts.push(checkout);
      });
      try {
        const resource = await createPreapproval({
          token: token(),
          planId: plan.id,
          email: user.email,
          origin: appOrigin,
          externalReference: checkout.id,
          idempotencyKey: checkout.id
        });
        const url = checkoutUrl(resource);
        await store.update(data => {
          const row = data.checkouts.find(item => item.id === checkout.id);
          if (row) {
            row.preapprovalId = resource.id ? String(resource.id) : null;
            row.initPoint = url;
          }
        });
        if (!url) throw new Error('O Mercado Pago não devolveu a URL de checkout.');
        return {checkoutId: checkout.id, planId: plan.id, initPoint: url, sandbox: Boolean(resource.sandbox_init_point && !resource.init_point)};
      } catch (error) {
        await store.update(data => {
          const row = data.checkouts.find(item => item.id === checkout.id);
          if (row) row.status = 'failed';
        });
        throw error;
      }
    },

    async handleWebhook({headers, query, body}) {
      const secret = webhookSecret(env);
      if (!secret) throw Object.assign(new Error('Webhook Mercado Pago sem MP_WEBHOOK_SECRET.'), {status:503});
      const parsed = parseWebhookPayload(body, query);
      const valid = verifyWebhookSignature({
        signature: headers['x-signature'],
        requestId: headers['x-request-id'],
        dataId: parsed.dataId || query['data.id'] || query.id,
        secret
      });
      if (!valid) throw Object.assign(new Error('Assinatura do webhook inválida.'), {status:401});
      if (!parsed.dataId) return {ok:true, ignored:true};
      const eventKey = `${parsed.type}:${parsed.dataId}`;
      const already = store.snapshot().events.some(item => item.id === eventKey);
      if (already) return {ok:true, duplicate:true};
      if (!token()) {
        await store.update(data => {
          data.events.push({id:eventKey, type:parsed.type, receivedAt:new Date().toISOString(), pendingFetch:true});
        });
        return {ok:true, queued:true};
      }
      await this.applyProviderEvent(parsed);
      return {ok:true};
    },

    async applyProviderEvent(parsed) {
      const access = token();
      if (parsed.type === 'payment') {
        const payment = await fetchPayment(parsed.dataId, access);
        return this.applyPayment(payment, parsed);
      }
      if (parsed.type === 'subscription_preapproval') {
        const preapproval = await fetchPreapproval(parsed.dataId, access);
        return this.applyPreapproval(preapproval, parsed);
      }
      if (parsed.type === 'subscription_authorized_payment') {
        const invoice = await fetchAuthorizedPayment(parsed.dataId, access);
        return this.applyAuthorizedPayment(invoice, parsed);
      }
      await store.update(data => {
        data.events.push({id:`${parsed.type}:${parsed.dataId}`, type:parsed.type, receivedAt:new Date().toISOString(), ignored:true});
      });
      return {ignored:true};
    },

    async applyPayment(payment, parsed) {
      const reference = String(payment.external_reference || '');
      const approved = String(payment.status || '') === 'approved';
      await store.update(data => {
        rememberEvent(data, parsed);
        const checkout = data.checkouts.find(item => item.id === reference);
        if (checkout) checkout.lastPaymentId = String(payment.id || parsed.dataId);
        if (!approved || !checkout) return;
        checkout.status = 'paid';
        activateSubscription(data, checkout.userId, checkout.planId, {
          preapprovalId: checkout.preapprovalId,
          payerId: payment.payer?.id ? String(payment.payer.id) : null
        });
      });
    },

    async applyPreapproval(preapproval, parsed) {
      const reference = String(preapproval.external_reference || '');
      const status = mapPreapprovalStatus(preapproval.status);
      await store.update(data => {
        rememberEvent(data, parsed);
        const checkout = data.checkouts.find(item => item.id === reference || item.preapprovalId === String(preapproval.id || ''));
        if (checkout) {
          checkout.preapprovalId = String(preapproval.id || checkout.preapprovalId || '');
          checkout.status = status === 'authorized' ? 'authorized' : status;
          if (status === 'authorized') {
            activateSubscription(data, checkout.userId, checkout.planId, {
              preapprovalId: checkout.preapprovalId,
              payerId: preapproval.payer_id ? String(preapproval.payer_id) : null
            });
          } else if (status === 'paused' || status === 'cancelled') {
            const sub = subscriptionFor(data, checkout.userId);
            if (sub && sub.preapprovalId === checkout.preapprovalId) sub.status = status;
          }
        }
      });
    },

    async applyAuthorizedPayment(invoice, parsed) {
      const approved = String(invoice.payment?.status || invoice.status || '') === 'approved';
      const preapprovalId = String(invoice.preapproval_id || '');
      await store.update(data => {
        rememberEvent(data, parsed);
        if (!approved || !preapprovalId) return;
        const checkout = data.checkouts.find(item => item.preapprovalId === preapprovalId);
        const userId = checkout?.userId || data.subscriptions.find(item => item.preapprovalId === preapprovalId)?.userId;
        if (!userId) return;
        const planId = checkout?.planId || subscriptionFor(data, userId)?.planId;
        activateSubscription(data, userId, planId, {preapprovalId, renew:true});
      });
    },

    // Local fixture used only by automated tests — never exposed as an HTTP route.
    async activateForTests(userId, planId) {
      const plan = getPlan(planId);
      if (!plan) throw new Error('Selecione um plano válido.');
      await store.update(data => {
        activateSubscription(data, userId, plan.id, {preapprovalId:'test'});
      });
      return publicSubscription(subscriptionFor(store.snapshot(), userId));
    }
  };
}

function rememberEvent(data, parsed) {
  const id = `${parsed.type}:${parsed.dataId}`;
  if (!data.events.some(item => item.id === id)) {
    data.events.push({id, type:parsed.type, receivedAt:new Date().toISOString()});
  }
}

function activateSubscription(data, userId, planId, extra = {}) {
  const plan = getPlan(planId);
  if (!plan || !userId) return;
  const now = new Date();
  let sub = data.subscriptions.find(item => item.userId === userId);
  if (!sub) {
    sub = {userId, reserved:0, month:currentMonth(now)};
    data.subscriptions.push(sub);
  }
  const renew = extra.renew === true && sub.planId === plan.id && isActiveStatus(sub.status);
  sub.planId = plan.id;
  sub.status = 'authorized';
  sub.preapprovalId = extra.preapprovalId || sub.preapprovalId || null;
  sub.payerId = extra.payerId || sub.payerId || null;
  sub.currentPeriodStart = now.toISOString();
  sub.currentPeriodEnd = periodEnd(now);
  if (!renew) {
    sub.month = currentMonth(now);
    sub.reserved = 0;
  }
}
