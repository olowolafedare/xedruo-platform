import { sql, hash, randomToken, signAccessToken, json, fail } from "../_lib/auth.js";

export default async function handler(req,res) {
  if (req.method!=="POST") return fail(res,405,"method_not_allowed","Use POST.");
  try {
    const { refresh_token, company_slug } = req.body || {};
    if (!refresh_token || !company_slug) return fail(res,400,"invalid_request","refresh_token and company_slug are required.");
    const rows = await sql.query("select id,user_id,company_slug,expires_at,revoked_at from public.xedruo_auth_sessions where refresh_token_hash=$1 and company_slug=$2 limit 1",[hash(refresh_token),String(company_slug)]);
    const session=rows[0];
    if (!session || session.revoked_at || new Date(session.expires_at).getTime()<=Date.now()) return fail(res,401,"invalid_refresh_token","Refresh token is invalid, expired or revoked.");
    const nextRefresh=randomToken(48);
    const updated=await sql.query("update public.xedruo_auth_sessions set refresh_token_hash=$2,expires_at=now()+interval '30 days',last_used_at=now() where id=$1 and refresh_token_hash=$3 and revoked_at is null returning id",[session.id,hash(nextRefresh),hash(refresh_token)]);
    if (!updated[0]) return fail(res,401,"refresh_token_reused","Refresh token has already been rotated.");
    const accessToken=signAccessToken({sub:session.user_id,sid:session.id,company_slug:session.company_slug});
    return json(res,200,{access_token:accessToken,token_type:"Bearer",expires_in:900,refresh_token:nextRefresh});
  } catch(e) {
    console.error("session_refresh_failed",e);
    return fail(res,500,"session_refresh_failed","Unable to refresh this session.");
  }
}
