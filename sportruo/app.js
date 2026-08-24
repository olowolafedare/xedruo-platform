const SUPABASE_URL = 'https://ydhgxyklucrcqmivtvcu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SBS-hnI6lAOdi5UnrLu2HA_GlvG0_av';
const REST = `${SUPABASE_URL}/rest/v1`;
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

const navItems = document.querySelectorAll('.nav-item');
navItems.forEach((item) => item.addEventListener('click', () => {
  navItems.forEach((n) => n.classList.remove('active'));
  item.classList.add('active');
}));

document.querySelector('.primary')?.addEventListener('click', () => {
  document.querySelector('#talent')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.querySelector('.secondary')?.addEventListener('click', () => {
  document.querySelector('#clubs')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.querySelectorAll('.service button').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.service');
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

async function count(table, query = '') {
  const response = await fetch(`${REST}/${table}?select=id${query}`, {
    method: 'GET',
    headers: { ...headers, Prefer: 'count=exact', Range: '0-0' },
  });
  if (!response.ok) throw new Error(`Unable to load ${table}`);
  const range = response.headers.get('content-range');
  const total = range?.split('/')[1];
  return total && total !== '*' ? Number(total) : 0;
}

function setStat(index, value, fallback = '—') {
  const strong = document.querySelectorAll('.stats-row article strong')[index];
  if (strong) strong.textContent = Number.isFinite(value) ? value.toLocaleString() : fallback;
}

async function loadDashboardData() {
  try {
    const [athletes, competitions, venues, opportunities] = await Promise.all([
      count('sportruo_athletes'),
      count('sportruo_competitions', '&status=in.(registration_open,active)'),
      count('sportruo_venues', '&verification_status=eq.verified'),
      count('sportruo_talent_opportunities', '&status=eq.open'),
    ]);

    setStat(0, athletes);
    setStat(1, competitions);
    setStat(2, venues);
    setStat(3, opportunities);

    const opportunityResponse = await fetch(`${REST}/sportruo_talent_opportunities?select=title,sport,opportunity_type&status=eq.open&order=created_at.desc&limit=3`, { headers });
    if (opportunityResponse.ok) {
      const items = await opportunityResponse.json();
      const rows = document.querySelectorAll('.opportunity-panel .opportunity');
      items.forEach((item, index) => {
        const row = rows[index];
        if (!row) return;
        const title = row.querySelector('strong');
        const meta = row.querySelector('small');
        if (title) title.textContent = item.title;
        if (meta) meta.textContent = `${item.opportunity_type} · ${item.sport}`;
      });
    }
  } catch (error) {
    console.warn('SPORTRUO dashboard data unavailable; showing empty state.', error);
  }
}

loadDashboardData();
setInterval(loadDashboardData, 60000);
