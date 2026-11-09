import { sql, hash, randomToken, GOOGLE_REDIRECT_URI, fail } from "../../_lib/auth.js";

export default async function handler(req,res) {
  if (req.method !== "GET") return fail(res,405,"method_not_allowed","Use GET.");
  const { code, state, error } = req.query;
  if (error) return fail(res,400,"google_auth_denied","Google sign-in was cancelled or denied.");
  if (!code || !state) return fail(res,400,"invalid_oauth_response","Missing Google authorization code or state.");
  try {
    const txRows = await sql.query(
      "select * from public.xedruo_oauth_transactions where state_hash=$1 and consumed_at is null and expires_at>now() limit 1",
      [hash(state)]
    );
    const tx = txRows[0];
    if (!tx) return fail(res,400,"invalid_oauth_state","The sign-in request expired or is invalid. Start again.");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token",{
      method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({code:String(code),client_id:process.env.GOOGLE_CLIENT_ID || "",client_secret:process.env.GOOGLE_CLIENT_SECRET || "",redirect_uri:GOOGLE_REDIRECT_URI,grant_type:"authorization_code"})
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.id_token) return fail(res,401,"google_token_exchange_failed","Google could not verify this sign-in.");
    const verifyResponse = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token="+encodeURIComponent(tokenData.id_token));
    const claims = await verifyResponse.json();
    const validIssuer = ["accounts.google.com","https://accounts.google.com"].includes(claims.iss);
    if (!verifyResponse.ok || claims.aud !== process.env.GOOGLE_CLIENT_ID || !validIssuer || Number(claims.exp)*1000<=Date.now() || (!claims.nonce || hash(claims.nonce)!==tx.nonce_hash) || claims.email_verified !== "true") {
      return fail(res,401,"invalid_google_identity","Google identity verification failed.");
    }
    const subject = String(claims.sub || "");
    const email = String(claims.email || "").trim().toLowerCase();
    if (!subject || !email) return fail(res,401,"google_identity_incomplete","Google did not return a verified email identity.");
    await sql.query("update public.xedruo_oauth_transactions set consumed_at=now() where state_hash=$1 and consumed_at is null",[hash(state)]);
    let linked = await sql.query("select user_id from public.xedruo_oauth_identities where provider='google' and provider_subject=$1 limit 1",[subject]);
    let userId = linked[0]?.user_id;
    if (!userId) {
      const byEmail = await sql.query("select user_id from public.xedruo_oauth_identities where lower(email)=lower($1) limit 1",[email]);
      userId = byEmail[0]?.user_id;
    }
    if (!userId) {
      const created = await sql.query("insert into public.xedruo_accounts(status,account_type) values('active','individual') returning id");
      userId = created[0].id;
      await sql.query("insert into public.xedruo_profiles(id,full_name,avatar_url) values($1,$2,$3)",[userId,String(claims.name || ""),String(claims.picture || "")]);
    }
    await sql.query(
      "insert into public.xedruo_oauth_identities(user_id,provider,provider_subject,email,email_verified) values($1,'google',$2,$3,true) on conflict(provider,provider_subject) do update set email=excluded.email,email_verified=true",
      [userId,subject,email]
    );
    const authCode = randomToken(32);
    await sql.query(
      "insert into public.xedruo_auth_codes(code_hash,user_id,company_slug,callback_url,pkce_challenge,expires_at) values($1,$2,$3,$4,$5,now()+interval '2 minutes')",
      [hash(authCode),userId,tx.company_slug,tx.callback_url,tx.pkce_challenge]
    );
    const destination = new URL(tx.callback_url);
    destination.searchParams.set("code",authCode);
    return res.redirect(302,destination.toString());
  } catch (e) {
    console.error("google_callback_failed",e);
    return fail(res,500,"google_callback_failed","Unable to complete Google sign-in.");
  }
}
