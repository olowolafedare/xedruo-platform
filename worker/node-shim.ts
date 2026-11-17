/**
 * Runs a Node-style (req, res) handler — the kind used by api/admin/auth and api/media —
 * inside a Cloudflare Worker, so those handlers do not need to be rewritten.
 * Supports what they use: req.method/url/headers/query/body, async-iterating req,
 * res.statusCode, setHeader, status(), json() and end().
 */
export async function runNodeHandler(
  handler: (req: any, res: any) => unknown,
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });
  headers.host ||= url.host;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const raw = hasBody ? new Uint8Array(await request.arrayBuffer()) : new Uint8Array(0);
  let parsed: unknown;
  if (raw.length && (headers["content-type"] || "").includes("json")) {
    try { parsed = JSON.parse(new TextDecoder().decode(raw)); } catch { parsed = undefined; }
  }

  const req: any = {
    method: request.method,
    url: url.pathname + url.search,
    headers,
    query: Object.fromEntries(url.searchParams),
    body: parsed ?? {},
    async *[Symbol.asyncIterator]() { if (raw.length) yield Buffer.from(raw); },
  };

  return new Promise<Response>((resolve, reject) => {
    const out = new Headers();
    let status = 200;
    let done = false;
    const finish = (chunk?: unknown) => {
      if (done) return;
      done = true;
      const body = chunk === undefined || chunk === "" || chunk === null ? null : (chunk as BodyInit);
      resolve(new Response(body, { status, headers: out }));
    };
    const res: any = {
      get statusCode() { return status; },
      set statusCode(value: number) { status = value; },
      headersSent: false,
      setHeader(name: string, value: unknown) {
        if (Array.isArray(value)) { out.delete(name); for (const v of value) out.append(name, String(v)); }
        else if (name.toLowerCase() === "set-cookie") out.append(name, String(value));
        else out.set(name, String(value));
        return res;
      },
      getHeader(name: string) { return out.get(name) ?? undefined; },
      status(code: number) { status = code; return res; },
      json(payload: unknown) {
        if (!out.has("content-type")) out.set("content-type", "application/json; charset=utf-8");
        finish(JSON.stringify(payload));
        return res;
      },
      end(chunk?: unknown) { finish(chunk); return res; },
    };
    Promise.resolve()
      .then(() => handler(req, res))
      .then(() => finish(), (error) => { if (!done) reject(error); });
  });
}
