import { xedruo, supabase } from "@/api/xedruoClient";

// Xedruo identity is global. A single authenticated user may belong to many
// operating companies; company membership is the bridge, never a second auth account.

function generateCandidate() {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

export async function ensureXedruoId() {
  const { data: customerProfile, error: profileError } = await supabase.rpc("ensure_xedruo_customer_profile");
  if (!profileError && customerProfile?.xedruo_account_number) {
    return { xedruoId: customerProfile.xedruo_account_number, created: false };
  }

  const me = await xedruo.auth.me();
  const { data: existing, error: readError } = await supabase
    .from("xedruo_identity")
    .select("xedruo_id")
    .eq("user_id", me.id)
    .maybeSingle();
  if (readError) throw readError;
  if (existing?.xedruo_id) return { xedruoId: existing.xedruo_id, created: false };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateCandidate();
    const { data, error } = await supabase
      .from("xedruo_identity")
      .insert({ user_id: me.id, xedruo_id: candidate })
      .select("xedruo_id")
      .single();
    if (!error && data?.xedruo_id) return { xedruoId: data.xedruo_id, created: true };
    if (error?.code !== "23505") throw error;
  }
  throw new Error("Could not allocate a unique Xedruo ID. Please try again.");
}

export async function getXedruoId() {
  const me = await xedruo.auth.me();
  const { data, error } = await supabase.from("xedruo_identity").select("xedruo_id").eq("user_id", me.id).maybeSingle();
  if (error) throw error;
  return data?.xedruo_id || null;
}

// UI/company slugs can be short branded slugs while the canonical database
// company registry uses the legal/platform slugs. Keep this mapping in one place.
const COMPANY_SLUGS = {
  "pay-bank": "xedruo",
  "pay-and-play": "xedruo",
  "music-distribution": "xedruo-music-distribution",
  "xedruo-ai": "xedruo-ai",
  "education": "xedruo-education",
  "capital": "xedruo-capital",
  "energy": "xedruo-energy",
  "logistics": "xedruo-logistics",
  "properties": "xedruo-properties",
  "spacetruo": "spacetruo",
  "healthruo": "healthruo",
  "hireuo": "hireuo",
  "agruo": "agruo",
  "sportruo": "sportruo",
  "adom": "adom",
  "xedruo": "xedruo",
  "group-holdings": "xedruo-group-holdings",
  "xedruo-group-holdings": "xedruo-group-holdings",
};

export function canonicalCompanySlug(slug) {
  const value = String(slug || "").trim().toLowerCase();
  return COMPANY_SLUGS[value] || value;
}

export async function linkCompany(slug) {
  const canonicalSlug = canonicalCompanySlug(slug);
  if (!canonicalSlug) return null;
  const me = await xedruo.auth.me();
  if (!me?.id) throw new Error("Authentication required");

  // Server-controlled RPC creates only a normal user membership and prevents
  // clients from assigning themselves privileged company roles.
  const { data, error } = await supabase.rpc("join_xedruo_company", { p_company_slug: canonicalSlug });
  if (error) throw error;
  return data?.[0] || null;
}

export async function getCompanyMembership(slug) {
  const canonicalSlug = canonicalCompanySlug(slug);
  const me = await xedruo.auth.me();
  const { data, error } = await supabase
    .from("xedruo_company_memberships")
    .select("id,company_id,role,active,xedruo_companies(name,slug)")
    .eq("user_id", me.id)
    .eq("active", true)
    .eq("xedruo_companies.slug", canonicalSlug)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getLinkedCompanies() {
  const me = await xedruo.auth.me();
  const { data, error } = await supabase
    .from("xedruo_company_memberships")
    .select("company_id,role,xedruo_companies(name,slug)")
    .eq("user_id", me.id)
    .eq("active", true);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.company_id,
    role: row.role,
    name: row.xedruo_companies?.name,
    slug: row.xedruo_companies?.slug,
  })).filter((company) => company.slug);
}

export async function saveCustomerContact({ countryCode, phoneE164 }) {
  const me = await xedruo.auth.me();
  const { error } = await supabase.from("xedruo_customer_profiles").update({
    country_code: countryCode,
    phone_e164: phoneE164,
    updated_at: new Date().toISOString(),
  }).eq("user_id", me.id);
  if (error) throw error;
  return ensureXedruoId();
}
