import { supabase } from '@/api/xedruoClient';

export async function getFootballData(resource, options = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('SPORTRUO session required to load football data.');

  const query = Object.entries({ resource, ...options })
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([name, value]) => ({ name, value: String(value) }));

  const { data, error } = await supabase.functions.invoke('sportruo-football-data', {
    method: 'GET',
    query,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    let message = error.message || 'Football data request failed.';
    try {
      const context = error.context;
      if (context?.json) {
        const body = await context.json();
        message = body?.error || body?.message || message;
      }
    } catch {}
    throw new Error(message);
  }

  return data;
}
