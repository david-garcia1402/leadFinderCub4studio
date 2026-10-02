import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore} from '../lib/store.mjs';
import {createCRM,defaultWorkspace} from '../lib/crm.mjs';
import {periodEnd,publicSubscription} from '../lib/plans.mjs';

async function fixture(run){const dir=await mkdtemp(join(tmpdir(),'lf-crm-'));try{const file=join(dir,'data.json'),store=await createStore(file);await run({file,store,crm:createCRM(store)});}finally{await rm(dir,{recursive:true,force:true});}}
test('CRM persists and rejects cross-account edits, activity and tasks',()=>fixture(async({file,store,crm})=>{
 const saved=(await crm.saveLead('alice',{name:'Business A',sourceId:'maps:1',value:125.25,tags:['VIP']})).lead;
 assert.equal(crm.snapshot('bob').leads.length,0);assert.equal(crm.snapshot('bob').activities.length,0);
 for(const action of [()=>crm.saveLead('bob',{name:'Stolen'},saved.id),()=>crm.archiveLead('bob',saved.id,true),()=>crm.activity('bob',saved.id,{type:'call',body:'No access'}),()=>crm.saveTask('bob',{title:'No access',leadId:saved.id,dueAt:new Date().toISOString()})])await assert.rejects(action,error=>error.status===404);
 await crm.activity('alice',saved.id,{type:'call',body:'Contacted decision maker'});await crm.saveTask('alice',{title:'Send proposal',leadId:saved.id,dueAt:new Date().toISOString()});
 const fresh=createCRM(await createStore(file));assert.equal(fresh.snapshot('alice').leads[0].value,125.25);assert.equal(fresh.snapshot('alice').activities.length,2);assert.equal(fresh.snapshot('alice').tasks.length,1);
 const duplicate=await crm.saveLead('alice',{name:'Overwrite',sourceId:'maps:1',value:0});assert.equal(duplicate.duplicate,true);assert.equal(duplicate.lead.name,'Business A');
 const sameSource=await crm.saveLead('bob',{name:'Business B',sourceId:'maps:1'});assert.notEqual(sameSource.lead.id,saved.id);
}));
test('custom stages and fields validate without destroying saved opportunity data',()=>fixture(async({crm})=>{
 let settings=defaultWorkspace('alice');settings.companyName='Agency';settings.customFields=[{id:'budget',label:'Budget',type:'number'},{id:'date',label:'Date',type:'date'}];await crm.settings('alice',settings);
 const item=(await crm.saveLead('alice',{name:'Business',customValues:{budget:1000,date:'2026-10-02'}})).lead;
 await assert.rejects(()=>crm.saveLead('alice',{customValues:{date:'2026-02-31'}},item.id));
 await assert.rejects(()=>crm.settings('alice',{...settings,stages:settings.stages.filter(s=>s.id!=='new')}));
 await assert.rejects(()=>crm.settings('alice',{...settings,customFields:[]}));
 await assert.rejects(()=>crm.settings('alice',{...settings,customFields:[{id:'budget',label:'Budget',type:'text'}]}));
 await crm.saveLead('alice',{customValues:{}},item.id);await crm.settings('alice',{...settings,customFields:[]});
 assert.equal(crm.snapshot('alice').workspace.customFields.length,0);
 await assert.rejects(()=>crm.saveLead('alice',{stageId:'unknown'},item.id));
}));
test('pipeline changes, closures, archive and restore retain their history',()=>fixture(async({crm})=>{
 const item=(await crm.saveLead('alice',{name:'Deal',value:500})).lead;
 const won=(await crm.saveLead('alice',{stageId:'won'},item.id)).lead;assert.ok(won.closedAt);
 const opened=(await crm.saveLead('alice',{stageId:'proposal'},item.id)).lead;assert.equal(opened.closedAt,null);
 await crm.archiveLead('alice',item.id,true);await crm.archiveLead('alice',item.id,false);
 assert.equal(crm.snapshot('alice').leads[0].archived,false);assert.equal(crm.snapshot('alice').activities.length,5);
 const settings=crm.snapshot('alice').workspace;await assert.rejects(()=>crm.settings('alice',{...settings,currency:'USD'}));
}));
test('tasks can be edited, detached, completed and reopened without duplicate history',()=>fixture(async({crm})=>{
 const lead=(await crm.saveLead('alice',{name:'Business'})).lead;
 const task=(await crm.saveTask('alice',{title:'Call',leadId:lead.id,dueAt:new Date().toISOString()})).task;
 await assert.rejects(()=>crm.saveTask('bob',{completed:true},task.id),error=>error.status===404);
 await crm.saveTask('alice',{completed:true},task.id);await crm.saveTask('alice',{completed:true},task.id);
 assert.equal(crm.snapshot('alice').activities.filter(a=>a.type==='task').length,1);
 await crm.saveTask('alice',{completed:false,title:'Call again',dueAt:'2026-11-01T10:00:00Z'},task.id);
 const detached=(await crm.saveTask('alice',{leadId:null},task.id)).task;assert.equal(detached.leadId,null);assert.equal(detached.completedAt,null);assert.equal(detached.title,'Call again');
 await assert.rejects(()=>crm.saveTask('alice',{title:'Bad date',dueAt:'invalid'}));
}));
test('unsafe URLs and invalid money are rejected and failed transactions leave no mutation',()=>fixture(async({store,crm})=>{
 for(const fields of [{website:'javascript:alert(1)'},{website:'https://u:p@example.com'},{value:-1},{value:Infinity},{tags:['x'.repeat(41)]}])await assert.rejects(()=>crm.saveLead('alice',{name:'Invalid',...fields}));
 assert.equal(crm.snapshot('alice').leads.length,0);
 await assert.rejects(()=>store.update(data=>{data.leads.push({id:'bad'});throw new Error('Rejected');}));assert.equal(store.snapshot().leads.length,0);
 await crm.saveLead('alice',{name:'Valid'});assert.equal(crm.snapshot('alice').leads.length,1);
}));
test('paid cycles expire and January 31 renewals do not overflow into March',()=>{
 assert.equal(periodEnd(new Date('2026-01-31T15:30:00Z')),'2026-02-28T15:30:00.000Z');
 const sub={status:'active',planId:'essencial',reserved:40,month:'2026-09',currentPeriodEnd:'2026-10-15T00:00:00Z'};
 assert.equal(publicSubscription(sub,new Date('2026-10-01')).remaining,60);
 assert.equal(publicSubscription(sub,new Date('2026-10-16')).status,'expired');assert.equal(publicSubscription(sub,new Date('2026-10-16')).remaining,0);
});
