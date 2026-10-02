const status = document.getElementById('auth-status');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const params = new URLSearchParams(location.search);
const next = params.get('next') === '/account' ? '/account' : '/app';
const planValue=(params.get('plan')||params.get('plano')||'').toLowerCase();
const plan=({essential:'essencial',professional:'profissional',scale:'escala'})[planValue]||(['essencial','profissional','escala'].includes(planValue)?planValue:'');

function show(mode) {
  const register = mode === 'register';
  loginForm.hidden = register;
  registerForm.hidden = !register;
  tabLogin.classList.toggle('active', !register);
  tabRegister.classList.toggle('active', register);
  tabLogin.setAttribute('aria-selected', String(!register));
  tabRegister.setAttribute('aria-selected', String(register));
}

async function api(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: {'Content-Type':'application/json','X-Cub4-Client':'lead-finder'},
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to sign in.');
  return data;
}

function destination() {
  return plan ? `/account?plan=${encodeURIComponent(({essencial:'essential',profissional:'professional',escala:'scale'})[plan])}` : next;
}

tabLogin.onclick = () => show('login');
tabRegister.onclick = () => show('register');
if (params.get('cadastro') === '1' || plan) show('register');

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  status.textContent = 'Signing in…';
  try {
    await api('/api/auth/login', {email: document.getElementById('login-email').value, password: document.getElementById('login-password').value});
    location.href = destination();
  } catch (error) {
    status.textContent = error.message;
  }
});

registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  status.textContent = 'Creating your account…';
  try {
    await api('/api/auth/register', {
      name: document.getElementById('register-name').value,
      email: document.getElementById('register-email').value,
      password: document.getElementById('register-password').value
    });
    location.href = destination();
  } catch (error) {
    status.textContent = error.message;
  }
});

fetch('/api/me').then(res => res.ok ? res.json() : null).then(data => {
  if (data?.user) location.replace(destination());
}).catch(() => {});
