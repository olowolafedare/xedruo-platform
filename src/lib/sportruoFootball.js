import { supabase } from '@/api/xedruoClient';

const DEFAULT_COMPETITIONS = 'PL,BL1,SA,PD,FL1,CL';
const isoDate = (date) => date.toISOString().slice(0, 10);

export async function getFootballData(resource, options = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('SPORTRUO session required to load football data.');

  const request = async (requestOptions = {}) => {
    const query = Object.entries({ resource, ...requestOptions })
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([name, value]) => ({ name, value: String(value) }));
    const { data, error } = await supabase.functions.invoke('sportruo-football-data', {
      method: 'GET', query, headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (error) {
      let message = error.message || 'Football data request failed.';
      try { if (error.context?.json) { const body = await error.context.json(); message = body?.error || body?.message || message; } } catch {}
      throw new Error(message);
    }
    return data;
  };

  if (resource === 'matches' && (options.status === 'SCHEDULED' || options.status === undefined)) {
    const today = new Date();
    const future = new Date(today);
    future.setUTCDate(future.getUTCDate() + 14);
    const competitions = options.competitions || DEFAULT_COMPETITIONS;
    const [live, upcoming] = await Promise.all([
      request({ ...options, competition: undefined, competitions, status: 'LIVE', dateFrom: isoDate(today), dateTo: isoDate(today), limit: 100 }),
      request({ ...options, competition: undefined, competitions, status: 'SCHEDULED', dateFrom: isoDate(today), dateTo: isoDate(future), limit: 100 }),
    ]);
    const byId = new Map();
    for (const item of [...(live?.matches || []), ...(upcoming?.matches || [])]) if (item?.id != null) byId.set(item.id, item);
    return { ...(upcoming || {}), matches: Array.from(byId.values()).sort((a,b) => {
      const rank = (s) => ['IN_PLAY','PAUSED'].includes(s) ? 0 : 1;
      return rank(a.status) - rank(b.status) || new Date(a.utcDate || 0) - new Date(b.utcDate || 0);
    }) };
  }
  return request(options);
}
