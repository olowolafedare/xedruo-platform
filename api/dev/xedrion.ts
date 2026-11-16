import { Pool } from "@neondatabase/serverless";
import { createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "", max: 3 });
const COOKIE = "xedruo_platform_admin";
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const json = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
};
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
async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    if (size > 24000) throw new Error("payload_too_large");
    chunks.push(part);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as Record<string, unknown>;
}
async function getAdmin(req: IncomingMessage) {
  const token = readCookie(req);
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;
  const result = await pool.query(
    `SELECT a.id,a.username,a.role,a.department,a.status,a.must_change_password
     FROM public.xedruo_platform_admin_sessions s
     JOIN public.xedruo_platform_admins a ON a.id=s.admin_id
     WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND a.status='active'
     LIMIT 1`,
    [sha(token)]
  );
  return result.rows[0] || null;
}
const allowedRoles = new Set(["developer", "technical_officer", "governor"]);
const allowedModes = new Set(["normal", "code"]);
const allowedCompanySlug = /^[a-z0-9][a-z0-9-]{1,62}$/;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });
    if (!sameOrigin(req)) return json(res, 403, { error: "origin_not_allowed" });
    const admin = await getAdmin(req);
    if (!admin) return json(res, 401, { error: "unauthenticated" });
    if (!allowedRoles.has(admin.role)) return json(res, 403, { error: "developer_role_required" });
    if (admin.must_change_password) return json(res, 403, { error: "password_change_required" });

    const input = await readBody(req);
    const query = typeof input.query === "string" ? input.query.trim() : "";
    const mode = typeof input.mode === "string" && allowedModes.has(input.mode) ? input.mode : "normal";
    const projectSlug = typeof input.projectSlug === "string" ? input.projectSlug.trim() : "";
    if (!query) return json(res, 400, { error: "query_required" });
    if (query.length > 12000) return json(res, 413, { error: "query_too_long" });
    if (!allowedCompanySlug.test(projectSlug)) return json(res, 400, { error: "invalid_project" });

    if (projectSlug !== "xedruo-platform") {
      const project = await pool.query(
        "SELECT company_slug FROM public.xedruo_company_app_registry WHERE company_slug=$1 AND enabled=true LIMIT 1",
        [projectSlug]
      );
      if (!project.rows[0]) return json(res, 403, { error: "project_not_registered_or_disabled" });
    }

    const origin = (process.env.XEDRION_API_ORIGIN || "https://xedrion-ai.vercel.app").replace(/\/+$/, "");
    const upstream = await fetch(origin + "/api/search", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        query: [
          "You are Xedrion AI operating inside Xedruo Developer Studio.",
          "Active project: " + (projectSlug === "xedruo-platform" ? "Xedruo Platform control plane" : projectSlug),
          "Help with implementation, debugging, architecture, code review and production operations.",
          "Do not claim to have changed files, executed commands, deployed services or connected accounts unless a verified tool result confirms it.",
          "When external credentials or tools are unavailable, provide the exact required integration steps and clearly state the limitation.",
          "For production-impacting actions, require an explicit approval step.",
          "User request: " + query,
        ].join("\n\n"),
        responseMode: mode === "code" ? "code" : "normal",
        conversation: Array.isArray(input.conversation)
          ? input.conversation.filter((item: any) =>
              item && ["user", "assistant"].includes(item.role) &&
              typeof item.content === "string"
            ).slice(-8).map((item: any) => ({ role: item.role, content: item.content.slice(0, 2000) }))
          : [],
      }),
      signal: AbortSignal.timeout(55000),
    });
    const payload = await upstream.json().catch(() => ({})) as Record<string, unknown>;
    if (!upstream.ok) {
      return json(res, 502, { error: "xedrion_upstream_error", message: "Xedrion AI returned an error.", upstreamStatus: upstream.status });
    }
    const answer = typeof payload.answer === "string" ? payload.answer : "";
    if (!answer) return json(res, 502, { error: "xedrion_empty_response" });
    return json(res, 200, {
      answer,
      sources: Array.isArray(payload.sources) ? payload.sources : [],
      projectSlug,
      mode,
      engine: "Xedrion AI",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    if (message === "payload_too_large") return json(res, 413, { error: "payload_too_large" });
    if (message === "Xedrion AI upstream timeout") return json(res, 504, { error: "xedrion_timeout" });
    return json(res, 500, { error: "xedrion_gateway_failed", message: "The Xedrion AI gateway could not complete this request." });
  }
}
