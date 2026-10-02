export const PLANS = Object.freeze({
  essencial: {id:'essencial', name:'Essential', amount:9.99, currency:'USD', quota:100, label:'$9.99 USD / month'},
  profissional: {id:'profissional', name:'Professional', amount:19.99, currency:'USD', quota:300, label:'$19.99 USD / month'},
  escala: {id:'escala', name:'Scale', amount:29.99, currency:'USD', quota:600, label:'$29.99 USD / month'}
});

export function getPlan(id) {
  const key=String(id||'').trim().toLowerCase();return PLANS[({essential:'essencial',professional:'profissional',scale:'escala'})[key]||key]||null;
}

export function listPlans() {
  return Object.values(PLANS).map(plan => ({...plan}));
}

export function currentMonth(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function periodEnd(from = new Date()) {
  const end = new Date(from);
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + 1);
  const last = new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate();
  end.setUTCDate(Math.min(day,last));
  return end.toISOString();
}

export function publicSubscription(sub, now = new Date()) {
  if (!sub) return {status:'none', planId:null, quota:0, reserved:0, remaining:0, periodEnd:null};
  const plan = getPlan(sub.planId);
  const expiresAt = Date.parse(sub.currentPeriodEnd || '');
  const status = isActiveStatus(sub.status) && (!Number.isFinite(expiresAt) || expiresAt <= now.getTime()) ? 'expired' : sub.status;
  const reserved = Number(sub.reserved) || 0;
  const quota = plan && isActiveStatus(status) ? plan.quota : 0;
  return {
    status,
    planId: plan ? plan.id : null,
    planName: plan ? plan.name : null,
    quota,
    reserved,
    remaining: Math.max(0, quota - reserved),
    periodEnd: sub.currentPeriodEnd || null,
    provider: sub.provider || null
  };
}

export function isActiveStatus(status) {
  return status === 'authorized' || status === 'active';
}
