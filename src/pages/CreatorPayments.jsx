import React, { useEffect, useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, Link2, Loader2, Plus } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { money } from "@/lib/format";
const currencies = ["NGN", "USD", "GBP", "EUR", "GHS", "KES", "ZAR"];

export default function CreatorPayments() {
  const [txns, setTxns] = useState([]);
  const [form, setForm] = useState({ currency: "NGN", type: "credit", category: "payment_link" });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => xedruo.entities.WalletTransaction.list("-created_date", 60).then(setTxns);
  useEffect(() => { load(); }, []);

  const add = async () => {
    setSaving(true);
    await xedruo.entities.WalletTransaction.create({ ...form, amount: Number(form.amount) || 0, status: "completed" });
    setSaving(false); setOpen(false); setForm({ currency: "NGN", type: "credit", category: "payment_link" }); load();
  };

  const balance = txns.reduce((a, t) => a + (t.type === "credit" ? 1 : -1) * (t.amount || 0), 0);
  const income = txns.filter(t => t.type === "credit").reduce((a, t) => a + t.amount, 0);
  const spent = txns.filter(t => t.type === "debit").reduce((a, t) => a + t.amount, 0);

  return (
    <div>
      <PageHeader title="Xedruo Creator Payments" subtitle="Your wallet, invoices, payment links and payouts." action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Record Payment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Transaction</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Description</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Amount</Label><Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Currency</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="credit">Money In</SelectItem><SelectItem value="debit">Money Out</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button onClick={add} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />

      <div className="rounded-2xl bg-primary text-primary-foreground p-7 mb-6 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-center gap-2 text-primary-foreground/80 text-sm mb-2"><Wallet className="w-4 h-4" /> Wallet Balance</div>
        <div className="text-4xl font-bold">{money(balance)}</div>
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" size="sm"><Link2 className="w-4 h-4 mr-1" /> Payment Link</Button>
          <Button variant="secondary" size="sm"><ArrowUpRight className="w-4 h-4 mr-1" /> Withdraw</Button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 mb-8">
        <StatCard icon={ArrowDownLeft} label="Total Received" value={money(income)} />
        <StatCard icon={ArrowUpRight} label="Total Out" value={money(spent)} />
      </div>

      <h3 className="font-semibold mb-3">Transaction history</h3>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {txns.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</div>}
        {txns.map((t) => (
          <div key={t.id} className="p-4 flex items-start gap-4">
            <span className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 ${t.type === "credit" ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-600"}`}>
              {t.type === "credit" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{t.description || t.category}</div>
              <div className="text-xs text-muted-foreground capitalize">{t.category?.replace(/_/g, " ")}</div>
              {/* Revenue split tags — shown for non-subscription credits */}
              {t.type === "credit" && t.artist_share > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[11px] bg-green-500/10 text-green-700 px-2 py-0.5 rounded-full">Artist {money(t.artist_share, t.currency)}</span>
                  {t.producer_share > 0 && <span className="text-[11px] bg-blue-500/10 text-blue-700 px-2 py-0.5 rounded-full">Producer {money(t.producer_share, t.currency)}</span>}
                  {t.xedruo_share > 0 && <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">Xedruo {money(t.xedruo_share, t.currency)}</span>}
                </div>
              )}
            </div>
            <div className={`font-semibold shrink-0 ${t.type === "credit" ? "text-green-600" : ""}`}>{t.type === "credit" ? "+" : "-"}{money(t.amount, t.currency)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}