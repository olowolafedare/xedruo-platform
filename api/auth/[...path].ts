/**
 * Xedruo central identity gateway — Vercel Node.js Function + Neon PostgreSQL.
 * Path: api/auth/[...path].ts
 * Uses the existing Neon xedruo_* schema and existing Vercel environment variables.
 * No Supabase SDK, URL, key, Edge Function, or RPC dependency.
 */
import { Pool } from "@neondatabase/serverless";
import {
  randomBytes, randomInt, createHash, createHmac, timingSafeEqual,
  scrypt as scryptCallback, createPublicKey, verify as verifySignature,
} from "node:crypto";
import { promisify } from "node:util";
import type { IncomingMessage, ServerResponse } from "node:http";

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error("Missing environment variable: " + name);
  return value;
};
const pool = new Pool({ connectionString: required("DATABASE_URL"), max: 5 });
type QueryExecutor = { query<T = any>(text: string, values?: any[]): Promise<{ rows: T[]; rowCount?: number | null }> };
type DbClient = QueryExecutor & { release(): void };
async function connectDb(): Promise<DbClient> { return await pool.connect() as unknown as DbClient; }
const signingSecret = Buffer.from(required("XEDRUO_SESSION_SIGNING_SECRET"), "utf8");
if (signingSecret.length < 32) throw new Error("XEDRUO_SESSION_SIGNING_SECRET must be at least 32 bytes");
const issuer = process.env.AUTH_ISSUER || "https://xedruo.com";
const googleClientId = required("GOOGLE_CLIENT_ID");
const googleClientSecret = required("GOOGLE_CLIENT_SECRET");
const googleRedirectUri = process.env.XEDRUO_GOOGLE_REDIRECT_URI || "https://xedruo.com/api/auth/google/callback";
if (new URL(googleRedirectUri).origin !== "https://xedruo.com" || new URL(googleRedirectUri).pathname !== "/api/auth/google/callback") throw new Error("Invalid central Google redirect URI");
const accessTtl = 900;
const refreshDays = 30;
const scrypt = promisify(scryptCallback);
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const randomToken = (n = 32) => randomBytes(n).toString("base64url");
const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
const reply = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
const fail = (code: string, message: string, status = 400, headers: Record<string, string> = {}) =>
  reply({ error: code, message }, status, headers);
const originOf = (v: string | null) => {
  try { return v ? new URL(v).origin : null; } catch { return null; }
};
const cors = (origin: string) => ({
  "access-control-allow-origin": origin,
  "access-control-allow-headers": "authorization, content-type, x-xedruo-company",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-max-age": "600",
  "vary": "Origin",
});
const withCors = (response: Response, origin: string) => {
  const h = new Headers(response.headers);
  for (const [k, v] of Object.entries(cors(origin))) h.set(k, v);
  return new Response(response.body, { status: response.status, headers: h });
};
type Company = { company_slug: string; display_name: string; app_origin: string; allowed_callbacks: string[]; enabled: boolean };
type Identity = { user_id: string; xedruo_id: string; country_code: string; legal_name: string | null; phone_e164: string | null; status: string };
type Claims = { iss: string; aud: string; sub: string; exp: number; company: string; sid: string };
async function getCompany(slug: string): Promise<Company | null> {
  // Holding platform is the administration console, not a customer login application.
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug) || slug === "xedruo") return null;
  const r = await pool.query<Company>(
    "SELECT company_slug,display_name,app_origin,allowed_callbacks,enabled FROM xedruo_company_app_registry WHERE company_slug=$1 AND enabled=true AND app_origin IS NOT NULL",
    [slug],
  );
  return r.rows[0] || null;
}
async function verifiedCompany(req: Request, slug: string) {
  const origin = originOf(req.headers.get("origin"));
  const company = await getCompany(slug);
  // Platform-hosted customer auth may call the gateway for a registered company.
  const platformOrigin = originOf(issuer);
  if (!origin || !company || (originOf(company.app_origin) !== origin && platformOrigin !== origin)) return null;
  return { company, origin };
}
async function audit(event: string, userId: string | null, company: string | null, details: Record<string, unknown> = {}) {
  await pool.query(
    "INSERT INTO xedruo_auth_audit_logs(user_id,company_slug,event_type,details) VALUES($1,$2,$3,$4::jsonb)",
    [userId, company, event, JSON.stringify(details)],
  ).catch((e) => console.error("auth_audit_write_failed", e));
}
async function identityFor(userId: string): Promise<Identity | null> {
  const r = await pool.query<Identity>(
    "SELECT user_id,xedruo_id,country_code,legal_name,phone_e164,status FROM xedruo_identity WHERE user_id=$1",
    [userId],
  );
  return r.rows[0] || null;
}
async function accountActive(userId: string) {
  const r = await pool.query<{ status: string }>("SELECT status FROM xedruo_accounts WHERE id=$1", [userId]);
  return r.rows[0]?.status === "active";
}
function signJwt(userId: string, company: string, sid: string) {
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const p = Buffer.from(JSON.stringify({ iss: issuer, aud: company, sub: userId, iat: now, exp: now + accessTtl, company, sid })).toString("base64url");
  const input = h + "." + p;
  return input + "." + createHmac("sha256", signingSecret).update(input).digest("base64url");
}
function verifyJwt(token: string, company: string): Claims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (header.alg !== "HS256") return null;
    const input = parts[0] + "." + parts[1];
    const expected = createHmac("sha256", signingSecret).update(input).digest();
    const actual = Buffer.from(parts[2], "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const c = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Claims;
    if (c.iss !== issuer || c.aud !== company || c.company !== company || c.exp <= Math.floor(Date.now() / 1000) || !c.sub || !c.sid) return null;
    return c;
  } catch { return null; }
}
async function authenticate(req: Request, company: string) {
  const match = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const claims = verifyJwt(match[1], company);
  if (!claims || !(await accountActive(claims.sub))) return null;
  const identity = await identityFor(claims.sub);
  if (identity && identity.status !== "active") return null;
  const session = await pool.query(
    "SELECT id FROM xedruo_auth_sessions WHERE id=$1 AND user_id=$2 AND company_slug=$3 AND revoked_at IS NULL AND expires_at>now()",
    [claims.sid, claims.sub, company],
  );
  return session.rows.length ? { claims, userId: claims.sub } : null;
}
async function issueSession(userId: string, company: string, req: Request, db: QueryExecutor = pool) {
  const refresh = randomToken(48);
  const expiry = new Date(Date.now() + refreshDays * 86400000);
  const r = await db.query<{ id: string }>(
    "INSERT INTO xedruo_auth_sessions(user_id,refresh_token_hash,company_slug,expires_at,user_agent) VALUES($1,$2,$3,$4,$5) RETURNING id",
    [userId, sha(refresh), company, expiry, req.headers.get("user-agent")?.slice(0, 500) || null],
  );
  return {
    access_token: signJwt(userId, company, r.rows[0].id),
    refresh_token: refresh,
    token_type: "Bearer",
    expires_in: accessTtl,
    refresh_expires_at: expiry.toISOString(),
  };
}
async function makeId(db: QueryExecutor) {
  for (let i = 0; i < 20; i++) {
    const id = String(randomInt(1000000000, 10000000000));
    const r = await db.query("SELECT 1 FROM xedruo_identity WHERE xedruo_id=$1", [id]);
    if (!r.rows.length) return id;
  }
  throw new Error("ID allocation failed; retry");
}
async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64) as Buffer;
  return "scrypt$" + salt.toString("base64url") + "$" + hash.toString("base64url");
}
async function checkPassword(password: string, encoded: string) {
  const parts = encoded.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "base64url");
    const expected = Buffer.from(parts[2], "base64url");
    const actual = await scrypt(password, salt, expected.length) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}
type GoogleJwk = { kid?: string; kty?: string; n?: string; e?: string };
let googleKeys: { keys: GoogleJwk[]; expires: number } | null = null;
async function verifyGoogleToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("google_token_invalid");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  if (header.alg !== "RS256" || !header.kid) throw new Error("google_token_invalid");
  if (!googleKeys || googleKeys.expires < Date.now()) {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/certs", { cache: "no-store" });
    if (!response.ok) throw new Error("google_keys_unavailable");
    const body = await response.json() as { keys?: GoogleJwk[] };
    googleKeys = { keys: body.keys || [], expires: Date.now() + 30 * 60 * 1000 };
  }
  const jwk = googleKeys.keys.find((k) => k.kid === header.kid && k.kty === "RSA");
  if (!jwk) { googleKeys = null; throw new Error("google_key_missing"); }
  const key = createPublicKey({ key: jwk as any, format: "jwk" });
  if (!verifySignature("RSA-SHA256", Buffer.from(parts[0] + "." + parts[1]), key, Buffer.from(parts[2], "base64url"))) throw new Error("google_token_invalid");
  const p = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);
  if (p.aud !== googleClientId || !["https://accounts.google.com", "accounts.google.com"].includes(String(p.iss)) ||
      typeof p.exp !== "number" || p.exp <= now || typeof p.iat !== "number" || p.iat > now + 60) throw new Error("google_token_invalid");
  return p;
}
async function parseBody(req: Request) {
  const raw = await req.text();
  if (raw.length > 12000) throw new Error("payload_too_large");
  try { return JSON.parse(raw || "{}") as Record<string, unknown>; } catch { throw new Error("invalid_json"); }
}
const displayIdentity = (i: Identity) => ({ xedruo_id: i.xedruo_id.trim(), country_code: i.country_code, legal_name: i.legal_name });
const missingIdentity = (i: Identity | null) => [
  !i?.country_code && "country",
  !i?.phone_e164 && "phone",
  !i?.legal_name?.trim() && "legal_name",
  !i?.xedruo_id && "xedruo_id",
].filter(Boolean);

async function getHandler(req: Request, path: string) {
  const url = new URL(req.url);
  if (path === "google/start") {
    // Top-level navigation avoids browser CORS/fetch restrictions entirely.
    // Validate the callback against the registered company origin and allowlist.
    const slug = (url.searchParams.get("companySlug") || "").trim().toLowerCase();
    const callbackUrl = url.searchParams.get("callbackUrl") || "";
    const state = url.searchParams.get("state") || "";
    const challenge = url.searchParams.get("codeChallenge") || "";
    const countryCode = (url.searchParams.get("countryCode") || "").trim().toUpperCase();
    const phoneE164 = (url.searchParams.get("phoneE164") || "").trim();
    const legalName = (url.searchParams.get("legalName") || "").trim().replace(/\s+/g, " ");
    const hasRegistration = Boolean(countryCode || phoneE164 || legalName);
    const company = await getCompany(slug);
    if (!company || !company.allowed_callbacks.includes(callbackUrl) || originOf(callbackUrl) !== originOf(company.app_origin) || !state || state.length > 256 || !/^[A-Za-z0-9_-]{43,128}$/.test(challenge)) {
      return fail("invalid_oauth_request", "Company, callback URL, state or PKCE challenge is invalid.", 400);
    }
    let registration: { countryCode: string; phoneE164: string; legalName: string } | null = null;
    if (hasRegistration) {
      if (!/^[A-Z]{2}$/.test(countryCode) || !/^\+[1-9][0-9]{7,14}$/.test(phoneE164) || legalName.length < 3 || legalName.length > 160) {
        return fail("invalid_registration", "Select a country and enter a valid phone number and full legal name.", 400);
      }
      const country = await pool.query<{ calling_code: string }>("SELECT calling_code FROM xedruo_country_calling_codes WHERE country_code=$1", [countryCode]);
      if (!country.rows[0] || !phoneE164.startsWith(country.rows[0].calling_code)) {
        return fail("country_phone_mismatch", "The phone calling code does not match the selected country.", 400);
      }
      registration = { countryCode, phoneE164, legalName };
    }
    const googleState = randomToken(32);
    const nonce = randomToken(32);
    const statePart = Buffer.from(state, "utf8").toString("base64url");
    const registrationPart = registration ? "." + Buffer.from(JSON.stringify(registration), "utf8").toString("base64url") : "";
    const combined = googleState + "." + statePart + registrationPart;
    await pool.query(
      "INSERT INTO xedruo_oauth_transactions(state_hash,nonce_hash,pkce_challenge,company_slug,callback_url,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '10 minutes')",
      [sha(googleState), sha(nonce), challenge, company.company_slug, callbackUrl],
    );
    const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    google.search = new URLSearchParams({ client_id: googleClientId, redirect_uri: googleRedirectUri, response_type: "code", scope: "openid email profile", state: combined, nonce, prompt: "select_account" }).toString();
    return new Response(null, { status: 302, headers: { location: google.toString(), "cache-control": "no-store" } });
  }
  if (path === "countries") {
    // Public registration metadata. Same-origin GET requests may omit Origin,
    // so validate the company slug without requiring a browser Origin header.
    const slug = (url.searchParams.get("companySlug") || "").trim().toLowerCase();
    const company = await getCompany(slug);
    if (!company) return fail("company_not_authorized", "Company is not registered or enabled.", 403);
    const r = await pool.query("SELECT country_code,calling_code,country_name FROM xedruo_country_calling_codes ORDER BY country_name");
    return reply({ countries: r.rows });
  }
  const reg = path.match(/^registry\/([a-z0-9-]{2,63})$/);
  if (reg) {
    const verified = await verifiedCompany(req, reg[1]);
    if (!verified) return fail("origin_not_registered", "This origin is not registered for that company.", 403);
    return withCors(reply({ slug: verified.company.company_slug, name: verified.company.display_name }), verified.origin);
  }
  if (path === "identity/me") {
    const slug = url.searchParams.get("companySlug") || "";
    const verified = await verifiedCompany(req, slug);
    if (!verified) return fail("company_not_authorized", "Company origin is not registered.", 403);
    const auth = await authenticate(req, slug);
    if (!auth) return withCors(fail("unauthenticated", "Sign in required.", 401), verified.origin);
    const identity = await identityFor(auth.userId);
    return withCors(reply({ identity: identity ? displayIdentity(identity) : null, missing: missingIdentity(identity) }), verified.origin);
  }
  return fail("not_found", "Unknown route.", 404);
}
async function postHandler(req: Request, path: string) {
  const body = await parseBody(req);
  const slug = String(body.companySlug || req.headers.get("x-xedruo-company") || "").trim().toLowerCase();
  const verified = await verifiedCompany(req, slug);
  if (!verified) return fail("company_not_authorized", "This app origin is not registered for that company.", 403);
  const company = verified.company;
  let response: Response;

  if (path === "google/complete") return withCors(await googleCallback(req, body, company), verified.origin);

  if (path === "id/login") {
    const login = String(body.login || body.xedruoId || "").trim();
    const password = String(body.password || "");
    if (!(/^\d{10}$/.test(login) || /^\+[1-9][0-9]{7,14}$/.test(login) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login)) || !password || password.length > 128) {
      return withCors(fail("invalid_credentials", "Enter your email, Xedruo ID or phone number and password.", 401), verified.origin);
    }
    const idKey = sha("login:" + login);
    const ipKey = sha("ip:" + (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim());
    await pool.query("INSERT INTO xedruo_auth_rate_limits(bucket_key) VALUES($1),($2)", [idKey, ipKey]);
    const lim = await pool.query<{ bucket_key: string; attempts: string }>(
      "SELECT bucket_key,count(*)::text AS attempts FROM xedruo_auth_rate_limits WHERE bucket_key=ANY($1::char(64)[]) AND attempted_at>now()-interval '15 minutes' GROUP BY bucket_key",
      [[idKey, ipKey]],
    );
    const blocked = lim.rows.some((x) => Number(x.attempts) > (x.bucket_key.trim() === idKey ? 5 : 20));
    const found = blocked ? { rows: [] as { user_id: string; password_hash: string }[] } :
      await pool.query<{ user_id: string; password_hash: string }>(
        "SELECT c.user_id,c.password_hash FROM xedruo_credentials c LEFT JOIN xedruo_identity i ON i.user_id=c.user_id LEFT JOIN xedruo_oauth_identities o ON o.user_id=c.user_id AND o.email_verified=true WHERE (i.xedruo_id=$1 OR i.phone_e164=$1 OR lower(o.email)=lower($1)) AND (i.status='active' OR i.status IS NULL) LIMIT 1",
        [login],
      );
    const user = found.rows[0];
    const ok = user ? await checkPassword(password, user.password_hash) : (await scrypt(password, Buffer.alloc(16), 64), false);
    if (blocked || !user || !ok || !(await accountActive(user.user_id))) {
      await audit("id_login_failed", null, company.company_slug);
      return withCors(fail("invalid_credentials", "Incorrect Xedruo ID or password.", 401), verified.origin);
    }
    await pool.query("DELETE FROM xedruo_auth_rate_limits WHERE bucket_key=$1", [idKey]);
    const callbackUrl = String(body.callbackUrl || "");
    const state = String(body.state || "");
    const challenge = String(body.codeChallenge || "");
    if (callbackUrl || state || challenge) {
      if (!company.allowed_callbacks.includes(callbackUrl) || originOf(callbackUrl) !== originOf(company.app_origin) || !state || state.length > 256 || !/^[A-Za-z0-9_-]{43,128}$/.test(challenge)) {
        return withCors(fail("invalid_oauth_request", "Company callback, state or PKCE challenge is invalid.", 400), verified.origin);
      }
      const authCode = randomToken(32);
      await pool.query("INSERT INTO xedruo_auth_codes(code_hash,user_id,company_slug,callback_url,pkce_challenge,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '90 seconds')", [sha(authCode), user.user_id, company.company_slug, callbackUrl, challenge]);
      await audit("email_login_succeeded", user.user_id, company.company_slug);
      return withCors(reply({ code: authCode, state, callbackUrl }), verified.origin);
    }
    const session = await issueSession(user.user_id, company.company_slug, req);
    await audit("id_login_succeeded", user.user_id, company.company_slug);
    return withCors(reply({ status: "authenticated", session }), verified.origin);
  }

  if (path === "google/start") {
    const callbackUrl = String(body.callbackUrl || "");
    const state = String(body.state || "");
    const challenge = String(body.codeChallenge || "");
    if (!company.allowed_callbacks.includes(callbackUrl) || !state || state.length > 256 || !/^[A-Za-z0-9_-]{43,128}$/.test(challenge)) {
      return withCors(fail("invalid_oauth_request", "Callback URL, state or PKCE challenge is invalid.", 400), verified.origin);
    }
    const googleState = randomToken(32);
    const nonce = randomToken(32);
    const combined = googleState + "." + Buffer.from(state, "utf8").toString("base64url");
    await pool.query(
      "INSERT INTO xedruo_oauth_transactions(state_hash,nonce_hash,pkce_challenge,company_slug,callback_url,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '10 minutes')",
      [sha(googleState), sha(nonce), challenge, company.company_slug, callbackUrl],
    );
    const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    google.search = new URLSearchParams({
      client_id: googleClientId, redirect_uri: googleRedirectUri, response_type: "code",
      scope: "openid email profile", state: combined, nonce, prompt: "select_account",
    }).toString();
    return withCors(reply({ authorization_url: google.toString(), state }), verified.origin);
  }

  if (path === "oauth/exchange") {
    const code = String(body.code || "");
    const verifier = String(body.codeVerifier || "");
    const callbackUrl = String(body.callbackUrl || "");
    if (!company.allowed_callbacks.includes(callbackUrl) || !code || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) {
      return withCors(fail("invalid_code", "Authorization code, callback or PKCE verifier is invalid.", 400), verified.origin);
    }
    const db = await connectDb();
    try {
      await db.query("BEGIN");
      const r = await db.query<{ user_id: string; pkce_challenge: string }>(
        "SELECT user_id,pkce_challenge FROM xedruo_auth_codes WHERE code_hash=$1 AND company_slug=$2 AND callback_url=$3 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",
        [sha(code), company.company_slug, callbackUrl],
      );
      const row = r.rows[0];
      const challenge = createHash("sha256").update(verifier).digest("base64url");
      if (!row || !safeEqual(challenge, row.pkce_challenge) || !(await accountActive(row.user_id))) throw new Error("code_invalid");
      const identity = await identityFor(row.user_id);
      if (identity && identity.status !== "active") throw new Error("identity_blocked");
      await db.query("UPDATE xedruo_auth_codes SET consumed_at=now() WHERE code_hash=$1", [sha(code)]);
      const session = await issueSession(row.user_id, company.company_slug, req, db);
      await db.query("COMMIT");
      return withCors(reply({ session }), verified.origin);
    } catch {
      await db.query("ROLLBACK").catch(() => undefined);
      return withCors(fail("invalid_code", "Authorization code is invalid, expired or already used.", 401), verified.origin);
    } finally { db.release(); }
  }

  if (path === "identity/onboarding") {
    const auth = await authenticate(req, company.company_slug);
    if (!auth) return withCors(fail("unauthenticated", "Sign in required.", 401), verified.origin);
    const countryCode = String(body.countryCode || "").trim().toUpperCase();
    const phone = String(body.phoneE164 || "").trim();
    const name = String(body.legalName || "").trim().replace(/\s+/g, " ");
    if (!/^[A-Z]{2}$/.test(countryCode) || !/^\+[1-9][0-9]{7,14}$/.test(phone) || name.length < 3 || name.length > 160) {
      return withCors(fail("invalid_onboarding", "Enter a valid country, international phone number and full legal name.", 400), verified.origin);
    }
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const country = await db.query<{ calling_code: string }>("SELECT calling_code FROM xedruo_country_calling_codes WHERE country_code=$1", [countryCode]);
      if (!country.rows[0] || !phone.startsWith(country.rows[0].calling_code)) throw new Error("country_phone_mismatch");
      const old = await db.query<Identity>("SELECT user_id,xedruo_id,country_code,legal_name,phone_e164,status FROM xedruo_identity WHERE user_id=$1 FOR UPDATE", [auth.userId]);
      if (old.rows[0]?.status !== undefined && old.rows[0]?.status !== "active") throw new Error("identity_blocked");
      if (old.rows[0]?.country_code && old.rows[0].country_code !== countryCode) throw new Error("country_locked");
      const xedruoId = old.rows[0]?.xedruo_id || await makeId(db);
      await db.query(
        "INSERT INTO xedruo_identity(user_id,xedruo_id,country_code,legal_name,phone_e164) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id) DO UPDATE SET legal_name=EXCLUDED.legal_name,phone_e164=EXCLUDED.phone_e164,updated_at=now()",
        [auth.userId, xedruoId, countryCode, name, phone],
      );
      await db.query("INSERT INTO xedruo_profiles(id,full_name) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET full_name=EXCLUDED.full_name,updated_at=now()", [auth.userId, name]);
      await db.query("COMMIT");
      const identity = await identityFor(auth.userId);
      await audit("onboarding_completed", auth.userId, company.company_slug, { countryCode });
      return withCors(reply({ identity: identity ? displayIdentity(identity) : null, phone_verification_required: false }), verified.origin);
    } catch (e) {
      await db.query("ROLLBACK").catch(() => undefined);
      const msg = e instanceof Error ? e.message : "";
      const code = msg === "country_phone_mismatch" ? "country_phone_mismatch" : msg === "country_locked" ? "country_locked" : msg === "identity_blocked" ? "identity_blocked" : (e as { code?: string }).code === "23505" ? "already_in_use" : "onboarding_failed";
      return withCors(fail(code, code === "country_phone_mismatch" ? "The phone calling code does not match the selected country." : code === "country_locked" ? "The country on an issued Xedruo ID cannot be changed." : code === "identity_blocked" ? "This identity is suspended or deactivated." : code === "already_in_use" ? "That phone number is already linked to another account." : "Could not complete onboarding.", 409), verified.origin);
    } finally { db.release(); }
  }

  if (path === "session/refresh") {
    const token = String(body.refreshToken || "");
    if (token.length < 32) return withCors(fail("invalid_refresh_token", "Refresh token is invalid.", 401), verified.origin);
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const r = await db.query<{ id: string; user_id: string }>(
        "SELECT id,user_id FROM xedruo_auth_sessions WHERE refresh_token_hash=$1 AND company_slug=$2 AND revoked_at IS NULL AND expires_at>now() FOR UPDATE",
        [sha(token), company.company_slug],
      );
      if (!r.rows[0] || !(await accountActive(r.rows[0].user_id))) throw new Error("refresh_invalid");
      const identity = await identityFor(r.rows[0].user_id);
      if (identity && identity.status !== "active") throw new Error("refresh_invalid");
      await db.query("UPDATE xedruo_auth_sessions SET revoked_at=now() WHERE id=$1", [r.rows[0].id]);
      const session = await issueSession(r.rows[0].user_id, company.company_slug, req, db);
      await db.query("COMMIT");
      return withCors(reply({ session }), verified.origin);
    } catch {
      await db.query("ROLLBACK").catch(() => undefined);
      return withCors(fail("invalid_refresh_token", "Refresh token is invalid or expired.", 401), verified.origin);
    } finally { db.release(); }
  }

  const auth = await authenticate(req, company.company_slug);
  if (!auth) return withCors(fail("unauthenticated", "Sign in required.", 401), verified.origin);

  if (path === "session/validate") {
    const identity = await identityFor(auth.userId);
    if (!identity || !identity.xedruo_id || !identity.phone_e164 || !identity.legal_name?.trim()) {
      return withCors(reply({ status: "onboarding_required", missing: missingIdentity(identity), company: { slug: company.company_slug, name: company.display_name } }), verified.origin);
    }
    if (identity.status !== "active") return withCors(fail("identity_suspended", "This Xedruo identity is not active.", 403), verified.origin);
    await pool.query("INSERT INTO xedruo_company_memberships(user_id,company_slug,status,role) VALUES($1,$2,'active','customer') ON CONFLICT(user_id,company_slug) DO NOTHING", [auth.userId, company.company_slug]);
    const membership = await pool.query<{ status: string; role: string }>("SELECT status,role FROM xedruo_company_memberships WHERE user_id=$1 AND company_slug=$2", [auth.userId, company.company_slug]);
    if (membership.rows[0]?.status !== "active") return withCors(fail("company_access_denied", "Your access to this company is suspended or revoked.", 403), verified.origin);
    await audit("access_granted", auth.userId, company.company_slug);
    return withCors(reply({ status: "granted", company: { slug: company.company_slug, name: company.display_name }, identity: displayIdentity(identity), role: membership.rows[0].role }), verified.origin);
  }

  if (path === "session/logout") {
    await pool.query("UPDATE xedruo_auth_sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2", [auth.claims.sid, auth.userId]);
    await audit("session_logout", auth.userId, company.company_slug);
    return withCors(reply({ status: "signed_out" }), verified.origin);
  }

  if (path === "credentials/password") {
    const password = String(body.password || "");
    if (password.length < 12 || password.length > 128) return withCors(fail("weak_password", "Password must be 12 to 128 characters.", 400), verified.origin);
    const hash = await hashPassword(password);
    await pool.query("INSERT INTO xedruo_credentials(user_id,password_hash) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET password_hash=EXCLUDED.password_hash,password_changed_at=now()", [auth.userId, hash]);
    await audit("password_set", auth.userId, company.company_slug);
    return withCors(reply({ status: "password_updated" }), verified.origin);
  }



  return withCors(fail("not_found", "Unknown route.", 404), verified.origin);
}

async function googleCallback(req: Request, body: Record<string, unknown>, company: Company) {
  const googleCode = String(body.code || "");
  const stateParam = String(body.state || "");
  const callbackUrl = String(body.callbackUrl || "");
  const parts = stateParam.split(".");
  if (!googleCode || (parts.length !== 2 && parts.length !== 3) || !company.allowed_callbacks.includes(callbackUrl)) {
    return fail("google_oauth_failed", "Google sign-in response, state or company callback is invalid.", 400);
  }
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const txr = await db.query<{ id: string; nonce_hash: string; company_slug: string; callback_url: string; pkce_challenge: string }>(
      "SELECT id,nonce_hash,company_slug,callback_url,pkce_challenge FROM xedruo_oauth_transactions WHERE state_hash=$1 AND consumed_at IS NULL AND expires_at>now() FOR UPDATE",
      [sha(parts[0])],
    );
    const tx = txr.rows[0];
    if (!tx || tx.company_slug !== company.company_slug || tx.callback_url !== callbackUrl) throw new Error("oauth_transaction_invalid");
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: googleCode, client_id: googleClientId, client_secret: googleClientSecret, redirect_uri: googleRedirectUri, grant_type: "authorization_code" }),
    });
    const tokenBody = await tokenRes.json() as { id_token?: string };
    if (!tokenRes.ok || !tokenBody.id_token) throw new Error("google_exchange_failed");
    const claims = await verifyGoogleToken(tokenBody.id_token);
    if (typeof claims.sub !== "string" || typeof claims.nonce !== "string" || !safeEqual(sha(claims.nonce), tx.nonce_hash)) throw new Error("google_nonce_invalid");
    if (typeof claims.email !== "string" || claims.email_verified !== true) throw new Error("google_email_unverified");
    const email = claims.email.toLowerCase();
    let userId: string | null = null;
    const linked = await db.query<{ user_id: string }>("SELECT user_id FROM xedruo_oauth_identities WHERE provider='google' AND provider_subject=$1", [claims.sub]);
    userId = linked.rows[0]?.user_id || null;
    if (!userId) {
      const byEmail = await db.query<{ user_id: string }>("SELECT user_id FROM xedruo_oauth_identities WHERE provider='google' AND lower(email)=$1 AND email_verified=true LIMIT 1", [email]);
      userId = byEmail.rows[0]?.user_id || null;
    }
    if (!userId) {
      const account = await db.query<{ id: string }>("INSERT INTO xedruo_accounts(status,account_type) VALUES('active','individual') RETURNING id");
      userId = account.rows[0].id;
      await db.query("INSERT INTO xedruo_profiles(id,full_name) VALUES($1,$2)", [userId, typeof claims.name === "string" ? claims.name : null]);
    }
    // Read through the active transaction: newly inserted accounts are not
    // visible to a separate pool connection until this transaction commits.
    const activeAccount = await db.query<{ status: string }>("SELECT status FROM xedruo_accounts WHERE id=$1", [userId]);
    if (activeAccount.rows[0]?.status !== "active") throw new Error("account_inactive");
    await db.query(
      "INSERT INTO xedruo_oauth_identities(user_id,provider,provider_subject,email,email_verified) VALUES($1,'google',$2,$3,true) ON CONFLICT(provider,provider_subject) DO UPDATE SET email=EXCLUDED.email,email_verified=true",
      [userId, claims.sub, email],
    );
    // Registration details are bound to this one-time Google state. Phone
    // numbers are collected but deliberately not SMS-verified.
    if (parts.length === 3) {
      let registration: { countryCode?: string; phoneE164?: string; legalName?: string };
      try { registration = JSON.parse(Buffer.from(parts[2], "base64url").toString("utf8")); }
      catch { throw new Error("registration_state_invalid"); }
      const countryCode = String(registration.countryCode || "").toUpperCase();
      const phoneE164 = String(registration.phoneE164 || "");
      const legalName = String(registration.legalName || "").trim().replace(/\s+/g, " ");
      if (!/^[A-Z]{2}$/.test(countryCode) || !/^\+[1-9][0-9]{7,14}$/.test(phoneE164) || legalName.length < 3 || legalName.length > 160) throw new Error("registration_details_invalid");
      const country = await db.query<{ calling_code: string }>("SELECT calling_code FROM xedruo_country_calling_codes WHERE country_code=$1", [countryCode]);
      if (!country.rows[0] || !phoneE164.startsWith(country.rows[0].calling_code)) throw new Error("country_phone_mismatch");
      const existingIdentity = await db.query<{ user_id: string }>("SELECT user_id FROM xedruo_identity WHERE user_id=$1 FOR UPDATE", [userId]);
      if (!existingIdentity.rows[0]) {
        const xedruoId = await makeId(db);
        await db.query("INSERT INTO xedruo_identity(user_id,xedruo_id,country_code,legal_name,phone_e164) VALUES($1,$2,$3,$4,$5)", [userId, xedruoId, countryCode, legalName, phoneE164]);
        await db.query("INSERT INTO xedruo_profiles(id,full_name) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET full_name=EXCLUDED.full_name,updated_at=now()", [userId, legalName]);
      }
    }
    const authCode = randomToken(32);
    await db.query(
      "INSERT INTO xedruo_auth_codes(code_hash,user_id,company_slug,callback_url,pkce_challenge,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '90 seconds')",
      [sha(authCode), userId, tx.company_slug, tx.callback_url, tx.pkce_challenge],
    );
    await db.query("UPDATE xedruo_oauth_transactions SET consumed_at=now() WHERE id=$1", [tx.id]);
    await db.query("COMMIT");
    await audit("google_login_succeeded", userId, company.company_slug);
    return reply({ code: authCode, state: Buffer.from(parts[1], "base64url").toString("utf8"), callbackUrl });
  } catch (e) {
    await db.query("ROLLBACK").catch(() => undefined);
    console.error("xedruo_google_callback_failed", e);
    return fail("google_oauth_failed", "Google sign-in could not be completed. Please try again.", 401);
  } finally { db.release(); }
}

async function centralGoogleCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  if (url.searchParams.has("error")) return reply({ error: "google_oauth_denied", message: "Google sign-in was cancelled or denied." }, 400);
  const parts = state.split(".");
  if (!code || (parts.length !== 2 && parts.length !== 3)) return fail("google_oauth_failed", "Google sign-in response is invalid.", 400);
  const tx = await pool.query<{company_slug:string; callback_url:string; pkce_challenge:string}>("SELECT company_slug,callback_url,pkce_challenge FROM xedruo_oauth_transactions WHERE state_hash=$1 AND consumed_at IS NULL AND expires_at>now()", [sha(parts[0])]);
  const row = tx.rows[0];
  if (!row) return fail("oauth_transaction_invalid", "This sign-in request has expired. Return to the company app and try again.", 400);
  const found = await pool.query<Company>("SELECT company_slug,display_name,app_origin,allowed_callbacks,enabled FROM xedruo_company_app_registry WHERE company_slug=$1 AND enabled=true", [row.company_slug]);
  const company = found.rows[0];
  if (!company || !company.allowed_callbacks.includes(row.callback_url)) return fail("oauth_callback_not_registered", "The company callback is not registered.", 403);
  const completed = await googleCallback(req, { code, state, callbackUrl: row.callback_url }, company);
  if (!completed.ok) return completed;
  const payload = await completed.json() as {code?:string;state?:string;callbackUrl?:string};
  if (!payload.code || payload.state === undefined || payload.callbackUrl !== row.callback_url) return fail("google_oauth_failed", "The sign-in response could not be completed.", 401);
  const issued = await pool.query<{ user_id: string }>("SELECT user_id FROM xedruo_auth_codes WHERE code_hash=$1 AND company_slug=$2 AND callback_url=$3", [sha(payload.code), row.company_slug, row.callback_url]);
  const identity = issued.rows[0] ? await identityFor(issued.rows[0].user_id) : null;
  if (!identity?.xedruo_id || !identity.phone_e164 || !identity.legal_name?.trim()) {
    const onboarding = new URL("/customer-auth", issuer);
    onboarding.searchParams.set("companySlug", row.company_slug);
    onboarding.searchParams.set("callbackUrl", row.callback_url);
    onboarding.searchParams.set("state", payload.state);
    onboarding.searchParams.set("codeChallenge", row.pkce_challenge);
    onboarding.searchParams.set("mode", "register");
    return new Response(null, { status: 302, headers: { location: onboarding.toString(), "cache-control": "no-store" } });
  }
  const destination = new URL(row.callback_url);
  destination.searchParams.set("code", payload.code);
  destination.searchParams.set("state", payload.state);
  return new Response(null, { status: 302, headers: { location: destination.toString(), "cache-control": "no-store" } });
}
/** Vercel Node.js serverless adapter. */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) headers.set(k, v.join(", "));
      else if (typeof v === "string") headers.set(k, v);
    }
    const method = (req.method || "GET").toUpperCase();
    let body: Buffer | undefined;
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += b.length;
        if (size > 12000) {
          res.statusCode = 413;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "payload_too_large", message: "Request too large." }));
          return;
        }
        chunks.push(b);
      }
      body = Buffer.concat(chunks);
    }
    const requestUrl = new URL(req.url || "/api/auth", "https://" + (req.headers.host || "xedruo.com"));
    const webReq = new Request(requestUrl, { method, headers, ...(body ? { body, duplex: "half" } as RequestInit : {}) });
    const path = requestUrl.pathname.replace(/^\/api\/auth\/?/, "");
    let response: Response;
    if (method === "OPTIONS") {
      // Preflight does not carry the company header. Reflect the requesting origin
      // here; the actual GET/POST handler still enforces the registered company
      // slug, app origin and callback allowlist before performing any operation.
      const origin = originOf(webReq.headers.get("origin"));
      response = new Response(null, { status: 204, headers: origin ? cors(origin) : {} });
    } else if (method === "GET" && path === "google/callback") response = await centralGoogleCallback(webReq);
    else if (method === "GET") response = await getHandler(webReq, path);
    else if (method === "POST") response = await postHandler(webReq, path);
    else response = fail("method_not_allowed", "Method not allowed.", 405);

    // Ensure registered company origins can read structured error responses too.
    // Authorization is still enforced by verifiedCompany() in each route.
    const requestOrigin = originOf(webReq.headers.get("origin"));
    if (requestOrigin && method !== "OPTIONS") {
      const registered = await pool.query<{ app_origin: string }>(
        "SELECT app_origin FROM xedruo_company_app_registry WHERE enabled=true AND app_origin=$1 LIMIT 1",
        [requestOrigin],
      );
      if (registered.rows.length) response = withCors(response, requestOrigin);
    }
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.error("xedruo_auth_function_error", e);
    if (!res.headersSent) {
      const origin = originOf(typeof req.headers.origin === "string" ? req.headers.origin : null);
      res.statusCode = 500;
      if (origin) {
        for (const [key, value] of Object.entries(cors(origin))) res.setHeader(key, value);
      }
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: "server_error", message: "Authentication service error." }));
    } else res.end();
  }
}
