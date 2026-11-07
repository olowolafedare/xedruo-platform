import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REG = {
  table: "xedruo_company_app_registry",
  slug: "company_slug",
  name: "display_name",
  enabled: "enabled",
  origin: "app_origin",
};

type Company = {
  slug: string;
  name: string;
  origin: string;
};

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

let cache: {
  at: number;
  rows: Company[];
} | null = null;

const normOrigin = (v: string | null | undefined) => {
  try {
    return v ? new URL(v).origin : null;
  } catch {
    return null;
  }
};

async function registry(): Promise<Company[]> {
  if (cache && Date.now() - cache.at < 60_000) {
    return cache.rows;
  }

  const { data, error } = await admin
    .from(REG.table)
    .select(`${REG.slug},${REG.name},${REG.origin}`)
    .eq(REG.enabled, true)
    .not(REG.origin, "is", null);

  if (error) throw error;

  const rows: Company[] = ((data ?? []) as Record<string, string>[])
    .map((r) => ({
      slug: r[REG.slug],
      name: r[REG.name] ?? r[REG.slug],
      origin: normOrigin(r[REG.origin]) ?? "",
    }))
    .filter((c) => c.slug && c.origin);

  cache = {
    at: Date.now(),
    rows,
  };

  return rows;
}

function corsFor(origin: string | null): Record<string, string> {
  return origin
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers":
          "authorization, content-type, x-xedruo-company",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      }
    : {
        Vary: "Origin",
      };
}

const reply = (
  body: unknown,
  status: number,
  origin: string | null,
  extra: Record<string, string> = {}
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsFor(origin),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extra,
    },
  });

const fail = (
  code: string,
  message: string,
  status: number,
  origin: string | null
) => reply({ error: code, message }, status, origin);

const hits = new Map<string, number[]>();

function limited(key: string, max: number, windowMs = 60_000) {
  const now = Date.now();

  const list = (hits.get(key) ?? []).filter(
    (t) => now - t < windowMs
  );

  list.push(now);
  hits.set(key, list);

  return list.length > max;
}

const audit = (
  event: string,
  fields: Record<string, unknown>
) =>
  console.log(
    JSON.stringify({
      at: new Date().toISOString(),
      event,
      ...fields,
    })
  );

const COUNTRY_RE = /^[A-Z]{2}$/;
const PHONE_RE = /^\+[1-9][0-9]{7,14}$/;

type IdentityRow = {
  xedruo_id: string | null;
  country_code: string | null;
  legal_name: string | null;
  phone_e164: string | null;
  phone_verified_at: string | null;
  status: string | null;
};

function missingFields(
  identity: IdentityRow | null,
  authPhone: string | null,
  phoneConfirmedAt: string | null
): string[] {
  const missing: string[] = [];

  if (!identity?.country_code) {
    missing.push("country");
  }

  if (!identity?.phone_e164) {
    missing.push("phone");
  }

  if (!identity?.legal_name?.trim()) {
    missing.push("legal_name");
  }

  if (!identity?.xedruo_id) {
    missing.push("xedruo_id");
  }

  const phoneVerified =
    Boolean(authPhone) &&
    Boolean(phoneConfirmedAt) &&
    Boolean(identity?.phone_verified_at) &&
    identity?.phone_e164 === authPhone;

  if (!phoneVerified) {
    missing.push("phone_verification");
  }

  return missing;
}

async function readIdentity(
  db: SupabaseClient,
  userId: string
): Promise<IdentityRow | null> {
  const { data, error } = await db
    .from("xedruo_identity")
    .select(
      "xedruo_id,country_code,legal_name,phone_e164,phone_verified_at,status"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return (data as IdentityRow) ?? null;
}

<<<<<<< HEAD
// Log full database errors server-side (function logs); return only a safe message + reference to the caller.
function dbError(stage: string, e: { code?: string; message?: string; details?: string; hint?: string }, echo: string | null) {
  const ref = crypto.randomUUID().slice(0, 8);
  console.error("rpc_failed", ref, stage, JSON.stringify({ code: e.code, message: e.message, details: e.details, hint: e.hint }));
  if (e.code === "23505") return fail("already_in_use", "That phone number or identity is already linked to an account.", 409, echo);
  if (e.code === "P0001") return fail("rejected", String(e.message ?? "Request rejected.").slice(0, 200), 400, echo);
  return fail("server_error", `Could not save your details (ref ${ref}).`, 500, echo);
}

const first = <T>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
=======
const first = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? v[0] ?? null : v ?? null;
>>>>>>> 32fea9fbc9f416f27ec33f8b759f2f8e9fd2693b

const publicIdentity = (identity: IdentityRow | null) =>
  identity && {
    xedruo_id: identity.xedruo_id,
    country_code: identity.country_code,
    legal_name: identity.legal_name,
  };

<<<<<<< HEAD
// ---------- Xedruo ID + password login ----------
// Xedruo IDs are identifiers, not secrets. The password is verified by Supabase Auth; this
// function only maps ID -> the account's login identifier and returns the session to the
// calling company app over HTTPS. Every failure looks the same to the caller.
// Valid IDs (see xedruo_identity_id_format): "CC-##########" (current) or "Xedruo CC ##########" (legacy).
function idCandidates(input: string): string[] {
  const t = input.trim().replace(/\s+/g, " ");
  const m = t.match(/^([A-Za-z]{2})-?(\d{10})$/) ?? t.match(/^xedruo[ -]?([A-Za-z]{2})[ -]?(\d{10})$/i);
  if (!m) return [];
  const cc = m[1].toUpperCase();
  return [`${cc}-${m[2]}`, `Xedruo ${cc} ${m[2]}`];
}
=======
const ID_RE = /^[A-Z0-9-]{6,32}$/;
>>>>>>> 32fea9fbc9f416f27ec33f8b759f2f8e9fd2693b
const LOGIN_WINDOW_S = 15 * 60;
const MAX_FAILS_PER_ID = 5;
const MAX_FAILS_PER_IP = 20;

async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );

  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const clientIp = (req: Request) =>
  (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    "unknown"
  ).trim();

async function idLogin(
  req: Request,
  company: Company,
  echo: string | null
): Promise<Response> {
  const badLogin = () =>
    fail(
      "invalid_credentials",
      "Incorrect Xedruo ID or password.",
      401,
      echo
    );

  const raw = await req.text();

<<<<<<< HEAD
  const candidates = idCandidates(String(body.xedruoId ?? ""));
  const xedruoId = candidates[0] ?? "invalid";
  const password = typeof body.password === "string" ? body.password : "";
=======
  if (raw.length > 2048) {
    return fail("payload_too_large", "Request too large.", 413, echo);
  }

  let body: Record<string, unknown> = {};

  try {
    body = JSON.parse(raw || "{}");
  } catch {
    return fail("bad_request", "Invalid JSON.", 400, echo);
  }

  const xedruoId = String(body.xedruoId ?? "")
    .replace(/\s+/g, "")
    .toUpperCase();

  const password =
    typeof body.password === "string" ? body.password : "";
>>>>>>> 32fea9fbc9f416f27ec33f8b759f2f8e9fd2693b

  const ipKey = `ip:${await sha256(clientIp(req))}`;
  const idKey = `id:${await sha256(xedruoId)}`;

  const recordFailure = () =>
    Promise.all([
      admin.rpc("xedruo_throttle_record", {
        p_key: ipKey,
      }),
      admin.rpc("xedruo_throttle_record", {
        p_key: idKey,
      }),
    ]);

  const [ipBlocked, idBlocked] = await Promise.all([
    admin.rpc("xedruo_throttle_blocked", {
      p_key: ipKey,
      p_max: MAX_FAILS_PER_IP,
      p_window_seconds: LOGIN_WINDOW_S,
    }),
    admin.rpc("xedruo_throttle_blocked", {
      p_key: idKey,
      p_max: MAX_FAILS_PER_ID,
      p_window_seconds: LOGIN_WINDOW_S,
    }),
  ]);

  if (ipBlocked.error || idBlocked.error) {
    throw ipBlocked.error ?? idBlocked.error;
  }

<<<<<<< HEAD
  if (!candidates.length || password.length < 1 || password.length > 128) {
=======
  if (ipBlocked.data === true || idBlocked.data === true) {
    audit("id_login_throttled", {
      company: company.slug,
      id: idKey.slice(3, 15),
    });

    return reply(
      {
        error: "rate_limited",
        message: "Too many attempts. Try again later.",
      },
      429,
      echo,
      {
        "Retry-After": String(LOGIN_WINDOW_S),
      }
    );
  }

  if (
    !ID_RE.test(xedruoId) ||
    password.length < 1 ||
    password.length > 128
  ) {
>>>>>>> 32fea9fbc9f416f27ec33f8b759f2f8e9fd2693b
    await recordFailure();
    return badLogin();
  }

  let creds: { email: string } | { phone: string } | null = null;
<<<<<<< HEAD
  const { data: ident } = await admin.from("xedruo_identity").select("user_id").in("xedruo_id", candidates).limit(1).maybeSingle();
=======

  const { data: ident } = await admin
    .from("xedruo_identity")
    .select("user_id")
    .eq("xedruo_id", xedruoId)
    .maybeSingle();

>>>>>>> 32fea9fbc9f416f27ec33f8b759f2f8e9fd2693b
  if (ident?.user_id) {
    const { data: au } =
      await admin.auth.admin.getUserById(ident.user_id);

    if (au?.user?.email) {
      creds = { email: au.user.email };
    } else if (au?.user?.phone) {
      creds = { phone: au.user.phone };
    }
  }

  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const attempt = creds ?? {
    email: `${crypto.randomUUID()}@invalid.example`,
  };

  const { data: signedIn, error: signInErr } =
    await anon.auth.signInWithPassword({
      ...attempt,
      password,
    });

  if (signInErr || !signedIn?.session || !creds) {
    await recordFailure();

    audit("id_login_failed", {
      company: company.slug,
      id: idKey.slice(3, 15),
    });

    return badLogin();
  }

  const { data: acct } = await admin
    .from("xedruo_accounts")
    .select("status")
    .eq("id", signedIn.user.id)
    .maybeSingle();

  if (acct?.status !== "active") {
    await admin.auth.admin.signOut(
      signedIn.session.access_token
    );

    audit("id_login_suspended", {
      user: signedIn.user.id,
      company: company.slug,
    });

    return fail(
      "account_suspended",
      "This account is suspended.",
      403,
      echo
    );
  }

  await admin.rpc("xedruo_throttle_clear", {
    p_key: idKey,
  });

  audit("id_login_succeeded", {
    user: signedIn.user.id,
    company: company.slug,
  });

  const session = signedIn.session;

  return reply(
    {
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
      },
    },
    200,
    echo
  );
}

Deno.serve(async (req) => {
  const origin = normOrigin(req.headers.get("origin"));
<<<<<<< HEAD
  let echo: string | null = null; // set once the origin is verified, so error responses carry CORS headers too
  try {
    const companies = await registry();
    const originAllowed = !!origin && companies.some((c) => c.origin === origin);
    echo = originAllowed ? origin : null; // CORS only for verified company origins
=======

  try {
    const companies = await registry();

    const originAllowed =
      !!origin && companies.some((c) => c.origin === origin);

    const echo = originAllowed ? origin : null;
>>>>>>> 32fea9fbc9f416f27ec33f8b759f2f8e9fd2693b

    if (req.method === "OPTIONS") {
      return originAllowed
        ? new Response(null, {
            status: 204,
            headers: corsFor(echo),
          })
        : new Response(null, { status: 403 });
    }

    if (!originAllowed) {
      return fail(
        "origin_not_registered",
        "This origin is not a registered Xedruo company.",
        403,
        null
      );
    }

    const url = new URL(req.url);

    const route =
      url.pathname.replace(
        /^\/(functions\/v1\/)?xedruo-auth-gateway/,
        ""
      ) || "/";

    const reg = route.match(
      /^\/registry\/([a-z0-9-]{1,64})$/
    );

    if (req.method === "GET" && reg) {
      const company = companies.find(
        (c) => c.slug === reg[1]
      );

      return company
        ? reply(
            {
              slug: company.slug,
              name: company.name,
            },
            200,
            echo
          )
        : fail("not_found", "Unknown company.", 404, echo);
    }

    const slug = (
      req.headers.get("x-xedruo-company") ?? ""
    )
      .trim()
      .toLowerCase();

    const company = companies.find(
      (c) => c.slug === slug
    );

    if (!company || company.origin !== origin) {
      audit("company_binding_failed", {
        slug,
        origin,
      });

      return fail(
        "company_not_authorized",
        "This app is not authorized for that company.",
        403,
        echo
      );
    }

    if (
      req.method === "POST" &&
      route === "/auth/v1/id/login"
    ) {
      return await idLogin(req, company, echo);
    }

    const authz = req.headers.get("authorization") ?? "";

    if (!/^Bearer\s+\S+/i.test(authz)) {
      return fail(
        "unauthenticated",
        "Sign in required.",
        401,
        echo
      );
    }

    const userDb = createClient(
      SUPABASE_URL,
      ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authz,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: authData, error: authError } =
      await userDb.auth.getUser();

    if (authError || !authData?.user) {
      return fail(
        "unauthenticated",
        "Sign in required.",
        401,
        echo
      );
    }

    const user = authData.user;

    if (limited(`${user.id}:${route}`, 30)) {
      return fail(
        "rate_limited",
        "Too many requests.",
        429,
        echo
      );
    }

    const { data: account, error: accountError } =
      await admin
        .from("xedruo_accounts")
        .select("status")
        .eq("id", user.id)
        .maybeSingle();

    if (accountError) throw accountError;

    if (!account) {
      return fail(
        "account_not_ready",
        "Account is not ready. Try again shortly.",
        403,
        echo
      );
    }

    if (account.status !== "active") {
      audit("suspended_account_blocked", {
        user: user.id,
        company: company.slug,
      });

      return fail(
        "account_suspended",
        "This account is suspended.",
        403,
        echo
      );
    }

    if (
      req.method === "GET" &&
      route === "/identity/me"
    ) {
      const identity = await readIdentity(
        userDb,
        user.id
      );

      const missing = missingFields(
        identity,
        user.phone ?? null,
        user.phone_confirmed_at ?? null
      );

      return reply(
        {
          identity: publicIdentity(identity),
          missing,
        },
        200,
        echo
      );
    }

    if (
      req.method === "POST" &&
      route === "/identity/onboarding"
    ) {
      if (limited(`${user.id}:onboard`, 10)) {
        return fail(
          "rate_limited",
          "Too many attempts.",
          429,
          echo
        );
      }

      const raw = await req.text();

      if (raw.length > 4096) {
        return fail(
          "payload_too_large",
          "Request too large.",
          413,
          echo
        );
      }

      let body: Record<string, unknown> = {};

      try {
        body = JSON.parse(raw || "{}");
      } catch {
        return fail(
          "bad_request",
          "Invalid JSON.",
          400,
          echo
        );
      }

      const countryCode = String(
        body.countryCode ?? ""
      )
        .trim()
        .toUpperCase();

      const phoneE164 = String(
        body.phoneE164 ?? ""
      ).trim();

      const legalName = String(
        body.legalName ?? ""
      )
        .trim()
        .replace(/\s+/g, " ");

      if (!COUNTRY_RE.test(countryCode)) {
        return fail(
          "invalid_country",
          "Select a valid country.",
          400,
          echo
        );
      }
<<<<<<< HEAD
      if (!identity?.xedruo_id) {
        const { error } = await userDb.rpc("ensure_xedruo_identity", { p_country_code: countryCode });
        if (error) return dbError("ensure_xedruo_identity", error, echo);
=======

      if (!PHONE_RE.test(phoneE164)) {
        return fail(
          "invalid_phone",
          "Enter a valid international phone number.",
          400,
          echo
        );
>>>>>>> 32fea9fbc9f416f27ec33f8b759f2f8e9fd2693b
      }

      if (
        legalName.length < 3 ||
        legalName.length > 160
      ) {
        return fail(
          "invalid_name",
          "Enter your full legal name (3–160 characters).",
          400,
          echo
        );
      }

      if (
        !user.phone ||
        !user.phone_confirmed_at ||
        user.phone !== phoneE164
      ) {
        return fail(
          "phone_not_verified",
          "Verify this phone number before completing Xedruo identity registration.",
          409,
          echo
        );
      }

      const existingIdentity = await readIdentity(
        userDb,
        user.id
      );

      if (existingIdentity?.status === "suspended") {
        return fail(
          "identity_suspended",
          "This Xedruo identity is suspended.",
          403,
          echo
        );
      }

      if (
        existingIdentity?.country_code &&
        existingIdentity.country_code !== countryCode
      ) {
        return fail(
          "country_locked",
          "The country on an issued Xedruo ID cannot be changed.",
          409,
          echo
        );
      }

      const { error: onboardingError } = await userDb.rpc(
        "complete_xedruo_identity_onboarding",
        {
          p_country_code: countryCode,
          p_phone_e164: phoneE164,
          p_legal_name: legalName,
          p_company_slug: company.slug,
        }
      );

      if (onboardingError) throw onboardingError;

      const identity = await readIdentity(
        userDb,
        user.id
      );

      const missing = missingFields(
        identity,
        user.phone ?? null,
        user.phone_confirmed_at ?? null
      );

      audit("onboarding_completed", {
        user: user.id,
        company: company.slug,
        country: countryCode,
      });
<<<<<<< HEAD
      if (onErr) return dbError("complete_xedruo_identity_onboarding", onErr, echo);
      identity = await readIdentity(userDb, user.id);
      audit("onboarding_completed", { user: user.id, company: company.slug, country: countryCode });
      return reply({ identity: publicIdentity(identity), missing: missingFields(identity) }, 200, echo);
=======

      return reply(
        {
          identity: publicIdentity(identity),
          missing,
        },
        200,
        echo
      );
>>>>>>> 32fea9fbc9f416f27ec33f8b759f2f8e9fd2693b
    }

    if (
      req.method === "POST" &&
      route === "/session/validate"
    ) {
      const identity = await readIdentity(
        userDb,
        user.id
      );

      if (identity?.status === "suspended") {
        return fail(
          "identity_suspended",
          "This Xedruo identity is suspended.",
          403,
          echo
        );
      }
<<<<<<< HEAD
      const { data, error } = await userDb.rpc("ensure_xedruo_company_profile", {
        p_company_slug: company.slug,
        p_display_name: identity!.legal_name,
      });
      if (error) return dbError("ensure_xedruo_company_profile", error, echo);
      const membership = first(data as Record<string, unknown> | Record<string, unknown>[] | null);
      audit("access_granted", { user: user.id, company: company.slug });
      return reply({
        status: "granted",
        company: { slug: company.slug, name: company.name },
        identity: publicIdentity(identity),
        membership: membership ? { id: (membership as Record<string, unknown>).id ?? null } : null,
      }, 200, echo);
=======

      const missing = missingFields(
        identity,
        user.phone ?? null,
        user.phone_confirmed_at ?? null
      );

      if (missing.length > 0) {
        return reply(
          {
            status: "onboarding_required",
            missing,
            company: {
              slug: company.slug,
              name: company.name,
            },
          },
          200,
          echo
        );
      }

      const { data, error } = await userDb.rpc(
        "ensure_xedruo_company_profile",
        {
          p_company_slug: company.slug,
          p_display_name: identity!.legal_name,
        }
      );

      if (error) throw error;

      const membership = first(
        data as
          | Record<string, unknown>
          | Record<string, unknown>[]
          | null
      );

      audit("access_granted", {
        user: user.id,
        company: company.slug,
      });

      return reply(
        {
          status: "granted",
          company: {
            slug: company.slug,
            name: company.name,
          },
          identity: publicIdentity(identity),
          membership: membership
            ? {
                id:
                  (membership as Record<string, unknown>)
                    .id ?? null,
              }
            : null,
        },
        200,
        echo
      );
>>>>>>> 32fea9fbc9f416f27ec33f8b759f2f8e9fd2693b
    }

    return fail(
      "not_found",
      "Unknown route.",
      404,
      echo
    );
  } catch (err) {
<<<<<<< HEAD
    const ref = crypto.randomUUID().slice(0, 8);
    console.error("gateway_error", ref, err instanceof Error ? err.message : JSON.stringify(err));
    return fail("server_error", `Something went wrong (ref ${ref}). Please try again.`, 500, echo);
=======
    console.error(
      "gateway_error",
      err instanceof Error ? err.message : err
    );

    return fail(
      "server_error",
      "Something went wrong. Please try again.",
      500,
      null
    );
>>>>>>> 32fea9fbc9f416f27ec33f8b759f2f8e9fd2693b
  }
});