import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/api/xedruoClient";
import { ensureXedruoId, saveCustomerContact } from "@/lib/xedruoIdentity";

function safeDestination(value) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let subscription;
    const destination = safeDestination(searchParams.get("redirect"));

    const finish = async () => {
      try {
        // Supabase consumes the OAuth response before this route is rendered.
        // Wait for the resulting session rather than racing the protected routes.
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (data?.session?.user) {
          const pending = localStorage.getItem("xedruo_pending_contact");
          if (pending) {
            try {
              const contact = JSON.parse(pending);
              await saveCustomerContact(contact);
              localStorage.removeItem("xedruo_pending_contact");
            } catch {
              // Contact completion must not block a successful Google login.
              localStorage.removeItem("xedruo_pending_contact");
            }
          } else {
            await ensureXedruoId();
          }
          if (active) navigate(destination, { replace: true });
          return;
        }

        const result = await new Promise((resolve, reject) => {
          let settled = false;
          const timeout = window.setTimeout(() => {
            if (!settled) {
              settled = true;
              reject(new Error("Google sign-in completed without an active session."));
            }
          }, 10000);
          subscription = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user && !settled) {
              settled = true;
              window.clearTimeout(timeout);
              resolve(session);
            }
          }).data.subscription;
        });

        if (result?.user && active) navigate(destination, { replace: true });
      } catch (err) {
        if (active) setError(err?.message || "Google sign-in could not be completed.");
      }
    };

    finish();
    return () => {
      active = false;
      subscription?.unsubscribe?.();
    };
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
