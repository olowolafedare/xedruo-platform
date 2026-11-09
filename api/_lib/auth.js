import { neon } from "@neondatabase/serverless";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const sql = neon(process.env.DATABASE_URL || "");
export const GOOGLE_REDIRECT_URI = process.env.XEDRUO_GOOGLE_REDIRECT_URI || "https://xedruo.com/api/auth/google/callback";
export const hash = (v) => createHash("sha256").update(String(v)).digest("hex");
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const json = (res, status, body) => res.status(status).setHeader("Cache-Control","no-store").json(body);
export const fail = (res, status, code, message) => json(res,status,{error:code,message});

export async function getCompany(slug, callbackUrl) {
  const rows = await sql.query(
    "select company_slug, display_name, enabled, allowed_callbacks from public.xedruo_company_app_registry where company_slug=$1 limit 1",
    [slug]
  );
  const company = rows[0];
  if (!company || !company.enabled) return null;
  if (callbackUrl && !(company.allowed_callbacks || []).includes(callbackUrl)) return null;
  return company;
}

export function signAccessToken(payload) {
  const secret = process.env.XEDRUO_SESSION_SIGNING_SECRET;
  if (!secret || secret.length < 32) throw new Error("XEDRUO_SESSION_SIGNING_SECRET must be configured (32+ characters).");
  const now = Math.floor(Date.now()/1000);
  const header = Buffer.from(JSON.stringify({alg:"HS256",typ:"JWT"})).toString("base64url");
  const body = Buffer.from(JSON.stringify({...payload,iat:now,exp:now+900,iss:"https://xedruo.com"})).toString("base64url");
  const input = header+"."+body;
  const signature = createHmac("sha256",secret).update(input).digest("base64url");
  return input+"."+signature;
}
export function verifyAccessToken(token) {
  const secret = process.env.XEDRUO_SESSION_SIGNING_SECRET;
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const expected = createHmac("sha256",secret).update(parts[0]+"."+parts[1]).digest();
  let actual;
  try { actual = Buffer.from(parts[2],"base64url"); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual,expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(parts[1],"base64url").toString("utf8"));
    if (p.iss !== "https://xedruo.com" || !p.sub || !p.sid || !p.company_slug || p.exp <= Math.floor(Date.now()/1000)) return null;
    return p;
  } catch { return null; }
}
export async function requireSession(req) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i,"");
  const claims = verifyAccessToken(token);
  if (!claims) return null;
  const rows = await sql.query(
    "select id,user_id,company_slug,expires_at,revoked_at from public.xedruo_auth_sessions where id=$1 and user_id=$2 and company_slug=$3 limit 1",
    [claims.sid,claims.sub,claims.company_slug]
  );
  const s = rows[0];
  if (!s || s.revoked_at || new Date(s.expires_at).getTime() <= Date.now()) return null;
  return claims;
}
