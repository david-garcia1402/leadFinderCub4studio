import {csv} from '/leads.mjs';

const $ = id => document.getElementById(id);
const english = !document.documentElement.lang.toLowerCase().startsWith('pt');
const T = english ? {
  results: n => `${n} ${n === 1 ? 'result' : 'results'}`,
  reviews: n => `${n} ${n === 1 ? 'review' : 'reviews'}`,
  visit: 'Visit website ↗', notListed: 'Not listed', unavailable: 'Not available',
  save: '+ Save', saved: '✓ Saved', open: 'Open profile for',
  searchResults: 'Search results', savedTitle: 'Saved prospects',
  labelDiscover: 'Your next opportunities', labelSaved: 'Your shortlist',
  emptyStart: ['A focused list starts here.', 'Run your first search to explore business profiles.'],
  emptySaved: ['No saved prospects yet.', 'Use “Save” on any business to build your shortlist.'],
  emptyFilter: ['No matches for these filters.', 'Adjust the text filter or the website filter.'],
  clearFilters: 'Clear filters', goDiscover: 'Discover leads',
  preparing: 'Preparing your prospect list…', polling: t => `Provider search in progress (${t}). This may take a few minutes.`,
  stillProcessing: 'Search still processing. Check the provider dashboard before starting another search.',
  stopped: 'Stopped waiting. The provider may still finish the search; check your dashboard before repeating it.',
  demoNote: 'Sample results — fictional businesses for demonstration only.',
  liveNote: (n, cached) => `${n} businesses returned. Missing website means not listed in this source, not confirmed absent.${cached ? ' Cached search; no new provider request.' : ''}`,
  savedNote: 'Saved on this browser. Export your shortlist for a portable copy.',
  discoverNote: 'Review public details before outreach.',
  failed: 'Search failed.', offline: 'Local server unavailable. Restart npm run dev.',
  storageError: 'Browser storage is unavailable. Export CSV to keep your list.',
  savedToast: n => `Saved: ${n}`, removedToast: n => `Removed: ${n}`,
  clearConfirm: 'Confirm clearing?', clearList: 'Clear list', cleared: 'Shortlist cleared.',
  copied: 'Copied to clipboard.', copyFail: 'Copy blocked — select the text and copy manually.', copyDraft: 'Copy draft', copiedBtn: 'Copied ✓',
  phoneCopied: 'Phone copied.',
  exported: n => `CSV exported with ${n} ${n === 1 ? 'business' : 'businesses'}.`,
  modeLive: 'Live business search', modeDemo: 'Demo workspace', modeOff: 'Live search unavailable',
  noteLive: 'Searches consume your provider allowance. Enrichment is disabled.',
  noteDemo: 'Demo uses fictional businesses. No provider credits are consumed.',
  optLive: 'Live · Outscraper', optDemo: 'Sample data — fictional',
  find: 'Find leads ↗', searching: 'Searching…',
  invalid: 'Enter a business type and a location with at least 2 characters.',
  dl: {category: 'Category', address: 'Address', phone: 'Public phone', website: 'Website', rating: 'Rating', source: 'Source', retrieved: 'Retrieved'},
  websiteMissing: 'Not listed in source. Verify before making a claim.', phoneMissing: 'Phone not available', noRating: 'No rating',
  call: 'Call', viewSource: 'View source ↗',
  draft: r => `Hi ${r.name} team, I’m with cub4Studio. We build websites that help local businesses present their services and make it easier for customers to get in touch. Would you be open to seeing a relevant example for your business?`
} : {
  results: n => `${n} ${n === 1 ? 'resultado' : 'resultados'}`,
  reviews: n => `${n} ${n === 1 ? 'avaliação' : 'avaliações'}`,
  visit: 'Visitar site ↗', notListed: 'Não listado', unavailable: 'Indisponível',
  save: '+ Salvar', saved: '✓ Salvo', open: 'Abrir perfil de',
  searchResults: 'Resultados da busca', savedTitle: 'Empresas salvas',
  labelDiscover: 'Suas próximas oportunidades', labelSaved: 'Sua lista de prospecção',
  emptyStart: ['Sua lista começa aqui.', 'Faça sua primeira busca para consultar empresas.'],
  emptySaved: ['Nenhuma empresa salva ainda.', 'Use “Salvar” em qualquer empresa para montar sua lista.'],
  emptyFilter: ['Nada encontrado com esses filtros.', 'Ajuste o texto ou o filtro de website.'],
  clearFilters: 'Limpar filtros', goDiscover: 'Buscar empresas',
  preparing: 'Preparando sua lista de empresas…', polling: t => `Busca em andamento no provedor (${t}). Pode levar alguns minutos.`,
  stillProcessing: 'Busca ainda em processamento. Consulte o painel do provedor antes de repetir.',
  stopped: 'Espera interrompida. O provedor pode concluir a busca mesmo assim; confira seu painel antes de repetir.',
  demoNote: 'Resultados ilustrativos — empresas fictícias.',
  liveNote: (n, cached) => `${n} empresas encontradas. Site não listado significa ausência na fonte, não ausência confirmada.${cached ? ' Busca em cache; sem nova consulta ao provedor.' : ''}`,
  savedNote: 'Salvo neste navegador. Exporte sua lista para guardar uma cópia.',
  discoverNote: 'Verifique os dados públicos antes de abordar.',
  failed: 'Não foi possível buscar.', offline: 'Servidor local indisponível. Reinicie npm run dev.',
  storageError: 'Armazenamento do navegador indisponível. Exporte o CSV para guardar a lista.',
  savedToast: n => `Salvo: ${n}`, removedToast: n => `Removido: ${n}`,
  clearConfirm: 'Confirmar limpeza?', clearList: 'Limpar lista', cleared: 'Lista limpa.',
  copied: 'Copiado para a área de transferência.', copyFail: 'Cópia bloqueada — selecione o texto e copie manualmente.', copyDraft: 'Copiar rascunho', copiedBtn: 'Copiado ✓',
  phoneCopied: 'Telefone copiado.',
  exported: n => `CSV exportado com ${n} ${n === 1 ? 'empresa' : 'empresas'}.`,
  modeLive: 'Busca de empresas reais', modeDemo: 'Dados ilustrativos', modeOff: 'Busca real indisponível',
  noteLive: 'Buscas consomem a franquia do provedor. Enriquecimento desativado.',
  noteDemo: 'Exemplos com empresas fictícias. Nenhum crédito do provedor é consumido.',
  optLive: 'Busca real · Outscraper', optDemo: 'Exemplos — fictícios',
  find: 'Buscar empresas ↗', searching: 'Buscando…',
  invalid: 'Informe um segmento e uma cidade com pelo menos 2 caracteres.',
  dl: {category: 'Categoria', address: 'Endereço', phone: 'Telefone público', website: 'Site', rating: 'Avaliação', source: 'Fonte', retrieved: 'Consultado em'},
  websiteMissing: 'Não listado na fonte. Verifique antes de afirmar sua ausência.', phoneMissing: 'Telefone indisponível', noRating: 'Sem nota',
  call: 'Ligar', viewSource: 'Consultar fonte ↗',
  draft: r => `Olá, equipe da ${r.name}! Sou da cub4Studio. Desenvolvemos sites que ajudam empresas a apresentar seus serviços e facilitam o contato dos clientes. Vocês gostariam de conhecer um exemplo relevante para o negócio?`
};

const STORAGE_KEY = 'cub4-prospects';
const state = {results: [], saved: [], view: 'discover', lastDemo: false, searching: false, cancelled: false, website: 'all', detailId: null};
try {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (Array.isArray(stored)) state.saved = stored;
} catch {}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const safeUrl = s => /^https?:\/\//i.test(s || '') ? s : '';
const telHref = phone => 'tel:' + String(phone || '').replace(/[^\d+]/g, '');
const isSaved = id => state.saved.some(s => s.id === id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- toasts ---------- */
function toast(message, kind = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = message;
  $('toasts').append(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => {
    el.classList.remove('in');
    el.addEventListener('transitionend', () => el.remove(), {once: true});
    setTimeout(() => el.remove(), 400);
  }, 3200);
}

/* ---------- animated counters ---------- */
function setCount(el, value) {
  const from = Number(el.dataset.count) || 0;
  el.dataset.count = value;
  if (reducedMotion || from === value || Math.abs(from - value) < 2) { el.textContent = value; return; }
  const start = performance.now(), duration = 420;
  const step = now => {
    const p = Math.min(1, (now - start) / duration), eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (value - from) * eased);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- data ---------- */
function source() { return state.view === 'saved' ? state.saved : state.results; }
function filtersActive() { return $('filter-text').value.trim() !== '' || state.website !== 'all'; }
function visible() {
  const q = $('filter-text').value.trim().toLowerCase();
  const sort = $('sort').value;
  return source()
    .filter(r => !q || `${r.name} ${r.category} ${r.address}`.toLowerCase().includes(q))
    .filter(r => state.website === 'all' || (state.website === 'missing' ? !r.website : !!r.website))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'rating' ? (b.rating || 0) - (a.rating || 0) || b.reviews - a.reviews : b.reviews - a.reviews);
}

function persistSaved(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    state.saved = next;
    return true;
  } catch {
    toast(T.storageError, 'error');
    return false;
  }
}

function toggleSave(id) {
  const r = [...state.results, ...state.saved].find(x => x.id === id);
  if (!r) return;
  const was = isSaved(id);
  const next = was ? state.saved.filter(s => s.id !== id) : [...state.saved, r];
  if (!persistSaved(next)) return;
  toast(was ? T.removedToast(r.name) : T.savedToast(r.name), was ? 'info' : 'success');
  render();
  if (state.detailId === id) syncDetailSave(r);
}

/* ---------- rendering ---------- */
function rowHtml(r) {
  const saved = isSaved(r.id);
  return `<tr data-id="${esc(r.id)}">
    <td data-label="${esc(T.dl.category)}"><button type="button" class="name" data-open="${esc(r.id)}" aria-label="${esc(T.open)} ${esc(r.name)}">${esc(r.name)}</button><small>${esc(r.category || '—')}${r.address ? ' · ' + esc(r.address) : ''}</small></td>
    <td data-label="${esc(T.dl.website)}">${safeUrl(r.website) ? `<a href="${esc(r.website)}" target="_blank" rel="noopener">${T.visit}</a>` : `<span class="tag">${T.notListed}</span>`}</td>
    <td data-label="${esc(T.dl.phone)}">${r.phone ? `<a href="${esc(telHref(r.phone))}" class="phone">${esc(r.phone)}</a>` : `<span class="muted">${T.unavailable}</span>`}</td>
    <td data-label="${esc(T.dl.rating)}">${r.rating ? `<span class="rating">${esc(r.rating)} <i aria-hidden="true">★</i></span>` : '<span class="muted">—</span>'}<small>${T.reviews(r.reviews)}</small></td>
    <td class="td-action"><button type="button" class="save${saved ? ' selected' : ''}" data-save="${esc(r.id)}" aria-pressed="${saved}">${saved ? T.saved : T.save}</button></td>
  </tr>`;
}

function skeletonHtml(n) {
  return Array.from({length: n}, () => `<tr class="skeleton" aria-hidden="true"><td><i></i><i class="short"></i></td><td><i></i></td><td><i></i></td><td><i></i></td><td class="td-action"><i></i></td></tr>`).join('');
}

function renderEmpty(count) {
  const empty = $('empty');
  empty.hidden = count > 0 || state.searching;
  if (!empty.hidden) {
    const hasData = source().length > 0;
    const [title, text] = hasData && filtersActive() ? T.emptyFilter : state.view === 'saved' ? T.emptySaved : T.emptyStart;
    $('empty-title').textContent = title;
    $('empty-text').textContent = text;
    const action = $('empty-action');
    if (hasData && filtersActive()) { action.hidden = false; action.textContent = T.clearFilters; action.dataset.action = 'filters'; }
    else if (state.view === 'saved') { action.hidden = false; action.textContent = T.goDiscover; action.dataset.action = 'discover'; }
    else action.hidden = true;
  }
}

function render() {
  const data = visible();
  if (!state.searching) $('rows').innerHTML = data.map(rowHtml).join('');
  document.querySelector('.table-wrap').hidden = !state.searching && data.length === 0;
  renderEmpty(data.length);
  $('export').disabled = !data.length;
  $('count').textContent = T.results(data.length);
  setCount($('total'), state.results.length);
  setCount($('missing'), state.results.filter(r => !r.website).length);
  setCount($('phones'), state.results.filter(r => r.phone).length);
  setCount($('saved-stat'), state.saved.length);
  const badge = $('saved-count');
  if (badge.textContent !== String(state.saved.length)) {
    badge.textContent = state.saved.length;
    badge.classList.remove('pop');
    void badge.offsetWidth;
    badge.classList.add('pop');
  }
  const savedView = state.view === 'saved';
  $('result-title').textContent = savedView ? T.savedTitle : T.searchResults;
  $('result-label').textContent = savedView ? T.labelSaved : T.labelDiscover;
  $('clear-saved').hidden = !savedView || state.saved.length === 0;
  for (const [id, active] of [['discover', !savedView], ['saved', savedView]]) {
    $(id).classList.toggle('active', active);
    $(id).setAttribute('aria-pressed', String(active));
  }
}

function setView(view) {
  if (state.view === view) return;
  state.view = view;
  resetClearConfirm();
  $('status').textContent = view === 'saved' ? T.savedNote : state.lastDemo ? T.demoNote : T.discoverNote;
  render();
  document.querySelector('.results').scrollIntoView({behavior: reducedMotion ? 'auto' : 'smooth', block: 'start'});
}

/* ---------- search ---------- */
async function api(path, options) {
  const r = await fetch(path, options);
  let b = {};
  try { b = await r.json(); } catch {}
  if (!r.ok) throw new Error(b.error || T.failed);
  return b;
}

function setSearching(on) {
  state.searching = on;
  $('search-form').classList.toggle('busy', on);
  $('search-button').disabled = on || $('mode').selectedOptions[0]?.disabled;
  $('search-button').querySelector('.btn-label').textContent = on ? T.searching : T.find;
  $('mode').disabled = on;
  $('progress').hidden = !on;
  $('cancel-search').hidden = true;
  if (on) {
    $('rows').innerHTML = skeletonHtml(Number($('limit').value) > 10 ? 6 : 4);
    document.querySelector('.table-wrap').hidden = false;
    $('empty').hidden = true;
  }
}

$('search-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (state.searching) return;
  const niche = $('niche').value.trim(), location = $('location').value.trim();
  if (niche.length < 2 || location.length < 2) {
    toast(T.invalid, 'error');
    (niche.length < 2 ? $('niche') : $('location')).focus();
    return;
  }
  state.cancelled = false;
  setSearching(true);
  $('status').textContent = T.preparing;
  try {
    let b = await api('/api/search', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Cub4-Client': 'lead-finder'},
      body: JSON.stringify({niche, location, limit: $('limit').value, mode: $('mode').value})
    });
    if (b.pending) {
      $('cancel-search').hidden = false;
      const started = Date.now();
      for (let i = 0; b.pending && i < 36 && !state.cancelled; i++) {
        const secs = Math.round((Date.now() - started) / 1000);
        $('status').textContent = T.polling(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`);
        await sleep(5000);
        if (state.cancelled) break;
        b = await api('/api/jobs/' + b.jobId);
      }
      if (state.cancelled) throw new Error(T.stopped);
      if (b.pending) throw new Error(T.stillProcessing);
    }
    state.results = b.leads || [];
    state.lastDemo = b.demo === true;
    state.view = 'discover';
    $('status').textContent = state.lastDemo ? T.demoNote : T.liveNote(state.results.length, b.cached);
    setSearching(false);
    render();
    document.querySelector('.results').scrollIntoView({behavior: reducedMotion ? 'auto' : 'smooth', block: 'start'});
  } catch (err) {
    setSearching(false);
    $('status').textContent = err.message;
    toast(err.message, 'error');
    render();
  }
});

$('cancel-search').onclick = () => { state.cancelled = true; $('cancel-search').hidden = true; };

/* ---------- filters ---------- */
let filterTimer;
$('filter-text').addEventListener('input', () => { clearTimeout(filterTimer); filterTimer = setTimeout(render, 90); });
$('sort').addEventListener('change', render);
document.querySelector('.chips').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  state.website = chip.dataset.website;
  for (const c of document.querySelectorAll('.chip')) {
    const active = c === chip;
    c.classList.toggle('active', active);
    c.setAttribute('aria-pressed', String(active));
  }
  render();
});
function clearFilters() {
  $('filter-text').value = '';
  state.website = 'all';
  for (const c of document.querySelectorAll('.chip')) {
    const active = c.dataset.website === 'all';
    c.classList.toggle('active', active);
    c.setAttribute('aria-pressed', String(active));
  }
  render();
}
$('empty-action').onclick = () => $('empty-action').dataset.action === 'filters' ? clearFilters() : setView('discover');

document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if (e.key === '/' && !typing && !$('detail').open) { e.preventDefault(); $('filter-text').focus(); }
  if (e.key === 'Escape' && document.activeElement === $('filter-text') && $('filter-text').value) { $('filter-text').value = ''; render(); }
});

/* ---------- navigation ---------- */
$('saved').onclick = () => setView('saved');
$('discover').onclick = () => setView('discover');

let clearArmed = false, clearTimer;
function resetClearConfirm() {
  clearArmed = false;
  clearTimeout(clearTimer);
  $('clear-saved').textContent = T.clearList;
  $('clear-saved').classList.remove('armed');
}
$('clear-saved').onclick = () => {
  if (!clearArmed) {
    clearArmed = true;
    $('clear-saved').textContent = T.clearConfirm;
    $('clear-saved').classList.add('armed');
    clearTimer = setTimeout(resetClearConfirm, 6000);
    return;
  }
  resetClearConfirm();
  if (persistSaved([])) { toast(T.cleared); render(); }
};

/* ---------- rows: open / save ---------- */
$('rows').addEventListener('click', e => {
  const button = e.target.closest('button[data-save],button[data-open]');
  if (!button) return;
  if (button.dataset.save) return toggleSave(button.dataset.save);
  openDetail(button.dataset.open);
});

/* ---------- detail dialog ---------- */
const dialog = $('detail');
function syncDetailSave(r) {
  const saved = isSaved(r.id);
  $('detail-save').textContent = saved ? T.saved : T.save;
  $('detail-save').classList.toggle('selected', saved);
  $('detail-save').setAttribute('aria-pressed', String(saved));
}
function openDetail(id) {
  const r = [...state.results, ...state.saved].find(x => x.id === id);
  if (!r) return;
  state.detailId = id;
  $('detail-name').textContent = r.name;
  $('detail-meta').textContent = [r.category, r.address].filter(Boolean).join(' · ');
  const rows = [
    [T.dl.phone, r.phone ? esc(r.phone) : `<span class="muted">${T.phoneMissing}</span>`],
    [T.dl.website, safeUrl(r.website) ? `<a href="${esc(r.website)}" target="_blank" rel="noopener">${esc(r.website.replace(/^https?:\/\//i, ''))}</a>` : `<span class="muted">${T.websiteMissing}</span>`],
    [T.dl.rating, r.rating ? `${esc(r.rating)} ★ · ${T.reviews(r.reviews)}` : `<span class="muted">${T.noRating}</span>`],
    [T.dl.source, esc(r.source) + (safeUrl(r.sourceUrl) ? ` · <a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">${T.viewSource}</a>` : '')],
    [T.dl.retrieved, esc(new Date(r.retrievedAt).toLocaleString())]
  ];
  $('detail-body').innerHTML = rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('');
  $('detail-call').hidden = !r.phone;
  $('detail-copy-phone').hidden = !r.phone;
  if (r.phone) $('detail-call').href = telHref(r.phone);
  $('detail-site').hidden = !safeUrl(r.website);
  if (safeUrl(r.website)) $('detail-site').href = r.website;
  $('draft').value = T.draft(r);
  $('copy-draft').textContent = T.copyDraft;
  syncDetailSave(r);
  dialog.showModal();
}
$('detail-save').onclick = () => state.detailId && toggleSave(state.detailId);
$('close-detail').onclick = () => dialog.close();
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => { state.detailId = null; });

async function copyText(text, onOk) {
  try {
    await navigator.clipboard.writeText(text);
    onOk?.();
    return true;
  } catch {
    toast(T.copyFail, 'error');
    return false;
  }
}
$('copy-draft').onclick = async () => {
  const ok = await copyText($('draft').value, () => { toast(T.copied, 'success'); $('copy-draft').textContent = T.copiedBtn; setTimeout(() => { $('copy-draft').textContent = T.copyDraft; }, 1800); });
  if (!ok) { $('draft').focus(); $('draft').select(); }
};
$('detail-copy-phone').onclick = () => {
  const r = [...state.results, ...state.saved].find(x => x.id === state.detailId);
  if (r?.phone) copyText(r.phone, () => toast(T.phoneCopied, 'success'));
};

/* ---------- export ---------- */
$('export').onclick = () => {
  const data = visible();
  if (!data.length) return;
  const url = URL.createObjectURL(new Blob([csv(data)], {type: 'text/csv;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = `cub4studio-${state.view === 'saved' ? 'shortlist' : 'prospects'}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(T.exported(data.length), 'success');
};

/* ---------- data source mode ---------- */
function setBadge(stateName, text) {
  $('mode-badge').dataset.state = stateName;
  $('mode-badge').lastChild.textContent = text;
}
$('mode').onchange = () => {
  const demo = $('mode').value === 'demo';
  $('search-button').disabled = state.searching || $('mode').selectedOptions[0].disabled;
  setBadge(demo ? 'demo' : 'live', demo ? T.modeDemo : T.modeLive);
  $('data-note').textContent = demo ? T.noteDemo : T.noteLive;
};

api('/api/config').then(c => {
  const [liveOpt, demoOpt] = $('mode').options;
  if (c.live) { liveOpt.disabled = false; liveOpt.textContent = T.optLive; }
  if (c.preview) { demoOpt.disabled = false; demoOpt.textContent = T.optDemo; }
  if (c.live) $('mode').value = 'live';
  else if (c.preview) $('mode').value = 'demo';
  if (c.live || c.preview) $('mode').onchange();
  else setBadge('off', T.modeOff);
}).catch(() => {
  $('status').textContent = T.offline;
  toast(T.offline, 'error');
});

render();
