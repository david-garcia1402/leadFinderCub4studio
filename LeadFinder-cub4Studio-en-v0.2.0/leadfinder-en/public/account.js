const params = new URLSearchParams(location.search);
const selectedParam = (params.get('plan') || params.get('plano') || '').toLowerCase();
const selected = ({essential:'essencial',professional:'profissional',scale:'escala'})[selectedParam] || selectedParam;
const status = document.getElementById('checkout-status');
const sessionLine = document.getElementById('session-line');
const lead = document.getElementById('account-lead');
const logout = document.getElementById('logout');
const plansBox = document.getElementById('plans');
let user = null;
let billing = {configured:false, label:'Checkout'};
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function label() {
  return billing.label || 'Checkout';
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to complete this action.');
  return data;
}

function renderPlans(plans) {
  const current = user?.subscription?.planId;
  plansBox.innerHTML = plans.map(plan => {
    const active = current === plan.id;
    const highlight = selected === plan.id || (!selected && plan.id === 'profissional');
    return `<article class="plan ${highlight ? 'featured' : ''}">
      <span class="plan-type">${active ? 'YOUR CURRENT PLAN' : 'MONTHLY PLAN'}</span>
      <h3>${esc(plan.name)}</h3>
      <div class="price">${esc(plan.label)}</div>
      <div class="allowance">${esc(plan.quota)} businesses per billing cycle</div>
      <button class="button ${highlight ? '' : 'outline'}" data-plan="${esc(plan.id)}" ${user && billing.configured && (!billing.checkoutPlans || billing.checkoutPlans.includes(plan.id)) ? '' : 'disabled'}>
        ${active ? `Renew with ${esc(label())}` : `Subscribe with ${esc(label())}`} <span>↗</span>
      </button>
    </article>`;
  }).join('');
}

function describeSession() {
  const loginLink = document.querySelector('#session-card a[href="/login"]');
  if (!user) {
    sessionLine.textContent = 'You are not signed in on this browser.';
    logout.hidden = true;
    if (loginLink) loginLink.hidden = false;
    lead.textContent = `Create your account using your purchase email. Your ${label()} subscription includes searches and CRM inside Lead Finder.`;
    return;
  }
  const sub = user.subscription || {};
  logout.hidden = false;
  if (loginLink) loginLink.hidden = true;
  sessionLine.textContent = `${user.email} · ${sub.planName || 'no plan'} · ${sub.remaining || 0}/${sub.quota || 0} businesses remaining`;
  lead.textContent = billing.configured
    ? `Your plan is enabled after payment confirmation. Search directly in your workspace.`
    : `Conta pronta. Plans are being prepared. Please contact support.`;
}

logout.onclick = async () => {
  try {
    await api('/api/auth/logout', {method:'POST', headers:{'X-Cub4-Client':'lead-finder'}});
    location.href = '/login';
  } catch (error) {
    status.textContent = error.message;
  }
};

async function openCheckout(planId) {
  status.textContent = `Opening ${label()} checkout…`;
  try {
    const checkout = await api('/api/billing/checkout', {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Cub4-Client':'lead-finder'},
      body: JSON.stringify({planId})
    });
    if (checkout.initPoint) location.href = checkout.initPoint;
    else status.textContent = `${label()} did not return a payment URL.`;
  } catch (error) {
    status.textContent = error.message;
  }
}

plansBox.addEventListener('click', event => {
  const button = event.target.closest('button[data-plan]');
  if (!button || button.disabled) return;
  openCheckout(button.dataset.plan);
});

Promise.all([
  fetch('/api/me').then(res => res.json()).catch(() => ({user:null})),
  fetch('/api/plans').then(res => res.json())
]).then(([session, catalog]) => {
  user = session.user || null;
  billing = catalog.billing || billing;
  describeSession();
  const plans = catalog.plans || [];
  renderPlans(plans);
  if (['retorno','success','approved'].includes(params.get('checkout')||params.get('payment'))) {
    status.textContent = `Returned from ${label()}. Your plan will update after payment confirmation.`;
    return;
  }
  if (user && billing.configured && plans.some(plan => plan.id === selected)) openCheckout(selected);
}).catch(() => {
  sessionLine.textContent = 'Service unavailable. Please try again shortly.';
});
