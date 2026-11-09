import { sql, requireSession, json, fail } from "../_lib/auth.js";

export default async function handler(req,res) {
  if (req.method !== "GET") return fail(res,405,"method_not_allowed","Use GET.");
  try {
    const session = await requireSession(req);
    if (!session) return fail(res,401,"unauthorized","Session is invalid or expired.");
    const rows = await sql.query("select a.id,a.status,p.full_name,p.avatar_url,i.xedruo_id,i.country_code,i.legal_name,i.phone_e164 from public.xedruo_accounts a left join public.xedruo_profiles p on p.id=a.id left join public.xedruo_identity i on i.user_id=a.id where a.id=$1 limit 1",[session.sub]);
    if (!rows[0] || rows[0].status!=="active") return fail(res,403,"account_unavailable","This Xedruo account is unavailable.");
    return json(res,200,{authenticated:true,company_slug:session.company_slug,user:rows[0],identity_required:!rows[0].xedruo_id});
  } catch(e) {
    console.error("session_validation_failed",e);
    return fail(res,500,"session_validation_failed","Unable to validate this session.");
  }
}
