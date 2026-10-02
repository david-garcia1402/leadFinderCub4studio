import {randomUUID} from 'node:crypto';

const messages = {
  invalid:['Revise os campos informados.','Review the supplied fields.'],
  missing:['Registro não encontrado.','Record not found.'],
  stage:['Escolha uma etapa válida do funil.','Choose a valid pipeline stage.'],
  used:['Mova as oportunidades antes de remover uma etapa utilizada.','Move deals before removing a stage that is in use.'],
  capacity:['Limite de registros atingido. Exporte seus dados antes de continuar.','Record limit reached. Export your data before continuing.'],
  date:['Informe uma data válida.','Enter a valid date.'],
  fieldUsed:['Limpe os valores antes de remover ou alterar o tipo de um campo utilizado.','Clear values before removing or changing the type of a field that is in use.'],
};
export function defaultWorkspace(userId, locale = 'pt-BR') {
  const en = locale.startsWith('en');
  return {userId, companyName:'', outreachTemplate:en?'Hi {{contact}}, I am reaching out about {{company}}. Could we arrange a short conversation?':'Olá {{contact}}, gostaria de conversar sobre a {{company}}. Podemos agendar uma breve conversa?', currency:en?'USD':'BRL', stages:[
    {id:'new',name:en?'New leads':'Novos leads',color:'#a9a3e9',kind:'open',probability:10},
    {id:'contacted',name:en?'Contacted':'Contatados',color:'#7bc6df',kind:'open',probability:25},
    {id:'qualified',name:en?'Qualified':'Qualificados',color:'#e2bc72',kind:'open',probability:50},
    {id:'proposal',name:en?'Proposal':'Proposta',color:'#f6a38d',kind:'open',probability:75},
    {id:'won',name:en?'Won':'Ganhos',color:'#86d6a6',kind:'won',probability:100},
    {id:'lost',name:en?'Lost':'Perdidos',color:'#e39baf',kind:'lost',probability:0}
  ], customFields:[]};
}

export function createCRM(store, locale = 'pt-BR') {
  const en = locale.startsWith('en');
  const fail = (key='invalid', status=400) => {throw Object.assign(new Error(messages[key][en?1:0]),{status});};
  const text = (value, max=200, required=false) => {
    if (value != null && typeof value !== 'string') fail();
    const result = String(value ?? '').trim();
    if (result.length>max || (required&&!result)) fail();
    return result;
  };
  const amount = value => {
    const result = Number(value ?? 0);
    if (!Number.isFinite(result) || result<0 || result>1e9) fail();
    return Math.round(result*100)/100;
  };
  const date = (value, required=false) => {
    if (!value && !required) return null;
    if (typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) fail('date');
    return new Date(value).toISOString();
  };
  const url = value => {
    const result=text(value,2000);
    if (!result) return '';
    try {const parsed=new URL(result);if (!['http:','https:'].includes(parsed.protocol) || parsed.username || parsed.password) fail();} catch {fail();}
    return result;
  };
  const own = (data, collection, userId, id) => {
    const result=data[collection].find(row=>row.userId===userId&&row.id===id);
    if (!result) fail('missing',404);
    return result;
  };
  const workspace = (data,userId) => data.workspaces.find(row=>row.userId===userId) || defaultWorkspace(userId,locale);
  const stageFor = (settings,id) => settings.stages.find(stage=>stage.id===id) || fail('stage');
  function customValues(value,settings) {
    if (!value) return {};
    if (typeof value!=='object'||Array.isArray(value)) fail();
    const result={};
    for (const field of settings.customFields) {
      if (value[field.id]==null||value[field.id]==='') continue;
      if (field.type==='number') {const n=Number(value[field.id]);if (!Number.isFinite(n)||Math.abs(n)>1e9) fail();result[field.id]=n;}
      else {result[field.id]=text(value[field.id],500);if(field.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(result[field.id])||!Number.isFinite(Date.parse(result[field.id]))||new Date(result[field.id]).toISOString().slice(0,10)!==result[field.id]))fail('date');}
    }
    return result;
  }
  function fields(input,settings,existing) {
    const stageId=input.stageId ?? existing?.stageId ?? settings.stages[0].id;
    const stage=stageFor(settings,stageId);
    const tags=input.tags ?? existing?.tags ?? [];
    if (!Array.isArray(tags)||tags.length>20) fail();
    const email=text(input.email ?? existing?.email,160);
    if (email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail();
    const closed = stage.kind!=='open';
    return {
      name:text(input.name ?? existing?.name,160,true), category:text(input.category ?? existing?.category,160),
      contactName:text(input.contactName ?? existing?.contactName,160), email,
      phone:text(input.phone ?? existing?.phone,80), website:url(input.website ?? existing?.website),
      address:text(input.address ?? existing?.address,500), source:text(input.source ?? existing?.source,120),
      sourceId:text(input.sourceId ?? existing?.sourceId,300), sourceUrl:url(input.sourceUrl ?? existing?.sourceUrl),
      notes:text(input.notes ?? existing?.notes,10000), value:amount(input.value ?? existing?.value),
      stageId, tags:[...new Set(tags.map(tag=>text(tag,40,true)))],
      customValues:customValues(input.customValues ?? existing?.customValues,settings),
      closedAt:closed ? (existing?.stageId===stageId&&existing.closedAt ? existing.closedAt : new Date().toISOString()) : null,
      archived:existing?.archived || false,
    };
  }
  const addActivity = (data,userId,leadId,type,body) => {
    const row={id:randomUUID(),userId,leadId,type,body,createdAt:new Date().toISOString()};
    data.activities.push(row);return row;
  };
  return {
    snapshot(userId) {
      const data=store.snapshot();
      return {workspace:workspace(data,userId),leads:data.leads.filter(row=>row.userId===userId),activities:data.activities.filter(row=>row.userId===userId),tasks:data.tasks.filter(row=>row.userId===userId)};
    },
    async saveLead(userId,input,id) {
      if (!input||typeof input!=='object'||Array.isArray(input)) fail();
      let result;
      await store.update(data=>{
        const settings=workspace(data,userId);
        let existing=id?own(data,'leads',userId,id):null;
        const sourceId=text(input.sourceId,300);
        if (!existing&&sourceId) existing=data.leads.find(row=>row.userId===userId&&row.sourceId===sourceId);
        // Re-adding a search result never overwrites work already done in the CRM.
        if (existing&&!id) {result={lead:existing,duplicate:true};return;}
        if (!existing&&data.leads.filter(row=>row.userId===userId).length>=20000) fail('capacity');
        const next=fields(input,settings,existing);
        const now=new Date().toISOString();
        if (existing) {
          if (existing.stageId!==next.stageId) addActivity(data,userId,existing.id,'stage',`${stageFor(settings,existing.stageId).name} → ${stageFor(settings,next.stageId).name}`);
          Object.assign(existing,next,{updatedAt:now});result={lead:existing};
        } else {
          const row={...next,id:randomUUID(),userId,createdAt:now,updatedAt:now};
          data.leads.push(row);addActivity(data,userId,row.id,'created',en?'Added to CRM':'Adicionado ao CRM');result={lead:row};
        }
      });return result;
    },
    async archiveLead(userId,id,archived) {
      if (typeof archived!=='boolean') fail();
      let result;
      await store.update(data=>{
        result=own(data,'leads',userId,id);result.archived=archived;result.updatedAt=new Date().toISOString();
        addActivity(data,userId,id,'archive',archived?(en?'Archived':'Arquivado'):(en?'Restored':'Restaurado'));
      });return {lead:result};
    },
    async activity(userId,leadId,input) {
      if (!['note','call','email','whatsapp','meeting'].includes(input?.type)) fail();
      const body=text(input.body,5000,true);let result;
      await store.update(data=>{own(data,'leads',userId,leadId);result=addActivity(data,userId,leadId,input.type,body);});
      return {activity:result};
    },
    async saveTask(userId,input,id) {
      if (!input||typeof input!=='object'||Array.isArray(input)) fail();
      let result;
      await store.update(data=>{
        const existing=id?own(data,'tasks',userId,id):null;
        const leadId=Object.hasOwn(input,'leadId') ? input.leadId : existing?.leadId;
        if (leadId) own(data,'leads',userId,leadId);
        const title=text(input.title ?? existing?.title,200,true);
        const dueAt=date(input.dueAt ?? existing?.dueAt,true);
        const completed=input.completed ?? existing?.completed ?? false;
        if (typeof completed!=='boolean') fail();
        const next={leadId:leadId||null,title,dueAt,completed,completedAt:completed?(existing?.completedAt||new Date().toISOString()):null};
        if (existing) {Object.assign(existing,next);result=existing;}
        else {result={...next,id:randomUUID(),userId,createdAt:new Date().toISOString()};data.tasks.push(result);}
        if (leadId&&completed&&!existing?.wasCompleted) addActivity(data,userId,leadId,'task',`${en?'Completed':'Concluído'}: ${title}`);
        result.wasCompleted=completed;
      });return {task:result};
    },
    async settings(userId,input) {
      if (!input||!Array.isArray(input.stages)||input.stages.length<3||input.stages.length>12) fail();
      const seen=new Set();
      const stages=input.stages.map(stage=>{
        const id=text(stage.id,60,true);if(!/^[a-zA-Z0-9_-]+$/.test(id)||seen.has(id))fail();seen.add(id);
        if (!['open','won','lost'].includes(stage.kind)||!/^#[a-f0-9]{6}$/i.test(stage.color)) fail();
        const probability=Number(stage.probability);if(!Number.isFinite(probability)||probability<0||probability>100)fail();
        return {id,name:text(stage.name,60,true),color:stage.color,kind:stage.kind,probability:stage.kind==='won'?100:stage.kind==='lost'?0:probability};
      });
      if (!['open','won','lost'].every(kind=>stages.some(stage=>stage.kind===kind))||stages[0].kind!=='open')fail();
      const currency=text(input.currency,3,true);if(!['USD','BRL','EUR','GBP','CAD','AUD'].includes(currency))fail();
      if (!Array.isArray(input.customFields)||input.customFields.length>12)fail();
      const ids=new Set();
      const customFields=input.customFields.map(field=>{
        const id=text(field.id,60,true);if(!/^[a-zA-Z0-9_-]+$/.test(id)||ids.has(id)||!['text','number','date'].includes(field.type))fail();ids.add(id);
        return {id,label:text(field.label,60,true),type:field.type};
      });
      const next={userId,companyName:text(input.companyName,100),outreachTemplate:text(input.outreachTemplate,4000),currency,stages,customFields};
      await store.update(data=>{
        const prev=workspace(data,userId);
        if(data.leads.some(lead=>lead.userId===userId&&!stages.some(stage=>stage.id===lead.stageId)))fail('used');
        for(const field of prev.customFields) {
          const replacement=customFields.find(item=>item.id===field.id);
          if((!replacement||replacement.type!==field.type)&&data.leads.some(lead=>lead.userId===userId&&lead.customValues[field.id]!=null&&lead.customValues[field.id]!==''))fail('fieldUsed');
        }
        // Currency changes do not convert historical amounts.
        if(prev.currency!==currency&&data.leads.some(lead=>lead.userId===userId&&lead.value>0))fail();
        for(const lead of data.leads.filter(row=>row.userId===userId)) {
          lead.customValues=customValues(lead.customValues,next);
          if(stageFor(next,lead.stageId).kind==='open')lead.closedAt=null;
          else lead.closedAt ||= new Date().toISOString();
        }
        data.workspaces=data.workspaces.filter(row=>row.userId!==userId);data.workspaces.push(next);
      });return {workspace:next};
    }
  };
}
