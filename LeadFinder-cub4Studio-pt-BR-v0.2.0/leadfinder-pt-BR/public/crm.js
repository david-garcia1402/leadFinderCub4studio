import {t,locale} from './locale.js';
const $ = id=>document.getElementById(id);
const esc = value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={workspace:{stages:[],customFields:[],currency:locale==='pt-BR'?'BRL':'USD'},leads:[],activities:[],tasks:[]};
let user=null, config={}, connection={}, view='dashboard', leadId=null, taskId=null, settingsDraft=null, searchResults=[], sampleResults=false, searching=false, importing=false;
const money=value=>new Intl.NumberFormat(locale,{style:'currency',currency:state.workspace.currency,maximumFractionDigits:2}).format(value||0);
const date=value=>value?new Intl.DateTimeFormat(locale,{dateStyle:'short',timeStyle:'short'}).format(new Date(value)):'—';
const stage=id=>state.workspace.stages.find(item=>item.id===id);
const lead=id=>state.leads.find(item=>item.id===id);
const activeLeads=()=>state.leads.filter(item=>!item.archived);
const activeTasks=()=>state.tasks.filter(task=>!task.leadId||!lead(task.leadId)?.archived);
const localDay=value=>{const d=new Date(value);return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;};
const today=task=>localDay(task.dueAt)===localDay(new Date());
const overdue=task=>!task.completed&&new Date(task.dueAt)<new Date();
const pendingTasks=()=>activeTasks().filter(task=>!task.completed).sort((a,b)=>a.dueAt.localeCompare(b.dueAt));
async function api(path,method='GET',data) {
  const response=await fetch(path,{method,headers:{'Content-Type':'application/json','X-Cub4-Client':'lead-finder'},...(data!==undefined?{body:JSON.stringify(data)}:{})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||t('error'));return result;
}
function status(message){$('status').textContent=message;}
function styles(){document.querySelectorAll('[data-color]').forEach(node=>node.style.setProperty('--stage-color',node.dataset.color));document.querySelectorAll('[data-percent]').forEach(node=>{node.style.width=node.dataset.percent+'%';});}
function empty(title=t('nothing'),hint=''){return `<div class="empty"><h3>${esc(title)}</h3>${hint?`<p>${esc(hint)}</p>`:''}</div>`;}
function badge(item){return `<span class="tag" data-color="${esc(stage(item.stageId)?.color||'#a9a3e9')}">${esc(stage(item.stageId)?.name||item.stageId)}</span>`;}
function taskRows(tasks){return tasks.length?tasks.map(task=>`<div class="list-row"><div><strong>${task.leadId?`<button class="quiet" data-open="${esc(task.leadId)}">${esc(task.title)}</button>`:esc(task.title)}</strong><small>${esc(lead(task.leadId)?.name||t('general'))}</small><small class="due ${overdue(task)?'overdue':''}">${esc(date(task.dueAt))}${overdue(task)?' · '+t('overdue'):''}</small></div><button type="button" class="quiet" data-task-edit="${esc(task.id)}">${t('edit')}</button><button type="button" class="secondary" data-task-toggle="${esc(task.id)}">${t(task.completed?'reopen':'complete')}</button></div>`).join(''):empty(t('emptyTasks'));}
function activityRows(items){return items.length?items.map(item=>`<div class="timeline"><small>${esc(t(item.type))} · ${esc(date(item.createdAt))}</small><p>${esc(item.body)}</p></div>`).join(''):empty();}
function renderDashboard(){
  const leads=activeLeads();const opened=leads.filter(item=>stage(item.stageId)?.kind==='open');
  const won=leads.filter(item=>stage(item.stageId)?.kind==='won'),lost=leads.filter(item=>stage(item.stageId)?.kind==='lost');
  const tasks=pendingTasks(),due=tasks.filter(today),late=tasks.filter(overdue);
  const metrics=[[t('totalLeads'),leads.length,t('crm')],[t('openValue'),money(opened.reduce((sum,item)=>sum+item.value,0)),opened.length+' '+t('rows')],[t('weighted'),money(opened.reduce((sum,item)=>sum+item.value*(stage(item.stageId)?.probability||0)/100,0)),t('probability')],[t('wonValue'),money(won.reduce((sum,item)=>sum+item.value,0)),t('conversion')+': '+(won.length+lost.length?Math.round(won.length/(won.length+lost.length)*100):0)+'%'],[t('dueToday'),due.length,t('tasks')],[t('overdue'),late.length,t('tasks')]];
  $('metrics').innerHTML=metrics.map(([label,value,hint],i)=>`<article class="metric ${i===5&&late.length?'attention':''}"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(hint)}</span></article>`).join('');
  $('stage-chart').innerHTML=state.workspace.stages.map(s=>{const count=leads.filter(item=>item.stageId===s.id).length;return `<div class="chart-row"><span>${esc(s.name)}</span><div class="chart-track"><div class="chart-fill" data-color="${esc(s.color)}" data-percent="${leads.length?Math.round(count/leads.length*100):0}"></div></div><span>${count}</span></div>`;}).join('');
  $('dashboard-tasks').innerHTML=taskRows(tasks.slice(0,5));
  $('dashboard-activities').innerHTML=activityRows([...state.activities].reverse().slice(0,6));
  $('task-count').textContent=late.length+due.filter(task=>!overdue(task)).length;
}
function nextTask(id){return pendingTasks().find(task=>task.leadId===id);}
function filteredLeads(){const query=$('lead-filter').value.toLowerCase();return state.leads.filter(item=>item.archived===$('archive-filter').checked).filter(item=>!$('stage-filter').value||item.stageId===$('stage-filter').value).filter(item=>[item.name,item.category,item.contactName,item.email,...item.tags].join(' ').toLowerCase().includes(query)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
function renderCRM(){
  const selected=$('stage-filter').value;$('stage-filter').innerHTML=`<option value="">${t('allStages')}</option>`+state.workspace.stages.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('');$('stage-filter').value=selected;
  const leads=filteredLeads();
  $('crm-table').innerHTML=leads.length?`<table><thead><tr>${['business','contact','stage','value','nextTask','tags'].map(key=>`<th>${t(key)}</th>`).join('')}</tr></thead><tbody>${leads.map(item=>`<tr><td><button class="quiet" data-open="${esc(item.id)}">${esc(item.name)}</button><small>${esc(item.category)}</small></td><td>${esc(item.contactName||item.email||item.phone||'—')}<small>${esc(item.contactName?item.email||item.phone:'')}</small></td><td>${badge(item)}</td><td>${money(item.value)}</td><td><small class="due ${nextTask(item.id)&&overdue(nextTask(item.id))?'overdue':''}">${esc(date(nextTask(item.id)?.dueAt))}</small></td><td>${item.tags.map(tag=>`<span class="tag">${esc(tag)}</span>`).join('')}</td></tr>`).join('')}</tbody></table>`:empty(t('emptyCRM'),t('emptyHint'));
}
function renderPipeline(){
  $('pipeline-board').innerHTML=state.workspace.stages.map(s=>{const items=activeLeads().filter(item=>item.stageId===s.id);return `<section class="stage-column" data-stage="${esc(s.id)}" data-color="${esc(s.color)}"><div class="stage-heading">${esc(s.name)}<span class="pill">${items.length}</span></div><span class="stage-amount">${money(items.reduce((sum,item)=>sum+item.value,0))}</span>${items.map(item=>`<article class="deal-card" draggable="true" data-lead="${esc(item.id)}"><button data-open="${esc(item.id)}">${esc(item.name)}</button><p>${esc(item.contactName||item.category||t('noContact'))}</p><div class="deal-value">${money(item.value)}</div>${item.tags.slice(0,3).map(tag=>`<span class="tag">${esc(tag)}</span>`).join('')}<p>${nextTask(item.id)?esc(date(nextTask(item.id).dueAt)):'—'}</p></article>`).join('')}${items.length?'':empty(t('nothing'))}</section>`;}).join('');
}
function renderTasks(){const filter=$('task-filter').value;const items=activeTasks().filter(task=>{if(filter==='all')return true;if(filter==='completed')return task.completed;if(task.completed)return false;return filter==='pending'||filter==='today'&&today(task)||filter==='overdue'&&overdue(task);}).sort((a,b)=>a.dueAt.localeCompare(b.dueAt));$('tasks-list').innerHTML=taskRows(items);}
function render(){
  $('workspace-name').textContent=state.workspace.companyName||'Lead Finder';$('account-email').textContent=user?.email||'';
  $('connection-pill').textContent=config.live?t('connected'):t('connect');
  renderDashboard();renderCRM();renderPipeline();renderTasks();styles();
}
async function refresh(){state=await api('/api/crm');render();}
function setView(next){view=next;document.querySelectorAll('.view').forEach(node=>node.hidden=node.id!=='view-'+next);document.querySelectorAll('.nav-item').forEach(node=>node.classList.toggle('active',node.dataset.view===next));$('page-title').textContent=t(next);if(next==='settings')renderSettings();history.replaceState(null,'','#'+next);}
function requirePaid(){if(!['authorized','active'].includes(user?.subscription?.status)){status(t('planNeeded'));return false;}return true;}
function stageOptions(selected){return state.workspace.stages.map(s=>`<option value="${esc(s.id)}" ${s.id===selected?'selected':''}>${esc(s.name)}</option>`).join('');}
function openLead(id){
  leadId=id||null;const item=id?lead(id):null;if(id&&!item)return;
  if(!id&&!requirePaid())return;
  const fields={name:'name',category:'category',contact:'contactName',email:'email',phone:'phone',website:'website',address:'address',value:'value',notes:'notes'};
  for(const [field,key] of Object.entries(fields))$('lead-'+field).value=item?.[key]??(key==='value'?0:'');
  $('lead-tags').value=(item?.tags||[]).join(', ');$('lead-stage').innerHTML=stageOptions(item?.stageId);
  $('lead-custom-fields').innerHTML=state.workspace.customFields.map(field=>`<label>${esc(field.label)}<input data-custom="${esc(field.id)}" type="${esc(field.type==='text'?'text':field.type)}" value="${esc(item?.customValues?.[field.id]??'')}" ${field.type==='text'?'maxlength="500"':field.type==='number'?'step="any"':''}></label>`).join('');
  $('lead-extra').hidden=!item;$('archive-lead').hidden=!item;$('lead-new-task').hidden=!item;$('archive-lead').textContent=t(item?.archived?'restore':'archive');
  $('lead-history').innerHTML=activityRows(state.activities.filter(activity=>activity.leadId===id).reverse());
  $('outreach-draft').value=(state.workspace.outreachTemplate||'').replaceAll('{{company}}',item?.name||'').replaceAll('{{contact}}',item?.contactName||'');
  $('lead-status').textContent='';$('activity-body').value='';$('lead-dialog').showModal();
}
function openTask(id,editId){if(!requirePaid())return;taskId=editId||null;const task=state.tasks.find(item=>item.id===taskId);$('task-form').reset();$('task-lead').innerHTML=`<option value="">${t('general')}</option>`+activeLeads().map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');$('task-lead').value=task?.leadId||id||'';const d=task?new Date(task.dueAt):new Date(Date.now()+86400000);if(!task)d.setHours(9,0,0,0);$('task-title').value=task?.title||'';$('task-due').value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);$('task-status').textContent='';$('task-dialog').showModal();}
async function mutate(action,node){if(!requirePaid())return;node?.setAttribute('disabled','');try{await action();await refresh();status(t('savedOK'));}catch(error){status(error.message);}finally{node?.removeAttribute('disabled');}}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.view)setView(button.dataset.view);
  if(button.hasAttribute('data-new-lead'))openLead();
  if(button.hasAttribute('data-new-task'))openTask();
  if(button.dataset.open)openLead(button.dataset.open);
  if(button.dataset.close)$(button.dataset.close).close();
  if(button.dataset.taskEdit)openTask(null,button.dataset.taskEdit);
  if(button.dataset.taskToggle){const task=state.tasks.find(item=>item.id===button.dataset.taskToggle);mutate(()=>api('/api/crm/tasks/'+task.id,'PATCH',{completed:!task.completed}),button);}
});
$('lead-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!requirePaid())return;const button=event.submitter;button.disabled=true;
  const item={name:$('lead-name').value,category:$('lead-category').value,contactName:$('lead-contact').value,email:$('lead-email').value,phone:$('lead-phone').value,website:$('lead-website').value,address:$('lead-address').value,value:Number($('lead-value').value),notes:$('lead-notes').value,stageId:$('lead-stage').value,tags:$('lead-tags').value.split(',').map(tag=>tag.trim()).filter(Boolean),customValues:Object.fromEntries([...document.querySelectorAll('[data-custom]')].map(node=>[node.dataset.custom,node.value]))};
  try{await api('/api/crm/leads'+(leadId?'/'+leadId:''),leadId?'PATCH':'POST',item);await refresh();$('lead-dialog').close();status(t('savedOK'));}catch(error){$('lead-status').textContent=error.message;}finally{button.disabled=false;}
});
$('archive-lead').onclick=async()=>{if(!requirePaid())return;const button=$('archive-lead');button.disabled=true;try{await api('/api/crm/leads/'+leadId+'/archive','POST',{archived:!lead(leadId).archived});await refresh();$('lead-dialog').close();}catch(error){$('lead-status').textContent=error.message;}finally{button.disabled=false;}};
$('lead-new-task').onclick=()=>{$('lead-dialog').close();openTask(leadId);};
$('activity-form').addEventListener('submit',async event=>{event.preventDefault();if(!requirePaid())return;event.submitter.disabled=true;try{await api('/api/crm/leads/'+leadId+'/activities','POST',{type:$('activity-type').value,body:$('activity-body').value});await refresh();$('lead-history').innerHTML=activityRows(state.activities.filter(item=>item.leadId===leadId).reverse());$('activity-body').value='';$('lead-status').textContent=t('savedOK');}catch(error){$('lead-status').textContent=error.message;}finally{event.submitter.disabled=false;}});
$('task-form').addEventListener('submit',async event=>{event.preventDefault();if(!requirePaid())return;event.submitter.disabled=true;try{await api('/api/crm/tasks'+(taskId?'/'+taskId:''),taskId?'PATCH':'POST',{title:$('task-title').value,leadId:$('task-lead').value||null,dueAt:new Date($('task-due').value).toISOString()});await refresh();$('task-dialog').close();status(t('savedOK'));}catch(error){$('task-status').textContent=error.message;}finally{event.submitter.disabled=false;}});
$('copy-draft').onclick=async()=>{try{await navigator.clipboard.writeText($('outreach-draft').value);$('lead-status').textContent=t('copied');}catch{$('outreach-draft').select();}};
for(const id of ['lead-filter','stage-filter','archive-filter'])$(id).addEventListener('input',()=>{renderCRM();styles();});$('task-filter').onchange=renderTasks;
let dragged=null;
$('pipeline-board').addEventListener('dragstart',event=>{const card=event.target.closest('[data-lead]');if(card){dragged=card.dataset.lead;event.dataTransfer.setData('text/plain',dragged);}});
$('pipeline-board').addEventListener('dragover',event=>{const column=event.target.closest('[data-stage]');if(column){event.preventDefault();column.classList.add('drag-over');}});
$('pipeline-board').addEventListener('dragleave',event=>event.target.closest('[data-stage]')?.classList.remove('drag-over'));
$('pipeline-board').addEventListener('drop',event=>{event.preventDefault();const column=event.target.closest('[data-stage]');if(column&&dragged&&lead(dragged)){const id=dragged;mutate(()=>api('/api/crm/leads/'+id,'PATCH',{stageId:column.dataset.stage}));}dragged=null;document.querySelectorAll('.drag-over').forEach(node=>node.classList.remove('drag-over'));});
function renderSettings(){settingsDraft=structuredClone(state.workspace);$('workspace-company').value=settingsDraft.companyName;$('workspace-currency').value=settingsDraft.currency;$('outreach-template').value=settingsDraft.outreachTemplate||'';renderEditors();}
function renderEditors(){
  $('stages-editor').innerHTML=settingsDraft.stages.map((s,index)=>`<div class="editor-row" data-stage-index="${index}"><label>${t('stageName')}<input data-setting="name" value="${esc(s.name)}" maxlength="60" required></label><label>${t('color')}<input data-setting="color" type="color" value="${esc(s.color)}"></label><label>${t('kind')}<select data-setting="kind">${['open','won','lost'].map(kind=>`<option value="${kind}" ${kind===s.kind?'selected':''}>${t(kind)}</option>`).join('')}</select></label><label>${t('probability')}<input data-setting="probability" type="number" min="0" max="100" value="${s.probability}" required></label><button class="quiet" type="button" data-remove-stage="${index}">${t('remove')}</button></div>`).join('');
  $('fields-editor').innerHTML=settingsDraft.customFields.map((field,index)=>`<div class="editor-row field" data-field-index="${index}"><label>${t('fieldName')}<input data-field-setting="label" value="${esc(field.label)}" maxlength="60" required></label><label>${t('fieldType')}<select data-field-setting="type">${['text','number','date'].map(type=>`<option value="${type}" ${type===field.type?'selected':''}>${t(type)}</option>`).join('')}</select></label><button class="quiet" type="button" data-remove-field="${index}">${t('remove')}</button></div>`).join('');
}
$('settings-form').addEventListener('input',event=>{if(event.target.dataset.setting){const index=event.target.closest('[data-stage-index]').dataset.stageIndex;settingsDraft.stages[index][event.target.dataset.setting]=event.target.value;}if(event.target.dataset.fieldSetting){const index=event.target.closest('[data-field-index]').dataset.fieldIndex;settingsDraft.customFields[index][event.target.dataset.fieldSetting]=event.target.value;}});
$('settings-form').addEventListener('click',event=>{const button=event.target.closest('button');if(button?.dataset.removeStage!==undefined){settingsDraft.stages.splice(Number(button.dataset.removeStage),1);renderEditors();}if(button?.dataset.removeField!==undefined){settingsDraft.customFields.splice(Number(button.dataset.removeField),1);renderEditors();}});
$('add-stage').onclick=()=>{if(settingsDraft.stages.length>=12)return;settingsDraft.stages.push({id:'stage-'+crypto.randomUUID(),name:t('stage'),color:'#b9acf0',kind:'open',probability:30});renderEditors();};
$('add-field').onclick=()=>{if(settingsDraft.customFields.length>=12)return;settingsDraft.customFields.push({id:'field-'+crypto.randomUUID(),label:t('fieldName'),type:'text'});renderEditors();};
$('settings-form').addEventListener('submit',async event=>{event.preventDefault();await mutate(()=>api('/api/crm/settings','POST',{...settingsDraft,companyName:$('workspace-company').value,currency:$('workspace-currency').value,outreachTemplate:$('outreach-template').value}),event.submitter);});
function renderSearch(){
  const query=$('search-filter').value.toLowerCase(),web=$('website-filter').value;
  const visible=searchResults.map((item,index)=>({item,index})).filter(({item})=>[item.name,item.category,item.address].join(' ').toLowerCase().includes(query)&&(web==='all'||(web==='yes'?!!item.website:!item.website)));
  $('search-count').textContent=visible.length+' / '+searchResults.length;
  $('search-results').innerHTML=visible.length?`<table><thead><tr><th>${t('business')}</th><th>${t('website')}</th><th>${t('phone')}</th><th>CRM</th></tr></thead><tbody>${visible.map(({item,index})=>{const saved=state.leads.some(row=>row.sourceId===item.id);return `<tr><td>${esc(item.name)}<small>${esc(item.category)} · ${esc(item.address)}</small></td><td>${item.website?`<a href="${esc(item.website)}" target="_blank" rel="noopener noreferrer">${t('website')} ↗</a>`:'—'}</td><td>${esc(item.phone||'—')}</td><td><button class="secondary" data-search-save="${index}" ${saved||sampleResults?'disabled':''}>${t(saved?'saved':'saveCRM')}</button></td></tr>`;}).join('')}</tbody></table>`:empty();
}
for(const id of ['search-filter','website-filter'])$(id).addEventListener('input',renderSearch);
function mapsLink(){const link=new URL('https://www.google.com/maps/search/');link.searchParams.set('api','1');link.searchParams.set('query',$('niche').value.trim()+' '+$('location').value.trim());$('maps-search').href=link.toString();}
for(const id of ['niche','location'])$(id).addEventListener('input',mapsLink);mapsLink();
$('search-results').addEventListener('click',async event=>{const button=event.target.closest('[data-search-save]');if(!button||sampleResults)return;await mutate(()=>{const item=searchResults[Number(button.dataset.searchSave)];return api('/api/crm/leads','POST',{name:item.name,category:item.category,phone:item.phone,website:item.website,address:item.address,source:item.source,sourceUrl:item.sourceUrl,sourceId:item.id});},button);renderSearch();});
$('search-form').addEventListener('submit',async event=>{
  event.preventDefault();if(searching)return;if($('mode').value==='live'&&!requirePaid())return;if($('mode').value==='live'&&!config.live){status(t('connectionMissing'));return;}
  searching=true;$('search-button').disabled=true;$('search-status').textContent=t('searching');
  try{let result=await api('/api/search','POST',{niche:$('niche').value,location:$('location').value,limit:$('limit').value,mode:$('mode').value});const job=result.jobId;for(let attempt=0;result.pending&&attempt<36;attempt++){$('search-status').textContent=t('searchPending');await new Promise(resolve=>setTimeout(resolve,5000));result=await api('/api/jobs/'+job);}if(result.pending)throw new Error(t('searchTimeout'));searchResults=result.leads||[];sampleResults=result.demo===true;$('search-status').textContent=sampleResults?t('sampleNote'):searchResults.length+' '+t('rows');renderSearch();user=(await api('/api/me')).user;}catch(error){$('search-status').textContent=error.message;}finally{searching=false;$('search-button').disabled=false;}
});
function csvCell(value){let string=String(value??'');if(/^[\s]*[=+@-]/.test(string))string="'"+string;return '"'+string.replaceAll('"','""')+'"';}
const csvFields=['name','category','contactName','email','phone','website','address','value','stageId','tags','notes','sourceId','customValues'];
$('export').onclick=()=>{const rows=filteredLeads().map(item=>csvFields.map(key=>csvCell(key==='tags'?item.tags.join(', '):key==='customValues'?JSON.stringify(item.customValues):item[key])).join(','));const blob=new Blob(['\ufeff'+csvFields.join(',')+'\r\n'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='leadfinder-crm.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function parseCSV(text){const rows=[];let row=[],value='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(cell=>cell.trim()))rows.push(row);row=[];value='';}else value+=c;}if(quoted)throw new Error(t('invalidCSV'));row.push(value);if(row.some(cell=>cell.trim()))rows.push(row);const headers=rows.shift()?.map(cell=>cell.replace(/^\ufeff/,'').trim());if(!headers?.includes('name')||rows.length>100)throw new Error(t('invalidCSV'));return rows.map(row=>Object.fromEntries(headers.map((header,index)=>[header,row[index]||''])));}
async function importRows(rows){if(!requirePaid()||importing)return;importing=true;let count=0;try{for(const row of rows){const input={};for(const key of csvFields)if(row[key]!==undefined)input[key]=row[key];input.tags=Array.isArray(input.tags)?input.tags:String(input.tags||'').split(',').map(tag=>tag.trim()).filter(Boolean);input.value=Number(input.value||0);input.stageId=state.workspace.stages.some(s=>s.id===input.stageId)?input.stageId:state.workspace.stages[0].id;if(typeof input.customValues==='string')input.customValues=JSON.parse(input.customValues||'{}');await api('/api/crm/leads','POST',input);count++;$('import-status').textContent=count+' / '+rows.length;}await refresh();$('import-status').textContent=t('importResult')+': '+count+' '+t('rows');}catch(error){await refresh();$('import-status').textContent=t('importPartial')+' '+count+' '+t('rows')+'. '+error.message;}finally{importing=false;$('import-file').value='';}}
$('import-open').onclick=()=>{if(requirePaid()){$('import-status').textContent='';$('import-dialog').showModal();}};
$('import-file').onchange=async()=>{const file=$('import-file').files[0];if(!file)return;try{if(file.size>1024*1024)throw new Error(t('invalidCSV'));await importRows(parseCSV(await file.text()));}catch(error){$('import-status').textContent=error.message;}};
$('import-legacy').onclick=async()=>{try{const rows=JSON.parse(localStorage.getItem('cub4-prospects')||localStorage.getItem('cub4-leads')||'[]');if(!Array.isArray(rows)||rows.length>100)throw new Error(t('invalidCSV'));await importRows(rows.map(row=>({...row,sourceId:row.id})));}catch(error){$('import-status').textContent=error.message;}};
$('logout').onclick=async()=>{try{await api('/api/auth/logout','POST');location.href='/entrar';}catch(error){status(error.message);}};
async function boot(){
  try{config=await api('/api/config');try{user=(await api('/api/me')).user;}catch{user=null;}
    $('login-gate').hidden=!!user;$('workspace-content').hidden=!user;$('logout').hidden=!user;document.querySelectorAll('[data-new-lead]').forEach(button=>button.hidden=!user);
    if(!user){$('account-email').textContent=t('loginNeeded');status(t('loginHint'));return;}
    connection={connected:config.live};await refresh();$('mode').options[1].disabled=!config.preview;status(['authorized','active'].includes(user.subscription?.status)?(config.live?t('accountHint'):t('connectionMissing')):t('planNeeded'));
    const requested=location.hash.slice(1);setView(['dashboard','discover','crm','pipeline','tasks','settings'].includes(requested)?requested:'dashboard');renderSearch();
  }catch(error){status(error.message);}
}
boot();
