import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, Loader2, AlertTriangle } from "lucide-react";
import { platformAdminAuth } from "@/lib/platformAdminAuth";

export default function ParentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await platformAdminAuth.login(email.trim(), password);
      navigate("/parent-company", { replace: true });
    } catch (err) {
      setError(err?.message || "Unable to authenticate platform administrator.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold">Xedruo Governance</div>
          <h1 className="text-3xl font-bold mt-2">Platform Administration</h1>
          <p className="text-slate-400 mt-2">Authorized Xedruo executives only</p>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-950 border border-slate-800 p-4 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs leading-5 text-slate-300">Private administrator access. Customer registration and Google sign-in are not available here.</p>
          </div>
          {error && <div role="alert" className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 p-3 text-sm">{error}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parent-email" className="text-slate-200">Administrator email</Label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><Input id="parent-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="administrator email" className="pl-10 h-12 bg-slate-950 border-slate-700 text-white" required /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent-password" className="text-slate-200">Password</Label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" /><Input id="parent-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="administrator password" className="pl-10 h-12 bg-slate-950 border-slate-700 text-white" required /></div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying access...</> : "Enter Xedruo Platform"}
            </Button>
          </form>
          <div className="mt-5 text-center text-[11px] text-slate-500">Access is checked against the private Neon platform-admin registry.</div>
        </section>
      </div>
    </main>
  );
}
