import { Pool } from "@neondatabase/serverless";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { IncomingMessage, ServerResponse } from "node:http";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "", max: 3 });
const scrypt = promisify(scryptCallback);
const COOKIE = "xedruo_platform_admin";
const SESSION_HOURS = 8;
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const json = (res: ServerResponse, status: number, body: unknown, extra: Record<string,string> = {}) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  for (const [key,value] of Object.entries(extra)) res.setHeader(key,value);
  res.end(JSON.stringify(body));
};
const setCookie = (token: string) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_HOURS*3600}`;
const clearCookie = () =>
  `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
function readCookie(req: IncomingMessage) {
  const raw = String(req.headers.cookie || "");
  const item = raw.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : "";
}
function sameOrigin(req: IncomingMessage) {
  const origin = req.headers.origin;
  if (!origin || !req.headers.host) return false;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
async function body(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    if (size > 4096) throw new Error("payload_too_large");
    chunks.push(part);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as Record<string, unknown>;
}
async function getAdmin(req: IncomingMessage) {
  const token = readCookie(req);
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;
  const result = await pool.query(
    `SELECT a.id,a.email,a.role FROM public.xedruo_platform_admin_sessions s
     JOIN public.xedruo_platform_admins a ON a.id=s.admin_id
     WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND a.status='active'
     LIMIT 1`,
    [sha(token)]
  );
  return result.rows[0] || null;
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
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const path = new URL(req.url || "/", "https://" + (req.headers.host || "xedruo.com")).pathname.replace(/^\/api\/admin\/auth\/?/, "");
    if (req.method === "GET" && path === "me") {
      const admin = await getAdmin(req);
      if (!admin) return json(res,401,{error:"unauthenticated"});
      return json(res,200,{admin});
    }
    const admin = await getAdmin(req);
    if (path === "companies" && req.method === "GET") {
      if (!admin || !["ceo","governor"].includes(admin.role)) return json(res,403,{error:"forbidden"});
      const rows = await pool.query("SELECT company_slug,display_name,app_origin,enabled,allowed_callbacks,allowed_logout_urls,updated_at FROM public.xedruo_company_app_registry ORDER BY display_name");
      return json(res,200,{companies:rows.rows});
    }
    if (req.method !== "POST" && req.method !== "PUT") return json(res,405,{error:"method_not_allowed"});
    if (!sameOrigin(req)) return json(res,403,{error:"origin_not_allowed"});
    if (path === "logout") {
      const token = readCookie(req);
      if (token) await pool.query(
        "UPDATE public.xedruo_platform_admin_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL",
        [sha(token)]
      );
      return json(res,200,{status:"signed_out"},{ "set-cookie": clearCookie() });
    }

    if (path === "password") {
      if (!admin) return json(res,401,{error:"unauthenticated"});
      const input = await body(req);
      const currentPassword = String(input.currentPassword || "");
      const newPassword = String(input.newPassword || "");
      if (newPassword.length < 12 || newPassword.length > 128 || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
        return json(res,400,{error:"weak_password",message:"Use at least 12 characters with uppercase, lowercase, a number and a symbol."});
      }
      const found = await pool.query("SELECT password_hash FROM public.xedruo_platform_admins WHERE id=$1 AND status='active' LIMIT 1",[admin.id]);
      if (!found.rows[0] || !(await checkPassword(currentPassword,found.rows[0].password_hash))) {
        return json(res,401,{error:"invalid_current_password",message:"Current password is incorrect."});
      }
      const salt = randomBytes(16);
      const derived = await scrypt(newPassword,salt,64) as Buffer;
      const encoded = "scrypt$" + salt.toString("base64url") + "$" + derived.toString("base64url");
      await pool.query("UPDATE public.xedruo_platform_admins SET password_hash=$1,updated_at=now() WHERE id=$2",[encoded,admin.id]);
      const currentToken = readCookie(req);
      await pool.query("UPDATE public.xedruo_platform_admin_sessions SET revoked_at=now() WHERE admin_id=$1 AND revoked_at IS NULL AND token_hash<>$2",[admin.id,sha(currentToken)]);
      return json(res,200,{status:"password_changed"});
    }
    if (path === "companies" && req.method === "PUT") {
      if (!admin || !["ceo","governor"].includes(admin.role)) return json(res,403,{error:"forbidden"});
      const input = await body(req);
      const slug = String(input.companySlug || "");
      const callbacks = input.allowedCallbacks;
      const logoutUrls = input.allowedLogoutUrls;
      const enabled = input.enabled;
      if (!/^[a-z0-9-]{2,80}$/.test(slug) || !Array.isArray(callbacks) || !Array.isArray(logoutUrls) || callbacks.length > 10 || logoutUrls.length > 10 || typeof enabled !== "boolean") return json(res,400,{error:"invalid_company_settings"});
      const validUrl = (value: unknown) => {
        if (typeof value !== "string" || value.length > 500) return false;
        try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; }
      };
      if (!callbacks.every(validUrl) || !logoutUrls.every(validUrl)) return json(res,400,{error:"invalid_url",message:"Callback and logout URLs must be valid HTTPS URLs."});
      const existing = await pool.query("SELECT app_origin FROM public.xedruo_company_app_registry WHERE company_slug=$1",[slug]);
      if (!existing.rows[0]) return json(res,404,{error:"company_not_found"});
      const origin = new URL(existing.rows[0].app_origin);
      const sameCompanyOrigin = (value: string) => new URL(value).origin === origin.origin;
      if (![...callbacks,...logoutUrls].every(sameCompanyOrigin)) return json(res,400,{error:"url_origin_mismatch",message:"URLs must stay on this company's registered origin."});
      const saved = await pool.query("UPDATE public.xedruo_company_app_registry SET allowed_callbacks=$1::text[],allowed_logout_urls=$2::text[],enabled=$3,updated_at=now() WHERE company_slug=$4 RETURNING company_slug,display_name,app_origin,enabled,allowed_callbacks,allowed_logout_urls,updated_at",[callbacks,logoutUrls,enabled,slug]);
      return json(res,200,{company:saved.rows[0]});
    }
    if (path !== "login") return json(res,404,{error:"not_found"});
    const input = await body(req);
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 128) {
      return json(res,401,{error:"invalid_credentials",message:"Email or password is incorrect."});
    }
    const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const emailHash = sha("admin-email:" + email);
    const ipHash = sha("admin-ip:" + (forwarded || "unknown"));
    await pool.query(
      "INSERT INTO public.xedruo_platform_admin_login_attempts(email_hash,ip_hash) VALUES($1,$2)",
      [emailHash,ipHash]
    );
    const limits = await pool.query(
      `SELECT count(*) FILTER (WHERE email_hash=$1)::int AS email_attempts,
              count(*) FILTER (WHERE ip_hash=$2)::int AS ip_attempts
       FROM public.xedruo_platform_admin_login_attempts
       WHERE attempted_at>now()-interval '15 minutes'`,
      [emailHash,ipHash]
    );
    const blocked = Number(limits.rows[0]?.email_attempts || 0) > 5 || Number(limits.rows[0]?.ip_attempts || 0) > 20;
    const found = blocked ? { rows: [] as any[] } : await pool.query(
      "SELECT id,email,password_hash,role FROM public.xedruo_platform_admins WHERE lower(email)=$1 AND status='active' LIMIT 1",
      [email]
    );
    let admin = found.rows[0];
    let ok = admin ? await checkPassword(password,admin.password_hash) : false;
    // A one-time, hash-only bootstrap is allowed only while the admin table is empty.
    // Remove the two bootstrap environment variables after the first successful login.
    if (!blocked && !admin) {
      const bootstrapEmail = String(process.env.XEDRUO_ADMIN_BOOTSTRAP_EMAIL || "").trim().toLowerCase();
      const bootstrapHash = String(process.env.XEDRUO_ADMIN_BOOTSTRAP_PASSWORD_HASH || "");
      const bootstrapRole = String(process.env.XEDRUO_ADMIN_BOOTSTRAP_ROLE || "ceo");
      const allowedRoles = new Set(["governor","ceo","cfo","developer","customer_service","operations"]);
      if (bootstrapEmail && bootstrapHash && email === bootstrapEmail && allowedRoles.has(bootstrapRole) &&
          await checkPassword(password,bootstrapHash)) {
        const count = await pool.query("SELECT count(*)::int AS total FROM public.xedruo_platform_admins");
        if (Number(count.rows[0]?.total || 0) === 0) {
          const created = await pool.query(
            "INSERT INTO public.xedruo_platform_admins(email,password_hash,role,status) VALUES($1,$2,$3,'active') RETURNING id,email,password_hash,role",
            [email,bootstrapHash,bootstrapRole]
          );
          admin = created.rows[0];
          ok = Boolean(admin);
        }
      }
    }
    if (!admin) await scrypt(password,Buffer.alloc(16),64);
    if (blocked || !admin || !ok) {
      return json(res,401,{error:"invalid_credentials",message:"Email or password is incorrect."});
    }
    const token = randomBytes(32).toString("base64url");
    await pool.query(
      "INSERT INTO public.xedruo_platform_admin_sessions(admin_id,token_hash,expires_at,user_agent) VALUES($1,$2,now()+interval '8 hours',$3)",
      [admin.id,sha(token),String(req.headers["user-agent"] || "").slice(0,500) || null]
    );
    await pool.query(
      "DELETE FROM public.xedruo_platform_admin_login_attempts WHERE attempted_at<now()-interval '1 day'"
    );
    return json(res,200,{admin:{id:admin.id,email:admin.email,role:admin.role}},{ "set-cookie": setCookie(token) });
  } catch (error) {
    console.error("platform_admin_auth_error", error);
    return json(res,500,{error:"server_error",message:"Platform administrator authentication failed."});
  }
}
