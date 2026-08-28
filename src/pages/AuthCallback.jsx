import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/api/xedruoClient";
import { ensureXedruoId, saveCustomerContact } from "@/lib/xedruoIdentity";

const PRODUCTION_ORIGIN = "https://xedruo-platform.vercel.app";

function safeDestination(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

async function completeOAuthSession() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (oauthError) throw new Error(decodeURIComponent(oauthError.replace(/\+/g, " ")));

  let resolveAuth;
  let rejectAuth;
  const sessionPromise = new Promise((resolve, reject) => {
    resolveAuth = resolve;
    rejectAuth = reject;
  });
  let settled = false;
  const timeout = window.setTimeout(() => {
    if (!settled) {
      settled = true;
      rejectAuth(new Error("Google sign-in completed without an active session."));
    }
  }, 10000);

  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user && !settled) {
      settled = true;
      window.clearTimeout(timeout);
      resolveAuth(session);
    }
  });

  try {
    // PKCE callbacks return ?code=. Explicitly exchange it before relying on
    // getSession(), which fixes the race shown on the production callback.
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.session?.user) return data.session;
      // If Supabase already consumed the code during client initialization,
      // continue to getSession() instead of treating that as a failed login.
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data?.session?.user) return data.session;

    // Fallback for implicit/hash responses and delayed Supabase initialization.
    if (window.location.hash.includes("access_token=")) return await sessionPromise;
    return await sessionPromise;
  } finally {
    window.clearTimeout(timeout);
    authListener?.subscription?.unsubscribe?.();
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const destination = safeDestination(searchParams.get("redirect"));

    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname)) {
      const target = new URL("/auth/callback", PRODUCTION_ORIGIN);
      target.searchParams.set("redirect", destination);
      target.hash = window.location.hash;
      window.location.replace(target.toString());
      return () => { active = false; };
    }

    const finish = async () => {
      try {
        const session = await completeOAuthSession();
        if (!session?.user) throw new Error("Google sign-in completed without an active session.");

        const pending = localStorage.getItem("xedruo_pending_contact");
        if (pending) {
          try {
            const contact = JSON.parse(pending);
            await saveCustomerContact(contact);
          } finally {
            localStorage.removeItem("xedruo_pending_contact");
          }
        } else {
          await ensureXedruoId();
        }

        if (active) navigate(destination, { replace: true });
      } catch (err) {
        if (active) setError(err?.message || "Google sign-in could not be completed.");
      }
    };

    finish();
    return () => { active = false; };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Sign-in could not be completed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button className="mt-6 text-sm font-medium underline" onClick={() => navigate("/login", { replace: true })}>
            Return to login
          </button>
        </div>
      </main>
    );
  }

  return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
}
