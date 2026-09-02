import { supabase } from '@/api/xedruoClient';

export async function getFootballData(resource, options = {}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('SPORTRUO session required to load football data.');

  const request = async (requestOptions = options) => {
    const query = Object.entries({ resource, ...requestOptions })
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
  };

  // The dashboard needs both live states and upcoming fixtures. Requesting the
  // provider separately by status avoids showing only SCHEDULED matches.
  if (resource === 'matches' && options.status === 'SCHEDULED') {
    const [live, inPlay, paused, scheduled] = await Promise.all([
      request({ ...options, competition: 'ALL', status: 'LIVE' }),
      request({ ...options, competition: 'ALL', status: 'IN_PLAY' }),
      request({ ...options, competition: 'ALL', status: 'PAUSED' }),
      request({ ...options, competition: 'ALL', status: 'SCHEDULED' }),
    ]);

    const byId = new Map();
    for (const item of [...(live?.matches || []), ...(inPlay?.matches || []), ...(paused?.matches || []), ...(scheduled?.matches || [])]) {
      if (item?.id != null) byId.set(item.id, item);
    }

    return {
      ...(scheduled || {}),
      matches: Array.from(byId.values()).sort((a, b) => {
        const liveRank = (status) => ['LIVE', 'IN_PLAY', 'PAUSED'].includes(status) ? 0 : 1;
        return liveRank(a.status) - liveRank(b.status) || new Date(a.utcDate || 0) - new Date(b.utcDate || 0);
      }),
    };
  }

  return request(options);
}
