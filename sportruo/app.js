const SUPABASE_URL = 'https://ydhgxyklucrcqmivtvcu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SBS-hnI6lAOdi5UnrLu2HA_GlvG0_av';
const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;
const headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };
let authMode = 'signin';

const navItems = document.querySelectorAll('.nav-item');
navItems.forEach((item) => item.addEventListener('click', () => { navItems.forEach((n) => n.classList.remove('active')); item.classList.add('active'); }));
document.querySelector('.primary')?.addEventListener('click', () => document.querySelector('#talent')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
document.querySelector('.secondary')?.addEventListener('click', () => document.querySelector('#clubs')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
document.querySelectorAll('.service button').forEach((button) => button.addEventListener('click', () => button.closest('.service')?.scrollIntoView({ behavior: 'smooth', block: 'center' })));

async function count(table, query = '') { const session = getSession(); const auth = session?.access_token ? { ...headers, Authorization: `Bearer ${session.access_token}` } : headers; const response = await fetch(`${REST}/${table}?select=id${query}`, { headers: { ...auth, Prefer: 'count=exact' } }); if (!response.ok) throw new Error(`Unable to load ${table}`); const range = response.headers.get('content-range'); const total = range?.split('/')[1]; return total && total !== '*' ? Number(total) : 0; }
function setStat(index, value) { const strong = document.querySelectorAll('.stats-row article strong')[index]; if (strong) strong.textContent = Number.isFinite(value) ? value.toLocaleString() : '0'; }
async function loadDashboardData() { try { const [athletes, competitions, venues, opportunities] = await Promise.all([count('sportruo_athletes'), count('sportruo_competitions', '&status=in.(registration_open,active)'), count('sportruo_venues', '&verification_status=eq.verified'), count('sportruo_talent_opportunities', '&status=eq.open')]); setStat(0, athletes); setStat(1, competitions); setStat(2, venues); setStat(3, opportunities); } catch (error) { console.warn('SPORTRUO dashboard data unavailable.', error); } }
loadDashboardData(); setInterval(loadDashboardData, 60000);

const modal = document.querySelector('#authModal');
const authButton = document.querySelector('#authButton');
const authForm = document.querySelector('#authForm');
const authSwitch = document.querySelector('#authSwitch');
const authClose = document.querySelector('#authClose');
const authTitle = document.querySelector('#authTitle');
const authSubtitle = document.querySelector('#authSubtitle');
const authSubmit = document.querySelector('#authSubmit');
const authMessage = document.querySelector('#authMessage');
const nameField = document.querySelector('#nameField');
const roleField = document.querySelector('#roleField');

function openAuth(mode = 'signin') { authMode = mode; modal.hidden = false; authMessage.textContent = ''; const signup = mode === 'signup'; authTitle.textContent = signup ? 'Create account' : 'Sign in'; authSubtitle.textContent = signup ? 'Create your identity in the SPORTRUO sports ecosystem.' : 'Access your sports command center.'; authSubmit.textContent = signup ? 'Create account' : 'Sign in'; authSwitch.textContent = signup ? 'Already have an account? Sign in' : 'Create a SPORTRUO account'; nameField.hidden = !signup; roleField.hidden = !signup; document.querySelector('#authPassword').autocomplete = signup ? 'new-password' : 'current-password'; }
function closeAuth() { modal.hidden = true; }
authButton?.addEventListener('click', () => openAuth('signin'));
authClose?.addEventListener('click', closeAuth);
authSwitch?.addEventListener('click', () => openAuth(authMode === 'signin' ? 'signup' : 'signin'));
modal?.addEventListener('click', (event) => { if (event.target === modal) closeAuth(); });

authForm?.addEventListener('submit', async (event) => {
  event.preventDefault(); authSubmit.disabled = true; authMessage.textContent = 'Connecting…';
  const email = document.querySelector('#authEmail').value.trim(); const password = document.querySelector('#authPassword').value; const fullName = document.querySelector('#authName').value.trim(); const role = document.querySelector('#authRole').value;
  try {
    const endpoint = authMode === 'signup' ? `${AUTH}/signup` : `${AUTH}/token?grant_type=password`;
    const body = authMode === 'signup' ? { email, password, data: { full_name: fullName, sportruo_role: role } } : { email, password };
    const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json(); if (!response.ok) throw new Error(data.msg || data.error_description || data.message || 'Authentication failed.');
    if (data.access_token) { saveSession(data); closeAuth(); updateAuthUI(data.user || decodeUser(data.access_token)); loadDashboardData(); }
    else authMessage.textContent = 'Account created. Check your email to confirm your account, then sign in.';
  } catch (error) { authMessage.textContent = error.message; } finally { authSubmit.disabled = false; }
});

function saveSession(data) { localStorage.setItem('sportruo_auth', JSON.stringify(data)); }
function getSession() { try { return JSON.parse(localStorage.getItem('sportruo_auth') || 'null'); } catch { return null; } }
function decodeUser(token) { try { const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return { id: payload.sub, email: payload.email, user_metadata: payload.user_metadata || {} }; } catch { return null; } }
function updateAuthUI(user) { if (!user) return; authButton.hidden = true; const profile = document.querySelector('#profileMenu'); profile.hidden = false; const label = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account'; document.querySelector('#profileName').textContent = label; document.querySelector('#profileAvatar').textContent = label.slice(0, 2).toUpperCase(); }
function signOut() { localStorage.removeItem('sportruo_auth'); authButton.hidden = false; document.querySelector('#profileMenu').hidden = true; }
document.querySelector('#signOutButton')?.addEventListener('click', signOut);
const existingSession = getSession(); if (existingSession?.access_token) updateAuthUI(existingSession.user || decodeUser(existingSession.access_token));