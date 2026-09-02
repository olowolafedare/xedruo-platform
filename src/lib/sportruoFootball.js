import { supabase } from '@/api/xedruoClient';

export async function getFootballData(resource, options = {}) {
  const { data, error } = await supabase.functions.invoke('sportruo-football-data', {
    method: 'GET',
    query: Object.entries({ resource, ...options }).map(([name, value]) => ({ name, value: String(value) })),
  });
  if (error) throw error;
  return data;
}
