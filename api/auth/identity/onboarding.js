import { randomInt } from "node:crypto";
import { sql, hash, requireSession, json, fail } from "../../_lib/auth.js";

export default async function handler(req,res) {
  if (req.method !== "POST") return fail(res,405,"method_not_allowed","Use POST.");
  try {
    const session = await requireSession(req);
    if (!session) return fail(res,401,"unauthorized","A valid Xedruo session is required.");
    const { country_code, phone_e164, legal_name } = req.body || {};
    const country = String(country_code || "").trim().toUpperCase();
    const phone = String(phone_e164 || "").trim();
    const name = String(legal_name || "").trim().replace(/\s+/g," ");
    if (!/^[A-Z]{2}$/.test(country) || !/^\+[1-9][0-9]{7,14}$/.test(phone) || name.length<3 || name.length>160) return fail(res,400,"invalid_identity_details","Enter a valid country, international phone number and full legal name.");
    const countries = await sql.query("select calling_code from public.xedruo_country_calling_codes where country_code=$1 limit 1",[country]);
    if (!countries[0] || !phone.startsWith(countries[0].calling_code)) return fail(res,400,"country_phone_mismatch","The phone number prefix must match the selected country.");
    const existing = await sql.query("select xedruo_id from public.xedruo_identity where user_id=$1 limit 1",[session.sub]);
    if (existing[0]) return json(res,200,{xedruo_id:existing[0].xedruo_id,already_issued:true});
    for (let attempt=0;attempt<8;attempt++) {
      const id = String(randomInt(1000000000, 10000000000));
      try {
        await sql.query("insert into public.xedruo_identity(user_id,xedruo_id,country_code,legal_name,phone_e164) values($1,$2,$3,$4,$5)",[session.sub,id,country,name,phone]);
        await sql.query("update public.xedruo_profiles set full_name=$2,updated_at=now() where id=$1",[session.sub,name]);
        await sql.query("insert into public.xedruo_auth_audit_logs(user_id,company_slug,event_type,details) values($1,$2,'identity_issued',$3::jsonb)",[session.sub,session.company_slug,JSON.stringify({country_code:country})]);
        return json(res,201,{xedruo_id:id,country_code:country,phone_e164:phone,phone_verified:false});
      } catch(e) {
        if (e.code==="23505") {
          const current = await sql.query("select xedruo_id from public.xedruo_identity where user_id=$1 limit 1",[session.sub]);
          if (current[0]) return json(res,200,{xedruo_id:current[0].xedruo_id,already_issued:true});
          if (attempt<7) continue;
          return fail(res,409,"phone_or_id_in_use","This phone number or generated identity is already in use.");
        }
        throw e;
      }
    }
  } catch(e) {
    console.error("identity_onboarding_failed",e);
    return fail(res,500,"identity_onboarding_failed","Unable to complete Xedruo identity onboarding.");
  }
}
