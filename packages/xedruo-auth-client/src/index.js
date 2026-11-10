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
const randomToken = (size = 32) => {
  const bytes = new Uint8Array(size);
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
  const stateKey = key + ".state";
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
          "X-Xedruo-Company": slug,
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        ...(body ? { body: JSON.stringify({ companySlug: slug, ...body }) } : {}),
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
    const verifier = randomToken(32);
    const challenge = await sha256(verifier);
    const state = randomToken(32);
    storage.setItem(verifierKey, verifier);
    storage.setItem(stateKey, state);
    const path = safePath(returnTo);
    if (path) storage.setItem(returnKey, path);
    else storage.removeItem(returnKey);
    const params = new URLSearchParams({
      companySlug: slug,
      callbackUrl,
      state,
      codeChallenge: challenge,
    });
    if (prompt && prompt !== "select_account") params.set("prompt", prompt);
    // The central API validates the registered callback and redirects to Google.
    window.location.assign(api + "/google/start?" + params.toString());
  }

  async function handleCallback() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");
    if (url.searchParams.has("error") || url.searchParams.has("error_description")) {
      throw new XedruoAuthError("oauth_failed", "Google sign-in was cancelled or could not be completed.", 400);
    }
    if (!code || !returnedState) throw new XedruoAuthError("missing_code", "The sign-in callback did not contain an authorization code and state.", 400);
    const expectedState = storage.getItem(stateKey);
    if (!expectedState || returnedState !== expectedState) {
      throw new XedruoAuthError("oauth_state_mismatch", "The sign-in session could not be verified. Please start again.", 400);
    }
    const verifier = storage.getItem(verifierKey);
    if (!verifier) throw new XedruoAuthError("pkce_state_missing", "This sign-in session expired. Please start again.", 400);
    const data = await request("/oauth/exchange", {
      method: "POST",
      body: { code, callbackUrl, codeVerifier: verifier },
    });
    const session = data.session;
    if (!session?.access_token || !session?.refresh_token) throw new XedruoAuthError("invalid_session", "Xedruo did not return a valid company session.", 502);
    save({ access_token: session.access_token, refresh_token: session.refresh_token, expires_at: Date.now() + Number(session.expires_in || 900) * 1000 });
    storage.removeItem(verifierKey);
    storage.removeItem(stateKey);
    window.history.replaceState({}, "", url.pathname);
    return { ...session, returnTo: safePath(storage.getItem(returnKey)) };
  }

  async function getAccess() {
    let session = read();
    if (!session?.access_token) throw new XedruoAuthError("unauthenticated", "Sign in required.", 401);
    if (session.expires_at && session.expires_at <= Date.now() + 30000) {
      const rotated = await request("/session/refresh", {
        method: "POST",
        body: { refreshToken: session.refresh_token },
      });
      if (!rotated.session?.access_token) throw new XedruoAuthError("invalid_session", "Xedruo could not refresh this session.", 401);
      session = { ...session, ...rotated.session, expires_at: Date.now() + Number(rotated.session.expires_in || 900) * 1000 };
      save(session);
    }
    return request("/session/validate", { method: "POST", token: session.access_token });
  }

  async function onboard({ countryCode, phoneE164, legalName }) {
    const session = read();
    if (!session?.access_token) throw new XedruoAuthError("unauthenticated", "Sign in required.", 401);
    return request("/identity/onboarding", {
      method: "POST",
      token: session.access_token,
      body: { countryCode, phoneE164, legalName },
    });
  }

  async function signOut() {
    const session = read();
    try {
      if (session?.access_token) await request("/session/logout", { method: "POST", token: session.access_token });
    } finally {
      clear();
      storage.removeItem(verifierKey);
      storage.removeItem(stateKey);
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
