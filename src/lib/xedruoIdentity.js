import { xedruo, supabase } from "@/api/xedruoClient";

// Standalone Xedruo identity layer backed by Supabase.
// One unique Xedruo ID is shared across the entire Xedruo ecosystem.

function generateCandidate() {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

export async function ensureXedruoId() {
  const { data: customerProfile, error: profileError } = await supabase.rpc('ensure_xedruo_customer_profile');
  if (profileError) throw profileError;
  if (customerProfile?.xedruo_account_number) {
    return { xedruoId: customerProfile.xedruo_account_number, created: false };
  }

  const me = await xedruo.auth.me();
  const { data: existing, error: readError } = await supabase
    .from('xedruo_identity')
    .select('xedruo_id')
    .eq('user_id', me.id)
    .maybeSingle();

  if (readError) throw readError;
  if (existing?.xedruo_id) return { xedruoId: existing.xedruo_id, created: false };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateCandidate();
    const { data, error } = await supabase
      .from('xedruo_identity')
      .insert({ user_id: me.id, xedruo_id: candidate })
      .select('xedruo_id')
      .single();

    if (!error && data?.xedruo_id) return { xedruoId: data.xedruo_id, created: true };
    if (error?.code !== '23505') throw error;
  }

  throw new Error('Could not allocate a unique Xedruo ID. Please try again.');
}

export async function getXedruoId() {
  const me = await xedruo.auth.me();
  const { data, error } = await supabase.from('xedruo_identity').select('xedruo_id').eq('user_id', me.id).maybeSingle();
  if (error) throw error;
  return data?.xedruo_id || null;
}

export async function linkCompany(slug) {
  if (!slug) return;
  const me = await xedruo.auth.me();
  const aliases = { 'pay-bank': 'xedruo', 'pay-and-play': 'xedruo' };
  const canonicalSlug = aliases[slug] || slug;
  const { data: company, error: companyError } = await supabase
    .from('xedruo_companies')
    .select('id,slug')
    .eq('slug', canonicalSlug)
    .maybeSingle();
  if (companyError) throw companyError;
  if (!company) throw new Error(`Company not found: ${canonicalSlug}`);

  const { error } = await supabase.from('xedruo_company_memberships').upsert(
    { company_id: company.id, user_id: me.id, role: 'user', active: true },
    { onConflict: 'company_id,user_id' }
  );
  if (error) throw error;
}

export async function getLinkedCompanies() {
  const me = await xedruo.auth.me();
  const { data, error } = await supabase
    .from('xedruo_company_memberships')
    .select('company_id,xedruo_companies(name,slug)')
    .eq('user_id', me.id)
    .eq('active', true);
  if (error) throw error;
  return (data || []).map((row) => row.xedruo_companies?.slug).filter(Boolean);
}

export async function saveCustomerContact({ countryCode, phoneE164 }) {
  const me = await xedruo.auth.me();
  const { error } = await supabase.from('xedruo_customer_profiles').update({
    country_code: countryCode,
    phone_e164: phoneE164,
    updated_at: new Date().toISOString(),
  }).eq('user_id', me.id);
  if (error) throw error;
  return ensureXedruoId();
}
