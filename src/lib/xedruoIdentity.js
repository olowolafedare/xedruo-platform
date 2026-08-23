import { xedruo, supabase } from "@/api/xedruoClient";

// Standalone Xedruo identity layer backed by Supabase.
// One unique 10-digit Xedruo ID is shared across the entire Xedruo ecosystem.

function generateCandidate() {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

export async function ensureXedruoId() {
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
  const { data: company, error: companyError } = await supabase.from('xedruo_companies').select('company_number').eq('slug', slug).maybeSingle();
  if (companyError) throw companyError;
  if (!company) throw new Error('Company not found');
  const { error } = await supabase.from('company_members').upsert({ company_number: company.company_number, user_id: me.id, role: 'user' }, { onConflict: 'company_number,user_id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function getLinkedCompanies() {
  const me = await xedruo.auth.me();
  const { data, error } = await supabase
    .from('company_members')
    .select('company_number,xedruo_companies(name,slug)')
    .eq('user_id', me.id);
  if (error) throw error;
  return (data || []).map((row) => row.xedruo_companies?.slug).filter(Boolean);
}
