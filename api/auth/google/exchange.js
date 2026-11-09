import { sql, hash, randomToken, signAccessToken, getCompany, json, fail } from "../../_lib/auth.js";

export default async function handler(req,res) {
  if (req.method !== "POST") return fail(res,405,"method_not_allowed","Use POST.");
  try {
    const { code, company_slug, callback_url, code_verifier } = req.body || {};
    if (!code || !company_slug || !callback_url || !code_verifier || String(code_verifier).length<43 || String(code_verifier).length>128) return fail(res,400,"invalid_request","Authorization code, company, callback URL and PKCE verifier are required.");
    const company = await getCompany(String(company_slug),String(callback_url));
    if (!company) return fail(res,403,"company_callback_not_allowed","Company or callback is not registered.");
    const rows = await sql.query("select * from public.xedruo_auth_codes where code_hash=$1 and company_slug=$2 and callback_url=$3 and consumed_at is null and expires_at>now() limit 1",[hash(code),String(company_slug),String(callback_url)]);
    const authCode = rows[0];
    if (!authCode) return fail(res,401,"invalid_authorization_code","The sign-in code is invalid or expired.");
    const challenge = Buffer.from(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(String(code_verifier)))).toString("base64url");
    if (challenge !== authCode.pkce_challenge) return fail(res,401,"pkce_verification_failed","PKCE verification failed.");
    const consumed = await sql.query("update public.xedruo_auth_codes set consumed_at=now() where code_hash=$1 and consumed_at is null returning user_id",[hash(code)]);
    if (!consumed[0]) return fail(res,401,"authorization_code_reused","This authorization code has already been used.");
    const userId = consumed[0].user_id;
    const sessionId = crypto.randomUUID();
    const refreshToken = randomToken(48);
    await sql.query("insert into public.xedruo_auth_sessions(id,user_id,refresh_token_hash,company_slug,expires_at) values($1,$2,$3,$4,now()+interval '30 days')",[sessionId,userId,hash(refreshToken),String(company_slug)]);
    await sql.query("insert into public.xedruo_company_memberships(user_id,company_slug,status,role) values($1,$2,'active','customer') on conflict(user_id,company_slug) do update set status='active'",[userId,String(company_slug)]);
    const accessToken = signAccessToken({sub:userId,sid:sessionId,company_slug:String(company_slug)});
    const profile = await sql.query("select a.id,a.status,p.full_name,p.avatar_url,i.xedruo_id,i.country_code,i.legal_name,i.phone_e164 from public.xedruo_accounts a left join public.xedruo_profiles p on p.id=a.id left join public.xedruo_identity i on i.user_id=a.id where a.id=$1 limit 1",[userId]);
    return json(res,200,{access_token:accessToken,token_type:"Bearer",expires_in:900,refresh_token:refreshToken,user:profile[0],identity_required:!profile[0]?.xedruo_id});
  } catch (e) {
    console.error("google_exchange_failed",e);
    return fail(res,500,"token_exchange_failed","Unable to establish the company session.");
  }
}
