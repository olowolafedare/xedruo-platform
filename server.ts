import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import worker from "./worker/index.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

async function assetFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = decodeURIComponent(url.pathname);
  const requested = path.resolve(dist, "." + pathname);
  if (!requested.startsWith(dist + path.sep) && requested !== dist && requested !== path.join(dist, "index.html")) {
    return new Response("Not found", { status: 404 });
  }
  let file = requested;
  try {
    if (!(await stat(file)).isFile()) file = path.join(file, "index.html");
  } catch {
    file = path.join(dist, "index.html");
  }
  try {
    const body = await readFile(file);
    return new Response(request.method === "HEAD" ? null : body, {
      status: 200,
      headers: {
        "content-type": mime[path.extname(file)] || "application/octet-stream",
        "cache-control": file.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

const env = {
  ASSETS: { fetch: assetFetch },
  DATABASE_URL: process.env.DATABASE_URL || "",
};

const server = createServer(async (incoming, outgoing) => {
  try {
    const protocol = incoming.headers["x-forwarded-proto"] || "https";
    const host = incoming.headers.host || "localhost";
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
      else if (value !== undefined) headers.set(key, value);
    }
    const chunks: Buffer[] = [];
    if (incoming.method !== "GET" && incoming.method !== "HEAD") {
      for await (const chunk of incoming) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const request = new Request(new URL(incoming.url || "/", `${protocol}://${host}`), {
      method: incoming.method || "GET",
      headers,
      ...(chunks.length ? { body: Buffer.concat(chunks), duplex: "half" } as RequestInit : {}),
    });
    const response = await worker.fetch(request, env as never, { waitUntil: (promise: Promise<unknown>) => { void promise.catch(() => undefined); } });
    outgoing.statusCode = response.status;
    response.headers.forEach((value, key) => outgoing.setHeader(key, value));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("xedruo_render_request_failed", error);
    if (!outgoing.headersSent) {
      outgoing.statusCode = 500;
      outgoing.setHeader("content-type", "application/json; charset=utf-8");
      outgoing.end(JSON.stringify({ error: "server_error", message: "Service error." }));
    } else outgoing.end();
  }
});

const port = Number(process.env.PORT || 10000);
server.listen(port, "0.0.0.0", () => console.log(`Xedruo Platform listening on ${port}`));
