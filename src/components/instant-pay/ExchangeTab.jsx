import React, { useState } from "react";
import { ArrowRightLeft, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const rates = { NGN: 1, USD: 1300, GBP: 1755, EUR: 1520, GHS: 82, KES: 10.5, ZAR: 70 };
const currencies = Object.keys(rates);

export default function ExchangeTab() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("NGN");
  const [amount, setAmount] = useState("");

  const converted = amount ? ((Number(amount) * rates[from]) / rates[to]).toFixed(2) : "";
  const rate = (rates[from] / rates[to]).toFixed(4);
  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Currency Exchange</h3>

        <div className="space-y-1.5">
          <Label>You send</Label>
          <div className="flex gap-2">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="flex-1" />
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" size="icon" onClick={swap} className="rounded-full border border-border">
            <ArrowRightLeft className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>Recipient gets</Label>
          <div className="flex gap-2">
            <Input value={converted} readOnly className="flex-1 bg-muted" placeholder="0.00" />
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {amount && (
          <div className="text-sm text-muted-foreground flex items-center gap-1.5 bg-muted rounded-lg px-3 py-2">
            <RefreshCw className="w-3 h-3" />
            1 {from} = {rate} {to} · 0.5% exchange margin
          </div>
        )}

        <Button className="w-full" disabled={!amount || !converted}>Exchange Now</Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-primary" /><h3 className="font-semibold">Live Rates (base: NGN)</h3></div>
        <div className="divide-y divide-border">
          {Object.entries(rates).filter(([c]) => c !== "NGN").map(([c, r]) => (
            <div key={c} className="flex justify-between py-2.5 text-sm">
              <span className="font-medium">{c}</span>
              <span className="text-muted-foreground">₦{r.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}