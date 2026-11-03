import { xedruo, supabase } from '@/api/xedruoClient';

const firstRow = (value) => Array.isArray(value) ? value[0] || null : value || null;

export async function getIdentity() {
  const me = await xedruo.auth.me();
  const { data, error } = await supabase
    .from('xedruo_identity')
    .select('xedruo_id,country_code,status,kyc_status,kyc_level,phone_e164,phone_verified_at,verified_at')
    .eq('user_id', me.id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function ensureXedruoId({ countryCode } = {}) {
  const existing = await getIdentity();
  if (existing?.xedruo_id) {
    if (!existing.phone_e164) throw new Error('Add and save your phone number before using your Xedruo ID.');
    return { ...existing, xedruoId: existing.xedruo_id, created: false };
  }
  const normalizedCountry = String(countryCode || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
    throw new Error('Select your issuing country before creating your Xedruo ID.');
  }
  const { data, error } = await supabase.rpc('ensure_xedruo_identity', {
    p_country_code: normalizedCountry,
  });
  if (error) throw error;
  const identity = firstRow(data);
  if (!identity?.xedruo_id) throw new Error('Xedruo could not issue your identity. Please try again.');
  return { ...identity, xedruoId: identity.xedruo_id, created: Boolean(identity.created) };
}

export async function saveCustomerContact({ countryCode, phoneE164 }) {
  await xedruo.auth.me();
  const normalizedCountry = String(countryCode || '').trim().toUpperCase();
  const normalizedPhone = String(phoneE164 || '').trim();
  if (!/^[A-Z]{2}$/.test(normalizedCountry)) throw new Error('Select a valid issuing country.');
  if (!/^\+[1-9][0-9]{7,14}$/.test(normalizedPhone)) {
    throw new Error('Enter a valid international phone number.');
  }
  const { data, error } = await supabase.rpc('set_xedruo_identity_phone', {
    p_country_code: normalizedCountry,
    p_phone_e164: normalizedPhone,
  });
  if (error) throw error;
  return firstRow(data) || getIdentity();
}

export async function promoteXedruoIdToVerified() {
  const identity = await getIdentity();
  if (!identity?.xedruo_id) throw new Error('A Xedruo identity has not been issued yet.');
  if (identity.kyc_status !== 'verified' || Number(identity.kyc_level || 0) < 2) {
    throw new Error('Complete the required regional KYC review before your identity can be marked verified.');
  }
  if (identity.status !== 'verified') {
    throw new Error('Identity status changes are applied by the secure KYC review service.');
  }
  return identity;
}

export async function getXedruoId() {
  const identity = await getIdentity();
  return identity?.xedruo_id || null;
}

const COMPANY_SLUGS = {
  'pay-bank': 'pay-and-play',
  'pay-and-play': 'pay-and-play',
  'xedruo-ai': 'xedrion-ai',
  'xedrion-ai': 'xedrion-ai',
  education: 'xedruo-education',
  capital: 'xedruo-capital',
  energy: 'xedruo-energy',
  logistics: 'xedruo-global-logistics',
  properties: 'xedruo-properties',
  spacetruo: 'spacetruo',
  healthruo: 'healthruo',
  agruo: 'agruo',
  sportruo: 'sportruo',
  adom: 'adom-global-commerce',
  'adom-global-commerce': 'adom-global-commerce',
  music: 'xedruo-music',
  'music-distribution': 'xedruo-music',
  xedruo: 'xedruo',
  'group-holdings': 'xedruo',
  'xedruo-group-holdings': 'xedruo',
};

export function canonicalCompanySlug(slug) {
  const value = String(slug || '').trim().toLowerCase();
  return COMPANY_SLUGS[value] || value;
}

export async function linkCompany(slug, displayName) {
  const canonicalSlug = canonicalCompanySlug(slug);
  if (!canonicalSlug) return null;
  const me = await xedruo.auth.me();
  if (!me?.id) throw new Error('Authentication required');
  const { data, error } = await supabase.rpc('ensure_xedruo_company_profile', {
    p_company_slug: canonicalSlug,
    p_display_name: displayName || me.name || me.email || null,
  });
  if (error) throw error;
  return data || null;
}

export async function getCompanyMembership(slug) {
  const canonicalSlug = canonicalCompanySlug(slug);
  const me = await xedruo.auth.me();
  const { data, error } = await supabase
    .from('xedruo_company_profiles')
    .select('id,xedruo_id,company_slug,display_name,company_data,created_at,updated_at')
    .eq('user_id', me.id)
    .eq('company_slug', canonicalSlug)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getLinkedCompanies() {
  const me = await xedruo.auth.me();
  const { data, error } = await supabase
    .from('xedruo_company_profiles')
    .select('id,xedruo_id,company_slug,display_name,company_data')
    .eq('user_id', me.id)
    .order('company_slug');
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    xedruoId: row.xedruo_id,
    slug: row.company_slug,
    name: row.display_name || row.company_slug,
    data: row.company_data || {},
  }));
}
