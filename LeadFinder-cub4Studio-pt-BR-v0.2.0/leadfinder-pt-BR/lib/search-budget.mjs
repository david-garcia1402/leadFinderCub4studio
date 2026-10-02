import {createHash} from 'node:crypto';

// A conservative record ceiling: reservations remain counted even when a provider
// call times out, because a timeout does not prove that the provider did no work.
export function createSearchBudget(store, env = process.env) {
  const apiKey=String(env.OUTSCRAPER_API_KEY||'').trim();
  const fingerprint=createHash('sha256').update(apiKey).digest('hex');
  const cap=Number(env.OUTSCRAPER_RECORD_CAP||500);
  const days=Number(env.OUTSCRAPER_BUDGET_DAYS||30);
  const configured=Boolean(apiKey)&&Number.isSafeInteger(cap)&&cap>0&&cap<=1000000&&Number.isSafeInteger(days)&&days>=1&&days<=366;
  const period=String(env.OUTSCRAPER_BUDGET_START||'');
  const start=period ? Date.parse(period) : null;
  const validStart=!period||Number.isFinite(start);
  const failure=()=>Object.assign(new Error('Busca temporariamente indisponível. Entre em contato com o suporte.'),{status:503});
  return {
    configured:configured&&validStart,
    key(){if(!this.configured)throw failure();return {apiKey,version:fingerprint};},
    async reserve(userId,limit,billing,now=new Date()) {
      if(!this.configured)throw failure();
      if(!Number.isSafeInteger(limit)||limit<1||limit>25)throw failure();
      // Customer quota and platform budget are written together in one transaction.
      // A rejected budget never consumes the customer's allowance.
      let result;
      await store.update(data=>{
        const view=billing.statusFor(userId,now);
        if(!['active','authorized'].includes(view.status))throw Object.assign(new Error('Assinatura inativa. Confirme o pagamento para continuar.'),{status:402});
        if(view.remaining<limit)throw Object.assign(new Error('Franquia do plano atingida. Aguarde a renovação ou escolha um plano maior.'),{status:402});
        let budget=data.providerUsage.find(row=>row.provider==='outscraper');
        if(!budget){budget={provider:'outscraper',startedAt:start==null?now.toISOString():new Date(start).toISOString(),reserved:0};data.providerUsage.push(budget);}
        // This is a fixed operator-controlled period, not a calendar-month reset.
        // Renewal is explicit, so a restart or date rollover cannot silently spend.
        if(start!=null&&budget.startedAt!==new Date(start).toISOString()){budget.startedAt=new Date(start).toISOString();budget.reserved=0;}
        const startsAt=Date.parse(budget.startedAt),endsAt=startsAt+days*86400000;
        if(now.getTime()<startsAt||now.getTime()>=endsAt||budget.reserved+limit>cap)throw failure();
        const sub=data.subscriptions.find(row=>row.userId===userId);
        sub.reserved=(Number(sub.reserved)||0)+limit;budget.reserved+=limit;
        result={reserved:sub.reserved,remaining:Math.max(0,view.quota-sub.reserved),quota:view.quota,planId:sub.planId};
      });return result;
    }
  };
}
