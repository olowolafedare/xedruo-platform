import { Pool } from "@neondatabase/serverless";
import { createHash, randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { requestPool } from "../../lib/workers-db.js";

const pool = requestPool(() => new Pool({ connectionString: process.env.DATABASE_URL || "", max: 2 }));
const COOKIE = "xedruo_platform_admin";
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}
function sameOrigin(req: IncomingMessage) {
  const origin = req.headers.origin;
  if (!origin || !req.headers.host) return false;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
function readCookie(req: IncomingMessage) {
  const raw = String(req.headers.cookie || "");
  const item = raw.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
  return item ? decodeURIComponent(item.slice(COOKIE.length + 1)) : "";
}
async function getCTO(req: IncomingMessage) {
  const token = readCookie(req);
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;
  const result = await pool.query(
    `SELECT a.id,a.email,a.role FROM public.xedruo_platform_admin_sessions s
     JOIN public.xedruo_platform_admins a ON a.id=s.admin_id
     WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND a.status='active'
     LIMIT 1`,
    [sha(token)]
  );
  const admin = result.rows[0];
  return admin?.role === "cto" ? admin : null;
}
async function readBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    if (size > 22000) throw new Error("payload_too_large");
    chunks.push(part);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as Record<string, unknown>;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const requestId = randomUUID();
  try {
    if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed", requestId });
    if (!sameOrigin(req)) return json(res, 403, { error: "origin_not_allowed", requestId });
    const admin = await getCTO(req);
    if (!admin) return json(res, 403, { error: "cto_access_required", message: "Only the CTO unit can use the Xedrion engineering assistant.", requestId });

    const input = await readBody(req);
    const prompt = typeof input.prompt === "string" ? input.prompt.trim() : "";
    const mode = typeof input.mode === "string" ? input.mode : "architecture";
    const allowedModes = new Set(["architecture", "code", "database", "api", "debug", "security", "review"]);
    if (!prompt || prompt.length > 14000 || !allowedModes.has(mode)) {
      return json(res, 400, { error: "invalid_request", message: "Provide a prompt (maximum 18,000 characters) and a supported engineering mode.", requestId });
    }
    const apiKey = process.env.XEDRION_PLATFORM_API_KEY;
    if (!apiKey) return json(res, 503, { error: "xedrion_not_configured", message: "Xedrion AI platform credential is not configured on the Xedruo Render service.", requestId });

    const conversation = Array.isArray(input.conversation)
      ? input.conversation.slice(-6).filter((turn: any) =>
          turn && (turn.role === "user" || turn.role === "assistant") &&
          typeof turn.content === "string" && turn.content.length <= 1800
        ).map((turn: any) => ({ role: turn.role, content: turn.content }))
      : [];
    const modeInstructions: Record<string, string> = {
      architecture: "Design or assess the architecture and implementation sequence.",
      code: "Generate production-oriented code. Include complete file paths, complete code, tests and integration notes. Do not claim the code has been applied.",
      database: "Design Neon PostgreSQL schemas, migrations, indexes, transaction boundaries and access controls. Never propose deleting existing production data.",
      api: "Design API contracts, server-side handlers, authentication, authorization, validation, rate limits and tests.",
      debug: "Diagnose the supplied failure, identify the likely root cause and provide a minimal verifiable fix.",
      security: "Perform a security review and provide prioritised remediation with threat boundaries and tests.",
      review: "Review the proposed implementation for correctness, security, compatibility and operational risks."
    };
    const query = [
      "You are Xedrion AI, the engineering intelligence engine embedded in the Xedruo Platform CTO portal.",
      "Your task is to help build Xedruo's own developer platform by combining Supabase-class backend capabilities with a Base44-class AI app builder.",
      "NON-NEGOTIABLE EXISTING-PRODUCT RULE: Preserve everything already built. Do not rebuild, replace, remove or break existing routes, integrations, users, records or working features. Propose additive, backward-compatible changes only.",
      "TARGET INFRASTRUCTURE: Neon PostgreSQL is the database; Cloudflare R2 is object storage; Bunny CDN is media delivery; Render is the platform deployment target. Do not introduce Supabase as a production dependency.",
      "TECHNICAL MANAGEMENT: This work belongs to the single CTO unit. Do not create a second technical unit.",
      "SAFETY: Never ask for or output real credentials, API keys, passwords or secret values. Do not claim to have changed GitHub, Neon, Render or production. Do not execute destructive migrations. Flag any change requiring production approval.",
      "MODE: " + mode + ". " + modeInstructions[mode],
      "USER REQUEST:",
      prompt
    ].join("\n\n");
    const endpoint = process.env.XEDRION_API_URL || "https://xedrion-ai.xedruo.com/api/company-assistant";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + apiKey },
      body: JSON.stringify({ query, responseMode: mode === "code" ? "code" : mode === "review" || mode === "architecture" ? "report" : "normal", conversation }),
      signal: AbortSignal.timeout(90000)
    });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      console.error("xedrion_cto_assistant_failed", JSON.stringify({ requestId, status: response.status }));
      return json(res, 502, { error: "xedrion_request_failed", message: typeof payload.error === "string" ? payload.error : "Xedrion AI could not complete the request.", requestId });
    }
    return json(res, 200, {
      requestId,
      answer: typeof payload.answer === "string" ? payload.answer : "",
      sources: Array.isArray(payload.sources) ? payload.sources : [],
      modelProvider: typeof payload.modelProvider === "string" ? payload.modelProvider : undefined
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    console.error("xedruo_cto_ai_error", JSON.stringify({ requestId, error: message }));
    return json(res, message === "payload_too_large" ? 413 : 500, { error: message === "payload_too_large" ? "payload_too_large" : "server_error", requestId });
  }
}
