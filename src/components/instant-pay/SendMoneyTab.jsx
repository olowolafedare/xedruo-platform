import React, { useState } from "react";
import { Send, Loader2, CheckCircle2, Globe, Building2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { money } from "@/lib/format";

const currencies = ["NGN", "USD", "GBP", "EUR", "GHS", "KES", "ZAR"];
const localBanks = ["Access Bank", "GTBank", "Zenith Bank", "First Bank", "UBA", "Sterling Bank", "Wema Bank", "Kuda", "Opay", "Moniepoint"];

export default function SendMoneyTab({ onSent }) {
  const [mode, setMode] = useState("local");
  const [form, setForm] = useState({ currency: "NGN" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: typeof e === "string" ? e : e.target.value });

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    await xedruo.entities.WalletTransaction.create({
      description: `Transfer to ${form.recipient}`,
      type: "debit", amount: Number(form.amount) || 0,
      currency: form.currency, category: "transfer", status: "completed",
    });
    setSending(false); setDone(true); setForm({ currency: "NGN" }); onSent?.();
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex gap-2">
        <Button variant={mode === "local" ? "default" : "outline"} onClick={() => setMode("local")} size="sm">
          <Building2 className="w-4 h-4 mr-1.5" />Local Transfer
        </Button>
        <Button variant={mode === "international" ? "default" : "outline"} onClick={() => setMode("international")} size="sm">
          <Globe className="w-4 h-4 mr-1.5" />International
        </Button>
      </div>

      <form onSubmit={send} className="rounded-2xl border border-border bg-card p-6 space-y-4">
        {mode === "local" ? (
          <>
            <div className="space-y-1.5">
              <Label>Bank</Label>
              <Select value={form.bank} onValueChange={set("bank")}>
                <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                <SelectContent>{localBanks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Account Number</Label><Input required value={form.account || ""} onChange={set("account")} maxLength={10} /></div>
            <div className="space-y-1.5"><Label>Account Name</Label><Input value={form.recipient || ""} onChange={set("recipient")} /></div>
          </>
        ) : (
          <>
            <div className="space-y-1.5"><Label>Recipient Name</Label><Input required value={form.recipient || ""} onChange={set("recipient")} /></div>
            <div className="space-y-1.5"><Label>Country</Label><Input value={form.country || ""} onChange={set("country")} /></div>
            <div className="space-y-1.5"><Label>IBAN / Account Number</Label><Input value={form.account || ""} onChange={set("account")} /></div>
            <div className="space-y-1.5"><Label>SWIFT / BIC</Label><Input value={form.swift || ""} onChange={set("swift")} /></div>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Amount</Label><Input type="number" required value={form.amount || ""} onChange={set("amount")} /></div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={set("currency")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5"><Label>Note (optional)</Label><Input value={form.note || ""} onChange={set("note")} /></div>
        {form.amount && <p className="text-sm text-muted-foreground">Fee: {money(Math.round(Number(form.amount) * 0.01), form.currency)} · Recipient gets ≈ {money(Math.round(Number(form.amount) * 0.99), form.currency)}</p>}
        <Button type="submit" className="w-full" disabled={sending}>
          {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</> : done ? <><CheckCircle2 className="w-4 h-4 mr-2" />Sent!</> : <><Send className="w-4 h-4 mr-2" />Send Now</>}
        </Button>
      </form>
    </div>
  );
}