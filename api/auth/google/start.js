import { sql, hash, randomToken, fail } from "../../_lib/auth.js";

export default async function handler(req,res) {
  if (req.method !== "GET") return fail(res,405,"method_not_allowed","Use GET.");
  try {
    const { company_slug, callback_url, code_challenge, code_challenge_method } = req.query;
    if (!company_slug || !callback_url || !code_challenge || code_challenge_method !== "S256") {
      return fail(res,400,"invalid_request","company_slug, callback_url and an S256 PKCE code_challenge are required.");
    }
    const rows = await sql.query(
      "select company_slug, enabled, allowed_callbacks from public.xedruo_company_app_registry where company_slug=$1 limit 1",
      [String(company_slug)]
    );
    const company = rows[0];
    if (!company || !company.enabled || !(company.allowed_callbacks || []).includes(String(callback_url))) {
      return fail(res,403,"company_callback_not_allowed","This company or callback URL is not registered.");
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) return fail(res,503,"google_not_configured","Google OAuth credentials have not been configured in the central Xedruo Vercel project.");
    const state = randomToken(32);
    const nonce = randomToken(32);
    await sql.query(
      "insert into public.xedruo_oauth_transactions(state_hash,nonce_hash,pkce_challenge,company_slug,callback_url,expires_at) values($1,$2,$3,$4,$5,now()+interval '10 minutes')",
      [hash(state),hash(nonce),String(code_challenge),String(company_slug),String(callback_url)]
    );
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id",clientId);
    url.searchParams.set("redirect_uri",process.env.XEDRUO_GOOGLE_REDIRECT_URI || "https://xedruo.com/api/auth/google/callback");
    url.searchParams.set("response_type","code");
    url.searchParams.set("scope","openid email profile");
    url.searchParams.set("state",state);
    url.searchParams.set("nonce",nonce);
    url.searchParams.set("prompt","select_account");
    return res.redirect(302,url.toString());
  } catch (e) {
    console.error("google_start_failed",e);
    return fail(res,500,"auth_start_failed","Unable to start Google sign-in.");
  }
}
