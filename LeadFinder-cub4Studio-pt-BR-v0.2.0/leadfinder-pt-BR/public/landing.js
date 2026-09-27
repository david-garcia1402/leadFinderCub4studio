const english = document.documentElement.lang === 'en-US';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- header: sticky shadow + mobile menu ---------- */
const header = document.querySelector('.top');
const nav = document.getElementById('site-nav');
const toggle = document.getElementById('menu-toggle');

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? (english ? 'Close menu' : 'Fechar menu') : (english ? 'Open menu' : 'Abrir menu'));
}
toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); toggle.focus(); } });
document.addEventListener('click', e => {
  if (document.body.classList.contains('menu-open') && !header.contains(e.target)) setMenu(false);
});
matchMedia('(min-width: 761px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

const onScroll = () => header.classList.toggle('scrolled', scrollY > 12);
addEventListener('scroll', onScroll, {passive: true});
onScroll();

/* ---------- active section highlighting ---------- */
const links = [...nav.querySelectorAll('a')];
const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window && sections.length) {
  const spy = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const a of links) a.classList.toggle('current', a.getAttribute('href') === '#' + entry.target.id);
    }
  }, {rootMargin: '-40% 0px -50% 0px'});
  sections.forEach(s => spy.observe(s));
}

/* ---------- reveal on scroll ---------- */
const revealTargets = document.querySelectorAll('.steps article, .plan, .feature-panel, .faq details, .section-head, .final-cta, .audience, .pricing > .eyebrow, .pricing > h2, .pricing > .sub');
if (!reducedMotion && 'IntersectionObserver' in window) {
  revealTargets.forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--delay', `${(i % 3) * 70}ms`); });
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
  }, {threshold: 0.12, rootMargin: '0px 0px -8% 0px'});
  revealTargets.forEach(el => io.observe(el));
}

/* ---------- FAQ: one open at a time ---------- */
const faqs = document.querySelectorAll('.faq details');
faqs.forEach(d => d.addEventListener('toggle', () => { if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; }); }));

/* ---------- qualification brief ---------- */
const plan = document.getElementById('interest-plan');
const service = document.getElementById('interest-service');
const market = document.getElementById('interest-market');
const brief = document.getElementById('interest-brief');
const status = document.getElementById('copy-status');
const copyButton = document.getElementById('copy-brief');
const hint = status.textContent;
const copyLabel = copyButton.textContent;

function updateBrief() {
  const price = plan.selectedOptions[0].dataset.price;
  document.getElementById('interest-copy').textContent = english
    ? `${plan.value} — ${price}. Tell us what you sell and where you want to prospect. Launch interest only; no payment or reservation.`
    : `${plan.value} — ${price}. Conte o que você vende e onde deseja prospectar. Interesse no lançamento, sem cobrança ou reserva.`;
  brief.value = english
    ? `I am interested in Lead Finder: ${plan.value} (${price}). I sell: ${service.value}. Target market: ${market.value.trim() || 'To discuss'}. Please confirm launch availability and monthly allowances.`
    : `Tenho interesse no Lead Finder: ${plan.value} (${price}). Vendo: ${service.value}. Mercado desejado: ${market.value.trim() || 'A definir'}. Gostaria de confirmar a disponibilidade no lançamento e a franquia mensal.`;
  status.textContent = hint;
  status.classList.remove('ok');
  copyButton.textContent = copyLabel;
}

document.querySelectorAll('[data-plan]').forEach(link => link.addEventListener('click', () => {
  plan.value = link.dataset.plan;
  updateBrief();
  document.querySelectorAll('.plan').forEach(p => p.classList.toggle('chosen', p.contains(link)));
  setTimeout(() => market.focus({preventScroll: true}), reducedMotion ? 0 : 600);
}));
plan.addEventListener('change', () => {
  document.querySelectorAll('.plan').forEach(p => p.classList.toggle('chosen', p.querySelector('[data-plan]')?.dataset.plan === plan.value));
});
[plan, service, market].forEach(field => field.addEventListener('input', updateBrief));

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(brief.value);
    status.textContent = english ? 'Copied. Paste your brief in the conversation with cub4Studio.' : 'Copiado. Cole o resumo na conversa com a cub4Studio.';
    status.classList.add('ok');
    copyButton.textContent = english ? 'Copied ✓' : 'Copiado ✓';
    setTimeout(() => { copyButton.textContent = copyLabel; }, 2000);
  } catch {
    brief.focus(); brief.select();
    status.textContent = english ? 'Select and copy the brief above, then paste it in your conversation.' : 'Selecione e copie o resumo acima, depois cole na conversa.';
  }
});
updateBrief();
