import { sportruoMock } from './mock-data.js';

const KEY = 'sportruo_dev_state';

function clone(value) { return JSON.parse(JSON.stringify(value)); }

export function loadState() {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? JSON.parse(saved) : clone(sportruoMock);
  } catch { return clone(sportruoMock); }
}

export function saveState(state) { localStorage.setItem(KEY, JSON.stringify(state)); return state; }

export function addRegistration(registration) {
  const state = loadState();
  state.registrations = state.registrations || [];
  state.registrations.push({ id: `reg-${Date.now()}`, status: 'pending', createdAt: new Date().toISOString(), ...registration });
  return saveState(state);
}

export function addOpportunity(opportunity) {
  const state = loadState();
  state.opportunities = state.opportunities || [];
  state.opportunities.unshift({ id: `opp-${Date.now()}`, status: 'open', ...opportunity });
  state.stats.opportunities = state.opportunities.length;
  return saveState(state);
}

export function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const state = loadState();
  return [
    ...state.athletes.map(x => ({ type: 'Athlete', title: x.name, meta: `${x.sport} · ${x.position || ''}` })),
    ...state.competitions.map(x => ({ type: 'Competition', title: x.name, meta: `${x.sport} · ${x.status}` })),
    ...state.venues.map(x => ({ type: 'Venue', title: x.name, meta: `${x.city}, ${x.country}` })),
    ...state.opportunities.map(x => ({ type: 'Opportunity', title: x.title, meta: `${x.sport} · ${x.location}` }))
  ].filter(x => `${x.title} ${x.meta}`.toLowerCase().includes(q)).slice(0, 12);
}
