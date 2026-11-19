/**
 * Cloudflare Worker entry for the Xedruo platform.
 * - /api/auth/*        -> central identity gateway (lib/xedruo-auth-handler.ts)
 * - /api/admin/auth/*  -> platform admin auth
 * - /api/media         -> R2 presigned uploads
 * - everything else    -> the Vite SPA (static assets, SPA fallback)
 * Handlers are imported lazily so they evaluate after env vars are available.
 */
import { Pool } from "@neondatabase/serverless";
import { poolStore } from "../lib/workers-db.js";
import { runNodeHandler } from "./node-shim.js";

type Env = Record<string, unknown> & { ASSETS: { fetch(request: Request): Promise<Response> } };
type Ctx = { waitUntil(promise: Promise<unknown>): void };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function route(request: Request, url: URL): Promise<Response> {
  const path = url.pathname.replace(/\/+$/, "");

  if (path === "/api/auth/health" && request.method === "GET") {
    await poolStore.getStore()!.query("select 1");
    return json(200, { ok: true, runtime: "cloudflare-workers" });
  }
  if (path === "/api/auth" || path.startsWith("/api/auth/")) {
    if (Number(request.headers.get("content-length") || 0) > 12000) {
      return json(413, { error: "payload_too_large", message: "Request too large." });
    }
    const { handleAuthRequest } = await import("../lib/xedruo-auth-handler.js");
    return handleAuthRequest(request);
  }
  if (path === "/api/admin/auth" || path.startsWith("/api/admin/auth/")) {
    const mod = await import("../api/admin/auth/[...path].js");
    return runNodeHandler(mod.default, request);
  }
  if (path === "/api/cto/ai-assistant") {
    const mod = await import("../api/cto/ai-assistant.js");
    return runNodeHandler(mod.default, request);
  }
  if (path === "/api/media") {
    // @ts-ignore plain JS module
    const mod = await import("../api/media.js");
    return runNodeHandler(mod.default, request);
  }
  return json(404, { error: "not_found", message: "Not found." });
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    // Make Worker vars/secrets visible to code that reads process.env.
    for (const [key, value] of Object.entries(env)) {
      if (typeof value === "string" && process.env[key] === undefined) process.env[key] = value;
    }

    const pool = new Pool({ connectionString: String(env.DATABASE_URL || ""), max: 5 });
    try {
      return await poolStore.run(pool, () => route(request, url));
    } catch (error) {
      console.error("xedruo_worker_error", error);
      return json(500, { error: "server_error", message: "Service error." });
    } finally {
      ctx.waitUntil(pool.end().catch(() => undefined));
    }
  },
};
