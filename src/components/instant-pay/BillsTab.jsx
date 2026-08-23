import React, { useState } from "react";
import { Phone, Wifi, Zap, Droplets, Tv, Loader2, CheckCircle2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { money } from "@/lib/format";

const BILL_TYPES = [
  { id: "airtime", label: "Airtime", icon: Phone },
  { id: "data", label: "Data", icon: Wifi },
  { id: "electricity", label: "Electricity", icon: Zap },
  { id: "water", label: "Water", icon: Droplets },
  { id: "cable", label: "Cable TV", icon: Tv },
];

export default function BillsTab({ onPaid }) {
  const [type, setType] = useState("airtime");
  const [form, setForm] = useState({});
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: typeof e === "string" ? e : e.target.value });

  const pay = async (e) => {
    e.preventDefault();
    setPaying(true);
    const label = BILL_TYPES.find(b => b.id === type)?.label;
    await xedruo.entities.WalletTransaction.create({
      description: `${label} – ${form.number || form.meter || form.decoder || ""}`,
      type: "debit", amount: Number(form.amount) || 0,
      currency: "NGN", category: "transfer", status: "completed",
    });
    setPaying(false); setDone(true); setForm({}); onPaid?.();
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <div className="max-w-lg space-y-5">
      <div className="grid grid-cols-5 gap-2">
        {BILL_TYPES.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setType(id); setForm({}); }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${type === id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-accent"}`}>
            <Icon className="w-5 h-5" />{label}
          </button>
        ))}
      </div>

      <form onSubmit={pay} className="rounded-2xl border border-border bg-card p-6 space-y-4">
        {(type === "airtime" || type === "data") && (
          <>
            <div className="space-y-1.5"><Label>Network</Label>
              <Select value={form.network} onValueChange={set("network")}>
                <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
                <SelectContent>{["MTN", "Airtel", "Glo", "9mobile"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Phone Number</Label><Input required type="tel" value={form.number || ""} onChange={set("number")} /></div>
            {type === "data" && <div className="space-y-1.5"><Label>Data Plan</Label>
              <Select value={form.plan} onValueChange={set("plan")}>
                <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                <SelectContent>{["1GB – ₦500", "2GB – ₦1,000", "5GB – ₦2,000", "10GB – ₦3,500"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>}
          </>
        )}
        {type === "electricity" && (
          <>
            <div className="space-y-1.5"><Label>Disco</Label>
              <Select value={form.disco} onValueChange={set("disco")}>
                <SelectTrigger><SelectValue placeholder="Select distribution company" /></SelectTrigger>
                <SelectContent>{["EKEDC", "IKEDC", "AEDC", "PHEDC", "KAEDCO", "BEDC"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Meter Number</Label><Input required value={form.meter || ""} onChange={set("meter")} /></div>
          </>
        )}
        {type === "water" && <div className="space-y-1.5"><Label>Account Number</Label><Input required value={form.meter || ""} onChange={set("meter")} /></div>}
        {type === "cable" && (
          <>
            <div className="space-y-1.5"><Label>Provider</Label>
              <Select value={form.provider} onValueChange={set("provider")}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>{["DSTV", "GOtv", "Startimes"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Smart Card / Decoder Number</Label><Input required value={form.decoder || ""} onChange={set("decoder")} /></div>
          </>
        )}
        <div className="space-y-1.5"><Label>Amount (₦)</Label><Input type="number" required value={form.amount || ""} onChange={set("amount")} /></div>
        <Button type="submit" className="w-full" disabled={paying}>
          {paying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</> : done ? <><CheckCircle2 className="w-4 h-4 mr-2" />Payment Successful!</> : `Pay ${form.amount ? money(Number(form.amount)) : ""}`}
        </Button>
      </form>
    </div>
  );
}