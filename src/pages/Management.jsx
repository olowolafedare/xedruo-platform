import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { xedruo } from "@/api/xedruoClient";
import { ChevronLeft, Shield, Eye, EyeOff, Lock, Users, Cpu, Headphones, Crown, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

// Parent Company roles shown on the management card.
// The six Parent Company work areas.
const roles = [
  { key: "governor", label: "Governor", icon: Shield, desc: "Full access across all six work areas." },
  { key: "ceo", label: "CEO", icon: Crown, desc: "Company management oversight." },
  { key: "cfo", label: "CFO", icon: Users, desc: "Access company financial records." },
  { key: "developer", label: "Developer", icon: Cpu, desc: "Work on a company's application." },
  { key: "customer_service", label: "Customer Service", icon: Headphones, desc: "Serve a selected company's customers." },
  { key: "operations", label: "Operations", icon: Activity, desc: "Manage company operations." },
];

export default function Management() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState("governor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      // Remember the chosen staff role and direct the auth redirect to the Parent Company dashboard.
      localStorage.setItem("xedruo_staff_role", role);
      window.history.replaceState({}, "", "/management?returnTo=/parent-company");
      await xedruo.auth.loginViaEmailPassword(email, password);
      toast({ title: "Welcome back", description: "Signed in to Management." });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Sign-in failed",
        description: "Check your credentials. If you don't have an account yet, ask an admin to invite you.",
      });
    } finally {
      setLoading(false);
    }
  };

  const active = roles.find((r) => r.key === role);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-background to-background text-foreground flex flex-col">
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center">
        <Link to="/ecosystem" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back to Xedruo
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left — role picker */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-slate-700/40 flex items-center justify-center text-2xl">🛡️</div>
              <div>
                <h1 className="text-2xl font-display font-bold">Management</h1>
                <p className="text-sm text-muted-foreground">Governor & staff access</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 mb-5 max-w-md">
              Sign in with your Xedruo account. Governors can open any company with the same credentials. Choose your role to continue.
            </p>
            <Link to="/developer-workstation" className="block">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Developer Workstation</div>
                  <div className="text-xs text-muted-foreground truncate">Manage every company as an independent project</div>
                </div>
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </Link>
            <div className="space-y-2">
              {roles.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.key}
                    onClick={() => setRole(r.key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                      role === r.key
                        ? "bg-primary/10 border-primary/50"
                        : "bg-card border-border hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${role === r.key ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{r.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right — login form */}
          <div className="rounded-2xl bg-card border border-border p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-1">
              <active.icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{active.label} sign-in</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Use your Xedruo email and password. Accounts are created by admin invite.
            </p>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@xedruo.com"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in…" : `Continue as ${active.label}`}
              </Button>
            </form>
            <div className="mt-5 pt-5 border-t border-border text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Staff to register (by admin invite):</p>
              <ul className="space-y-1">
                <li>• Governor — olowolafe miracle</li>
                <li>• Governor — olowolafe blessing</li>
                <li>• Developer — Godwill</li>
                <li>• Customer Service — Cassiee</li>
                <li>• CEO · CFO · Operations</li>
              </ul>
              <p className="pt-1">Passwords are set by each person when they accept their invite — Xedruo never stores or assigns passwords manually.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}