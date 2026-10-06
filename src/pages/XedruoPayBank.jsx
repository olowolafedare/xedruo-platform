import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Landmark, Wallet, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { xedruo } from "@/api/xedruoClient";
import { ensureXedruoId, linkCompany } from "@/lib/xedruoIdentity";

// Xedruo Pay/Bank is the customer bank and payments hub.
const SECTIONS = [
  { key: "banking", label: "Banking", icon: Landmark, desc: "Account, balances, statements and transfers.", features: ["Account number", "Balances", "Statements", "Transfers"] },
  { key: "payments", label: "Payments", icon: Wallet, desc: "Send, receive, pay bills and manage beneficiaries.", features: ["Send money", "Receive", "Bills", "Beneficiaries"] },
];

export default function XedruoPayBank() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    let mounted = true;
    xedruo.auth.me().then(async (me) => {
      if (!mounted) return;
      setUser(me);
      try { await ensureXedruoId(); await linkCompany("pay-bank"); } catch (_) {}
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="w-4 h-4" /> Xedruo</Link>
          <div className="w-px h-5 bg-border" />
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-lg">💳</div>
          <div><div className="font-display font-bold leading-none">Xedruo Pay/Bank</div><div className="text-[11px] text-muted-foreground">Bank · Payments</div></div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-2xl p-6 sm:p-8 mb-6 bg-gradient-to-br from-emerald-500/15 to-card border border-emerald-500/30">
          <div className="text-3xl mb-2">💳</div><h1 className="text-2xl sm:text-3xl font-display font-bold">Xedruo Pay/Bank</h1>
          <p className="text-muted-foreground mt-1 max-w-lg text-sm">Your Xedruo bank and payments hub for accounts, balances, transfers and payments.</p>
          {user?.xedruo_id && <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-secondary/60 border border-border px-3 py-1.5 text-xs"><Link2 className="w-3.5 h-3.5 text-emerald-400" />Account number <span className="font-mono font-semibold text-emerald-400">{user.xedruo_id}</span></div>}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((s) => { const Icon = s.icon; return <div key={s.key} className="rounded-2xl bg-card border border-border p-5 flex flex-col"><div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-emerald-400" /></div><h3 className="font-semibold">{s.label}</h3><p className="text-xs text-muted-foreground mt-1 mb-3">{s.desc}</p><div className="flex flex-wrap gap-1.5">{s.features.map((f) => <span key={f} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-secondary/70 border border-border">{f}</span>)}</div></div> })}
        </div>
        <div className="mt-6 text-xs text-muted-foreground text-center">Your 10-digit Xedruo ID is your Xedruo bank account number.</div>
      </main>
    </div>
  );
}
