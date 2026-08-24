import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export async function createRegistration({ registrationType, entityName }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');
  return supabase.from('sportruo_registrations').insert({
    user_id: user.id,
    registration_type: registrationType,
    entity_name: entityName,
    status: 'draft'
  }).select().single();
}

export async function getMyRegistrations() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('sportruo_registrations').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
