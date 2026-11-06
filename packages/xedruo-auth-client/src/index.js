// @xedruo/auth-client
// Shared, framework-agnostic sign-in client for every Xedruo company app.
//
// Rules this client enforces:
//  - Sign-in starts and ends on the product's own origin. No redirect to the platform.
//  - The product keeps its own session (storage key is per company).
//  - The platform gateway is only asked "is this user onboarded and granted for my company?".
//  - Any failure fails closed: it throws, it never falls back to another app or dashboard.

import { createClient } from '@supabase/supabase-js';

export class XedruoAuthError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'XedruoAuthError';
    this.code = code;
    this.status = status;
  }
}

const RETURN_KEY = 'xedruo_return_to';

// Same-origin relative path only: one leading slash, no "//", no backslash.
function safePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  if (value.startsWith('//') || value.includes('\\')) return null;
  return value;
}

export function createXedruoAuth({
  supabaseUrl,
  supabasePublishableKey,
  gatewayUrl, // e.g. https://<project>.supabase.co/functions/v1/xedruo-auth-gateway
  companySlug, // must equal the slug registered in xedruo_company_app_registry
  callbackPath = '/auth/callback',
  onboardingPath = '/onboarding',
  dashboardPath = '/dashboard',
}) {
  if (!supabaseUrl || !supabasePublishableKey || !gatewayUrl || !companySlug) {
    throw new Error('createXedruoAuth: supabaseUrl, supabasePublishableKey, gatewayUrl and companySlug are required.');
  }
  const slug = String(companySlug).trim().toLowerCase();
  const gateway = gatewayUrl.replace(/\/$/, '');

  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // the callback exchanges the code explicitly
      storageKey: `xedruo-auth-${slug}`, // session belongs to this product only
    },
  });

  const callbackUrl = () => new URL(callbackPath, window.location.origin).toString();

  async function call(path, { method = 'GET', body, authenticated = true } = {}) {
    const headers = { 'Content-Type': 'application/json', 'X-Xedruo-Company': slug };
    if (authenticated) {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new XedruoAuthError('unauthenticated', 'Sign in required.', 401);
      headers.Authorization = `Bearer ${token}`;
    }
    let res;
    try {
      res = await fetch(`${gateway}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new XedruoAuthError('network', 'Could not reach Xedruo sign-in. Please try again.', 0);
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new XedruoAuthError(json.error || 'request_failed', json.message || 'Request failed.', res.status);
    return json;
  }

  const rememberReturnTo = (returnTo) => {
    const p = safePath(returnTo);
    try { p ? sessionStorage.setItem(RETURN_KEY, p) : sessionStorage.removeItem(RETURN_KEY); } catch { /* storage unavailable */ }
  };
  const consumeReturnTo = () => {
    try {
      const p = safePath(sessionStorage.getItem(RETURN_KEY));
      sessionStorage.removeItem(RETURN_KEY);
      return p;
    } catch { return null; }
  };

  // --- sign-in methods (all complete on this product's origin) ---
  async function signInWithGoogle({ returnTo, queryParams } = {}) {
    rememberReturnTo(returnTo);
    // redirectTo carries no query string: it must match the registered callback exactly.
    // queryParams are passed to Google (e.g. { prompt: 'select_account' }), not to the callback.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl(), queryParams },
    });
    if (error) throw new XedruoAuthError('oauth_start_failed', 'Could not start Google sign-in.', 400);
  }

  async function signInWithPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Generic message on purpose: never reveal whether the email exists.
    if (error) throw new XedruoAuthError('invalid_credentials', 'Incorrect email or password.', 401);
    return getAccess();
  }

  // Xedruo ID + password. The gateway verifies the credentials and returns the session directly
  // to this app (no browser redirect, nothing in the URL); it is stored under THIS product's key.
  async function signInWithXedruoId(xedruoId, password) {
    const { session } = await call('/auth/v1/id/login', {
      method: 'POST',
      body: { xedruoId, password },
      authenticated: false,
    });
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (error) throw new XedruoAuthError('session_failed', 'Sign-in could not be completed. Please try again.', 400);
    return getAccess();
  }

  async function signUpWithPassword(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) throw new XedruoAuthError('signup_failed', error.message, error.status || 400);
    // With email confirmation on there is no session yet; the confirm link lands on the callback.
    return { needsEmailConfirmation: !data.session };
  }

  // Call this on the product's callback route. Idempotent per code (safe under React StrictMode).
  const exchanges = new Map();
  function handleCallback() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const oauthError = url.searchParams.get('error_description') || url.searchParams.get('error');
    if (oauthError) return Promise.reject(new XedruoAuthError('oauth_error', 'Sign-in was cancelled or failed. Please try again.', 400));
    if (!code) return Promise.reject(new XedruoAuthError('missing_code', 'Sign-in did not return a valid code. Please start again.', 400));
    if (exchanges.has(code)) return exchanges.get(code);
    const p = (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      window.history.replaceState({}, '', url.pathname); // drop ?code= from the address bar
      if (error) {
        const expired = /code verifier|pkce/i.test(error.message || '');
        throw new XedruoAuthError(
          expired ? 'pkce_state_lost' : 'exchange_failed',
          expired ? 'This sign-in expired or was opened in another browser. Please start again.' : 'Sign-in could not be completed.',
          400,
        );
      }
      return getAccess();
    })();
    exchanges.set(code, p);
    return p;
  }

  // --- access via the platform gateway ---
  const getAccess = () => call('/session/validate', { method: 'POST' });
  const getIdentity = () => call('/identity/me');

  async function onboard({ countryCode, phoneE164, legalName }) {
    await call('/identity/onboarding', { method: 'POST', body: { countryCode, phoneE164, legalName } });
    return getAccess();
  }

  // Where to send the user next, on THIS product. Never leaves the origin.
  function nextPath(access) {
    if (access?.status === 'granted') return consumeReturnTo() || dashboardPath;
    if (access?.status === 'onboarding_required') return onboardingPath;
    throw new XedruoAuthError('access_denied', 'Access could not be granted.', 403);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return {
    supabase, // for the product's own data access with the user's session
    companySlug: slug,
    signInWithGoogle,
    signInWithPassword,
    signInWithXedruoId,
    signUpWithPassword,
    handleCallback,
    getAccess,
    getIdentity,
    onboard,
    nextPath,
    signOut,
    getSession: () => supabase.auth.getSession(),
    onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),
  };
}
