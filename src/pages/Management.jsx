import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { xedruo } from "@/api/xedruoClient";
import { ChevronLeft, Shield, Eye, EyeOff, Lock, Users, Cpu, Headphones, Crown, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const roles = [
  { key: "governor", label: "Governor", icon: Shield, desc: "Full access across all six work areas." },
  { key: "ceo", label: "CEO", icon: Crown, desc: "Company management oversight." },
  { key: "cfo", label: "CFO", icon: Users, desc: "Access company financial records." },
  { key: "developer", label: "Developer", icon: Cpu, desc: "Work on a company's application." },
  { key: "customer_service", label: "Customer Service", icon: Headphones, desc: "Serve a selected company's customers." },
  { key: "operations", label: "Operations", icon: Activity, desc: "Manage company operations." },
];
const roleMap = Object.fromEntries(roles.map((role) => [role.key, role]));

export default function Management() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await xedruo.auth.loginViaEmailPassword(email, password);
      const me = await xedruo.auth.me();
      const role = typeof me?.staff_role === "string" ? roleMap[me.staff_role] : null;
      if (!role) {
        await xedruo.auth.logout().catch(() => {});
        throw new Error("This Xedruo account is not authorized for Parent Company management.");
      }
      toast({ title: "Welcome back", description: `Signed in as ${role.label}.` });
      navigate("/parent-company", { replace: true });
    } catch (err) {
      toast({ variant: "destructive", title: "Management sign-in failed", description: err?.message || "Check your credentials or staff authorization." });
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen bg-gradient-to-b from-slate-950 via-background to-background text-foreground flex flex-col">
    <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center"><Link to="/ecosystem" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /> Back to Xedruo</Link></header>
    <div className="flex-1 flex items-center justify-center px-4 py-8"><div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
      <div><div className="flex items-center gap-3 mb-2"><div className="w-11 h-11 rounded-xl bg-slate-700/40 flex items-center justify-center text-2xl">🛡️</div><div><h1 className="text-2xl font-display font-bold">Management</h1><p className="text-sm text-muted-foreground">Authorized Xedruo staff access</p></div></div><p className="text-sm text-muted-foreground mt-4 mb-5 max-w-md">Sign in with your Xedruo account. Your staff role is verified from your account after authentication; it cannot be selected or changed from this page.</p><div className="space-y-2">{roles.map((r) => { const Icon = r.icon; return <div key={r.key} className="w-full flex items-center gap-3 p-3 rounded-xl border bg-card border-border"><div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary"><Icon className="w-4 h-4" /></div><div><div className="text-sm font-medium">{r.label}</div><div className="text-xs text-muted-foreground">{r.desc}</div></div></div>; })}</div></div>
      <div className="rounded-2xl bg-card border border-border p-6 sm:p-8"><div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-primary" /><span className="text-sm font-medium">Staff sign-in</span></div><p className="text-xs text-muted-foreground mb-5">Use your Xedruo email and password. Only accounts with an authorized staff role can enter.</p><form onSubmit={handleLogin} className="space-y-3"><div><label className="text-xs text-muted-foreground">Email</label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@xedruo.com" className="mt-1" required /></div><div><label className="text-xs text-muted-foreground">Password</label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 pr-10" required /><button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div><Button type="submit" disabled={loading} className="w-full">{loading ? "Signing in…" : "Continue to Management"}</Button></form><div className="mt-5 pt-5 border-t border-border text-xs text-muted-foreground"><p>Staff permissions are controlled by the Xedruo account role. This page never stores or assigns staff roles.</p></div></div>
    </div></div>
  </div>;
}
