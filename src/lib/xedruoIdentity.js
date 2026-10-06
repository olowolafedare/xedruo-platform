import { xedruo, supabase } from '@/api/xedruoClient';

function generateCandidate() { return String(Math.floor(1000000000 + Math.random() * 9000000000)); }

export async function getIdentity() {
  const me = await xedruo.auth.me();
  const { data, error } = await supabase.from('xedruo_identity').select('xedruo_id,status,expires_at,verified_at').eq('user_id', me.id).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function ensureXedruoId({ temporary = true } = {}) {
  const me = await xedruo.auth.me();
  const { data: existing, error: readError } = await supabase.from('xedruo_identity').select('xedruo_id,status,expires_at,verified_at').eq('user_id', me.id).maybeSingle();
  if (readError) throw readError;
  if (existing?.xedruo_id) return { ...existing, xedruoId: existing.xedruo_id, created: false };

  const { data: profile, error: profileError } = await supabase.from('xedruo_customer_profiles').select('phone_verified,phone_e164,country_code,country_name,kyc_status,kyc_level').eq('user_id', me.id).maybeSingle();
  if (profileError) throw profileError;
  if (!profile?.phone_verified || !profile?.phone_e164 || !profile?.country_code) throw new Error('Verify your phone number and select your country before receiving a Xedruo ID.');

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = generateCandidate();
    const status = temporary ? 'temporary' : 'verified';
    const expiresAt = temporary ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
    const { data, error } = await supabase.from('xedruo_identity').insert({ user_id: me.id, xedruo_id: candidate, status, expires_at: expiresAt, verified_at: temporary ? null : new Date().toISOString() }).select('xedruo_id,status,expires_at,verified_at').single();
    if (!error && data?.xedruo_id) {
      await supabase.from('xedruo_customer_profiles').update({ xedruo_account_number: candidate, onboarding_started_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('user_id', me.id);
      return { ...data, xedruoId: data.xedruo_id, created: true };
    }
    if (error?.code !== '23505') throw error;
  }
  throw new Error('Could not allocate a unique Xedruo ID. Please try again.');
}

export async function promoteXedruoIdToVerified() {
  const me = await xedruo.auth.me();
  const { data: profile, error: profileError } = await supabase.from('xedruo_customer_profiles').select('kyc_status,kyc_level').eq('user_id', me.id).maybeSingle();
  if (profileError) throw profileError;
  if (profile?.kyc_status !== 'verified' || Number(profile?.kyc_level || 0) < 2) throw new Error('Complete the required regional KYC before receiving a permanent Xedruo ID.');
  const { data, error } = await supabase.from('xedruo_identity').update({ status: 'verified', expires_at: null, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('user_id', me.id).select('xedruo_id,status,expires_at,verified_at').single();
  if (error) throw error;
  return data;
}

export async function getXedruoId() { const identity = await getIdentity(); return identity?.xedruo_id || null; }

export async function saveCustomerContact({ countryCode, countryName, phoneE164, phoneVerified = false }) {
  const me = await xedruo.auth.me();
  const { error } = await supabase.from('xedruo_customer_profiles').update({ country_code: countryCode, country_name: countryName || null, phone_e164: phoneE164, phone_verified: Boolean(phoneVerified), updated_at: new Date().toISOString() }).eq('user_id', me.id);
  if (error) throw error;
  return getIdentity();
}

export async function markPhoneVerified({ countryCode, countryName, phoneE164 }) {
  const result = await saveCustomerContact({ countryCode, countryName, phoneE164, phoneVerified: true });
  return result || ensureXedruoId({ temporary: true });
}

const COMPANY_SLUGS = { 'pay-bank':'xedruo', 'music-distribution':'xedruo-music-distribution', 'xedruo-ai':'xedruo-ai', education:'xedruo-education', capital:'xedruo-capital', energy:'xedruo-energy', logistics:'xedruo-logistics', properties:'xedruo-properties', spacetruo:'spacetruo', healthruo:'healthruo', hireuo:'hireuo', agruo:'agruo', sportruo:'sportruo', adom:'adom', xedruo:'xedruo', 'group-holdings':'xedruo-group-holdings', 'xedruo-group-holdings':'xedruo-group-holdings' };
export function canonicalCompanySlug(slug) { const value = String(slug || '').trim().toLowerCase(); return COMPANY_SLUGS[value] || value; }
export async function linkCompany(slug) { const canonicalSlug = canonicalCompanySlug(slug); if (!canonicalSlug) return null; const me = await xedruo.auth.me(); if (!me?.id) throw new Error('Authentication required'); const { data, error } = await supabase.rpc('join_xedruo_company', { p_company_slug: canonicalSlug }); if (error) throw error; return data?.[0] || null; }
export async function getCompanyMembership(slug) { const canonicalSlug = canonicalCompanySlug(slug); const me = await xedruo.auth.me(); const { data, error } = await supabase.from('xedruo_company_memberships').select('id,company_id,role,active,xedruo_companies(name,slug)').eq('user_id', me.id).eq('active', true).eq('xedruo_companies.slug', canonicalSlug).maybeSingle(); if (error) throw error; return data || null; }
export async function getLinkedCompanies() { const me = await xedruo.auth.me(); const { data, error } = await supabase.from('xedruo_company_memberships').select('company_id,role,xedruo_companies(name,slug)').eq('user_id', me.id).eq('active', true); if (error) throw error; return (data || []).map(row => ({ id: row.company_id, role: row.role, name: row.xedruo_companies?.name, slug: row.xedruo_companies?.slug })).filter(c => c.slug); }
