/**
 * Per-request Neon pool support for Cloudflare Workers.
 * Workers must not reuse a WebSocket-backed Pool across requests, so the worker entry
 * creates a Pool per request and runs the handler inside poolStore. On Vercel nothing
 * runs inside poolStore, so requestPool() falls back to one lazily created shared Pool.
 */
import type { Pool } from "@neondatabase/serverless";
import { AsyncLocalStorage } from "node:async_hooks";

export const poolStore = new AsyncLocalStorage<Pool>();

export function requestPool(create: () => Pool): Pool {
  let shared: Pool | undefined;
  return new Proxy({} as Pool, {
    get(_target, prop) {
      const target = (poolStore.getStore() ?? (shared ??= create())) as any;
      const value = target[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
