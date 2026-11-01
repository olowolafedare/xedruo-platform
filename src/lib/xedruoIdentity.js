import { xedruo, supabase } from '@/api/xedruoClient';

// Xedruo IDs are allocated only by the database RPC. The database generates
// a random 10-digit suffix and enforces global uniqueness; never generate IDs
// in the browser and never use a sequential counter.
export async function getIdentity() {
  const me = await xedruo.auth.me();
  const { data, error } = await supabase
    .from('xedruo_identity')
    .select('xedruo_id,country_code,status,kyc_status,kyc_level,phone_e164,phone_verified_at,verified_at,created_at')
    .eq('user_id', me.id)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...data, xedruoId: data.xedruo_id, expires_at: null } : null;
}

export async function ensureXedruoId({ countryCode } = {}) {
  const me = await xedruo.auth.me();
  if (!me?.id) throw new Error('Authentication required.');

  let selectedCountry = String(countryCode || '').trim().toUpperCase();
  if (!selectedCountry) {
    // Preserve the country selected during legacy registration when available.
    const { data: profile, error } = await supabase
      .from('xedruo_customer_profiles')
      .select('country_code')
      .eq('user_id', me.id)
      .maybeSingle();
    if (error) throw error;
    selectedCountry = String(profile?.country_code || '').trim().toUpperCase();
  }
  if (!/^[A-Z]{2}$/.test(selectedCountry)) {
    throw new Error('Select your country before creating your Xedruo identity.');
  }

  const { data, error } = await supabase.rpc('ensure_xedruo_identity', {
    p_country_code: selectedCountry,
  });
  if (error) throw error;
  const identity = Array.isArray(data) ? data[0] : data;
  if (!identity?.xedruo_id) throw new Error('Xedruo identity allocation did not return an ID.');

  return {
    ...identity,
    xedruoId: identity.xedruo_id,
    expires_at: null,
    created: Boolean(identity.created),
  };
}

// KYC is a separate compliance state. It must never be required to create,
// retain, or promote the permanent identity itself.
export async function promoteXedruoIdToVerified() {
  const identity = await getIdentity();
  if (!identity) throw new Error('Create your Xedruo identity first.');
  return identity;
}

export async function getXedruoId() {
  const identity = await getIdentity();
  return identity?.xedruo_id || null;
}

export async function saveCustomerContact({ countryCode, countryName, phoneE164, phoneVerified = false }) {
  const me = await xedruo.auth.me();
  const { error } = await supabase
    .from('xedruo_customer_profiles')
    .update({
      country_code: countryCode,
      country_name: countryName || null,
      phone_e164: phoneE164,
      phone_verified: Boolean(phoneVerified),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', me.id);
  if (error) throw error;
  return getIdentity();
}

export async function markPhoneVerified({ countryCode, countryName, phoneE164 }) {
  await saveCustomerContact({
    countryCode,
    countryName,
    phoneE164,
    phoneVerified: true,
  });
  // The ID is permanent and independent of KYC. Phone verification is handled
  // by the authentication provider; this RPC only allocates/returns the ID.
  return ensureXedruoId({ countryCode });
}

const COMPANY_SLUGS = {
  'pay-bank': 'xedruo',
  'xedruo-ai': 'xedruo-ai',
  education: 'xedruo-education',
  capital: 'xedruo-capital',
  energy: 'xedruo-energy',
  logistics: 'xedruo-logistics',
  properties: 'xedruo-properties',
  spacetruo: 'spacetruo',
  healthruo: 'healthruo',
  agruo: 'agruo',
  sportruo: 'sportruo',
  adom: 'adom',
  xedruo: 'xedruo',
  'group-holdings': 'xedruo-group-holdings',
  'xedruo-group-holdings': 'xedruo-group-holdings',
};

export function canonicalCompanySlug(slug) {
  const value = String(slug || '').trim().toLowerCase();
  return COMPANY_SLUGS[value] || value;
}

export async function linkCompany(slug) {
  const canonicalSlug = canonicalCompanySlug(slug);
  if (!canonicalSlug) return null;
  const me = await xedruo.auth.me();
  if (!me?.id) throw new Error('Authentication required');
  const { data, error } = await supabase.rpc('join_xedruo_company', {
    p_company_slug: canonicalSlug,
  });
  if (error) throw error;
  return data?.[0] || null;
}

export async function getCompanyMembership(slug) {
  const canonicalSlug = canonicalCompanySlug(slug);
  const me = await xedruo.auth.me();
  const { data, error } = await supabase
    .from('xedruo_company_memberships')
    .select('id,company_id,role,active,xedruo_companies(name,slug)')
    .eq('user_id', me.id)
    .eq('active', true)
    .eq('xedruo_companies.slug', canonicalSlug)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getLinkedCompanies() {
  const me = await xedruo.auth.me();
  const { data, error } = await supabase
    .from('xedruo_company_memberships')
    .select('company_id,role,xedruo_companies(name,slug)')
    .eq('user_id', me.id)
    .eq('active', true);
  if (error) throw error;
  return (data || [])
    .map(row => ({
      id: row.company_id,
      role: row.role,
      name: row.xedruo_companies?.name,
      slug: row.xedruo_companies?.slug,
    }))
    .filter(company => company.slug);
}
