// @xedruo/auth-client
// Browser client for Xedruo's Neon-backed central authentication API.
// Company apps keep their own callback URL and session; the platform never hosts their dashboard.

export class XedruoAuthError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "XedruoAuthError";
    this.code = code;
    this.status = status;
  }
}

const DEFAULT_AUTH_ORIGIN = "https://xedruo.com";
const b64url = (bytes) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
const randomVerifier = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return b64url(bytes);
};
const sha256 = async (value) => b64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
const safePath = (value) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;

export function createXedruoAuth({
  companySlug,
  callbackPath = "/auth/callback",
  callbackUrl: callbackUrlOverride,
  authOrigin = DEFAULT_AUTH_ORIGIN,
  storage = typeof window !== "undefined" ? window.sessionStorage : null,
}) {
  if (!companySlug) throw new Error("companySlug is required.");
  if (typeof window === "undefined" || !storage) throw new Error("XedruoAuth must be initialized in a browser.");
  const slug = String(companySlug).trim().toLowerCase();
  const origin = authOrigin.replace(/\/$/, "");
  const api = origin + "/api/auth";
  const key = "xedruo.central." + slug;
  const verifierKey = key + ".pkce";
  const returnKey = key + ".return";
  const callbackUrl = callbackUrlOverride || new URL(callbackPath, window.location.origin).toString();

  const read = () => {
    try { return JSON.parse(storage.getItem(key) || "null"); } catch { return null; }
  };
  const save = (session) => storage.setItem(key, JSON.stringify(session));
  const clear = () => storage.removeItem(key);

  async function request(path, { method = "GET", token, body } = {}) {
    let response;
    try {
      response = await fetch(api + path, {
        method,
        headers: {
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
      });
    } catch {
      throw new XedruoAuthError("network_error", "Could not reach Xedruo authentication.", 0);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new XedruoAuthError(data.error || "request_failed", data.message || "Authentication request failed.", response.status);
    return data;
  }

  async function signInWithGoogle({ returnTo, prompt = "select_account" } = {}) {
    const verifier = randomVerifier();
    const challenge = await sha256(verifier);
    storage.setItem(verifierKey, verifier);
    const path = safePath(returnTo);
    if (path) storage.setItem(returnKey, path);
    else storage.removeItem(returnKey);
    const params = new URLSearchParams({
      company_slug: slug,
      callback_url: callbackUrl,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    // The central API validates the registered callback before redirecting to Google.
    window.location.assign(api + "/google/start?" + params.toString() + (prompt === "select_account" ? "" : "&prompt=" + encodeURIComponent(prompt)));
  }

  async function handleCallback() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (url.searchParams.has("error") || url.searchParams.has("error_description")) {
      throw new XedruoAuthError("oauth_failed", "Google sign-in was cancelled or could not be completed.", 400);
    }
    if (!code) throw new XedruoAuthError("missing_code", "The sign-in callback did not contain an authorization code.", 400);
    const verifier = storage.getItem(verifierKey);
    if (!verifier) throw new XedruoAuthError("pkce_state_missing", "This sign-in session expired. Please start again.", 400);
    const session = await request("/google/exchange", {
      method: "POST",
      body: { code, company_slug: slug, callback_url: callbackUrl, code_verifier: verifier },
    });
    if (!session.access_token || !session.refresh_token) throw new XedruoAuthError("invalid_session", "Xedruo did not return a valid company session.", 502);
    save({ access_token: session.access_token, refresh_token: session.refresh_token, expires_at: Date.now() + Number(session.expires_in || 900) * 1000 });
    storage.removeItem(verifierKey);
    window.history.replaceState({}, "", url.pathname);
    return { ...session, returnTo: safePath(storage.getItem(returnKey)) };
  }

  async function getAccess() {
    let session = read();
    if (!session?.access_token) throw new XedruoAuthError("unauthenticated", "Sign in required.", 401);
    if (session.expires_at && session.expires_at <= Date.now() + 30000) {
      const rotated = await request("/refresh", { method: "POST", body: { refresh_token: session.refresh_token, company_slug: slug } });
      session = { ...session, ...rotated, expires_at: Date.now() + Number(rotated.expires_in || 900) * 1000 };
      save(session);
    }
    return request("/session", { token: session.access_token });
  }

  async function onboard({ countryCode, phoneE164, legalName }) {
    const session = read();
    if (!session?.access_token) throw new XedruoAuthError("unauthenticated", "Sign in required.", 401);
    return request("/identity/onboarding", {
      method: "POST",
      token: session.access_token,
      body: { country_code: countryCode, phone_e164: phoneE164, legal_name: legalName },
    });
  }

  async function signOut() {
    const session = read();
    try {
      if (session?.access_token) await request("/logout", { method: "POST", token: session.access_token });
    } finally {
      clear();
      storage.removeItem(verifierKey);
      storage.removeItem(returnKey);
    }
  }

  return {
    companySlug: slug,
    callbackUrl,
    signInWithGoogle,
    handleCallback,
    getAccess,
    onboard,
    signOut,
    getSession: () => read(),
    consumeReturnTo: () => {
      const path = safePath(storage.getItem(returnKey));
      storage.removeItem(returnKey);
      return path;
    },
  };
}
