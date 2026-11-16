import { Pool } from "@neondatabase/serverless";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { IncomingMessage, ServerResponse } from "node:http";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "", max: 3 });
const scrypt = promisify(scryptCallback);
const COOKIE = "xedruo_platform_admin";
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const json = (res: ServerResponse, status: number, body: unknown, extra: Record<string,string> = {}) => {
  res.statusCode = status; res.setHeader("content-type","application/json; charset=utf-8");
  res.setHeader("cache-control","no-store");
  for (const [key,value] of Object.entries(extra)) res.setHeader(key,value);
  res.end(JSON.stringify(body));
};
const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
function readCookie(req: IncomingMessage) {
  const raw = String(req.headers.cookie || "");
  const item = raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE+"="));
  return item ? decodeURIComponent(item.slice(COOKIE.length+1)) : "";
}
function sameOrigin(req: IncomingMessage) {
  const origin=req.headers.origin;
  if (!origin || !req.headers.host) return false;
  try { return new URL(origin).host===req.headers.host; } catch { return false; }
}
async function readBody(req: IncomingMessage) {
  const chunks: Buffer[]=[]; let size=0;
  for await (const chunk of req) { const part=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk); size+=part.length; if(size>8192) throw new Error("payload_too_large"); chunks.push(part); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")||"{}") as Record<string,unknown>;
}
async function getAdmin(req: IncomingMessage) {
  const token=readCookie(req);
  if(!/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;
  const result=await pool.query(
    `SELECT a.id,a.email,a.username,a.department,a.role,a.status,a.must_change_password
     FROM public.xedruo_platform_admin_sessions s
     JOIN public.xedruo_platform_admins a ON a.id=s.admin_id
     WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND a.status='active' LIMIT 1`,
    [sha(token)]
  );
  return result.rows[0]||null;
}
async function hashPassword(password:string) {
  const salt=randomBytes(16); const derived=await scrypt(password,salt,64) as Buffer;
  return "scrypt$"+salt.toString("base64url")+"$"+derived.toString("base64url");
}
function validPassword(password:string) {
  return password.length>=12 && password.length<=128 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}
const ROLES = new Set(["hr","developer","technical_officer","customer_service","operations","ceo","cfo","governor"]);
const DEPARTMENTS = new Set(["Executive Office","Finance","Human Resources","Customer Service","Technical Operations","Product & Engineering","Operations"]);
const isGovernor = (admin:any) => admin?.role==="governor";
const canManageStaff = (admin:any) => ["governor","hr"].includes(admin?.role);

export default async function handler(req:IncomingMessage,res:ServerResponse) {
  try {
    const path=new URL(req.url||"/","https://"+(req.headers.host||"xedruo.com")).pathname.replace(/^\/api\/admin\/staff\/?/,"");
    const admin=await getAdmin(req);
    if(!admin) return json(res,401,{error:"unauthenticated"});
    if(req.method==="GET" && (path==="" || path==="list")) {
      if(!canManageStaff(admin)) return json(res,403,{error:"forbidden"});
      const rows=await pool.query("SELECT id,username,email,department,role,status,must_change_password,created_at FROM public.xedruo_platform_admins ORDER BY created_at DESC");
      return json(res,200,{staff:rows.rows});
    }
    if(req.method!=="POST") return json(res,405,{error:"method_not_allowed"});
    if(!sameOrigin(req)) return json(res,403,{error:"origin_not_allowed"});
    const input=await readBody(req);
    if(path==="create") {
      if(!canManageStaff(admin)) return json(res,403,{error:"forbidden"});
      const username=String(input.username||"").trim();
      const password=String(input.password||"");
      const department=String(input.department||"");
      const role=String(input.role||"");
      if(!/^[A-Za-z0-9._-]{3,32}$/.test(username)) return json(res,400,{error:"invalid_username",message:"Username must be 3–32 characters using letters, numbers, dots, underscores or hyphens."});
      if(!validPassword(password)) return json(res,400,{error:"weak_password",message:"Use at least 12 characters with uppercase, lowercase, a number and a symbol."});
      if(!DEPARTMENTS.has(department)||!ROLES.has(role)) return json(res,400,{error:"invalid_assignment",message:"Choose a valid department and role."});
      if(!isGovernor(admin) && ["governor","ceo","cfo","hr"].includes(role)) return json(res,403,{error:"role_assignment_restricted",message:"Only the Governor can create executive or HR administrator accounts."});
      const passwordHash=await hashPassword(password);
      const created=await pool.query(
        "INSERT INTO public.xedruo_platform_admins(username,email,password_hash,role,department,status,must_change_password) VALUES($1,NULL,$2,$3,$4,'active',true) RETURNING id,username,department,role,status,must_change_password,created_at",
        [username,passwordHash,role,department]
      );
      await pool.query("UPDATE public.xedruo_platform_admin_sessions SET revoked_at=now() WHERE admin_id=$1 AND revoked_at IS NULL",[created.rows[0].id]);
      return json(res,201,{staff:created.rows[0]});
    }
    if(path==="suspend") {
      if(!canManageStaff(admin)) return json(res,403,{error:"forbidden"});
      const id=String(input.id||"");
      if(!/^[0-9a-f-]{36}$/i.test(id)) return json(res,400,{error:"invalid_staff_id"});
      const target=await pool.query("SELECT id,role FROM public.xedruo_platform_admins WHERE id=$1 LIMIT 1",[id]);
      if(!target.rows[0]) return json(res,404,{error:"staff_not_found"});
      if(id===admin.id || target.rows[0].role==="governor" || (!isGovernor(admin)&&["ceo","cfo","hr"].includes(target.rows[0].role))) return json(res,403,{error:"protected_account"});
      await pool.query("UPDATE public.xedruo_platform_admins SET status='suspended',updated_at=now() WHERE id=$1",[id]);
      await pool.query("UPDATE public.xedruo_platform_admin_sessions SET revoked_at=now() WHERE admin_id=$1 AND revoked_at IS NULL",[id]);
      return json(res,200,{status:"suspended"});
    }
    if(path==="activate") {
      if(!canManageStaff(admin)) return json(res,403,{error:"forbidden"});
      const id=String(input.id||"");
      if(!/^[0-9a-f-]{36}$/i.test(id)) return json(res,400,{error:"invalid_staff_id"});
      await pool.query("UPDATE public.xedruo_platform_admins SET status='active',updated_at=now() WHERE id=$1",[id]);
      return json(res,200,{status:"active"});
    }
    if(path==="initial-password") {
      if(!admin.must_change_password) return json(res,409,{error:"password_change_not_required"});
      const newPassword=String(input.newPassword||"");
      if(!validPassword(newPassword)) return json(res,400,{error:"weak_password",message:"Use at least 12 characters with uppercase, lowercase, a number and a symbol."});
      const encoded=await hashPassword(newPassword);
      await pool.query("UPDATE public.xedruo_platform_admins SET password_hash=$1,must_change_password=false,updated_at=now() WHERE id=$2",[encoded,admin.id]);
      const current=readCookie(req);
      await pool.query("UPDATE public.xedruo_platform_admin_sessions SET revoked_at=now() WHERE admin_id=$1 AND revoked_at IS NULL AND token_hash<>$2",[admin.id,sha(current)]);
      return json(res,200,{status:"password_updated"});
    }
    return json(res,404,{error:"not_found"});
  } catch(error:any) {
    if(error?.code==="23505") return json(res,409,{error:"username_taken",message:"That username is already in use."});
    console.error("platform_staff_error",error);
    return json(res,500,{error:"server_error",message:"Unable to complete staff account operation."});
  }
}
