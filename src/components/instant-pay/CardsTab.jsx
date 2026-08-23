import React, { useState } from "react";
import { Eye, EyeOff, Wifi, Lock, Unlock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CardsTab() {
  const [show, setShow] = useState(false);
  const [frozen, setFrozen] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-semibold mb-4">Virtual Debit Card</h3>
        <div className={`relative rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-white p-6 w-full max-w-sm shadow-xl transition-all ${frozen ? "opacity-60 grayscale" : ""}`} style={{ aspectRatio: "1.6/1" }}>
          <div className="flex justify-between items-start mb-6">
            <div className="text-base font-bold tracking-widest">XEDRUO</div>
            <Wifi className="w-5 h-5 rotate-90 opacity-70" />
          </div>
          <div className="mb-4">
            <p className="text-xs opacity-60 mb-1">Card Number</p>
            <p className="text-lg font-mono tracking-widest">{show ? "4156 7823 9012 4582" : "**** **** **** 4582"}</p>
          </div>
          <div className="flex justify-between text-xs">
            <div><p className="opacity-60">CARD HOLDER</p><p className="font-semibold">ADA OBI</p></div>
            <div><p className="opacity-60">EXPIRES</p><p className="font-semibold">09/28</p></div>
            <div><p className="opacity-60">CVV</p><p className="font-semibold">{show ? "382" : "•••"}</p></div>
          </div>
          {frozen && <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/30"><Badge className="bg-white text-black text-sm px-4 py-1.5">FROZEN</Badge></div>}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setShow(!show)}>
            {show ? <><EyeOff className="w-4 h-4 mr-1" />Hide</> : <><Eye className="w-4 h-4 mr-1" />Show Details</>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFrozen(!frozen)}>
            {frozen ? <><Unlock className="w-4 h-4 mr-1" />Unfreeze</> : <><Lock className="w-4 h-4 mr-1" />Freeze</>}
          </Button>
          <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-1" />Settings</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Physical Debit Card</h3>
          <Badge variant="secondary">Mastercard</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Get a physical Mastercard delivered to your door. Available to all verified accounts in Nigeria.</p>
        <div className="flex items-center justify-between bg-muted rounded-xl p-4">
          <div>
            <p className="font-medium">₦3,500 delivery fee</p>
            <p className="text-xs text-muted-foreground">5–10 business days · Free replacement</p>
          </div>
          <Button>Order Card</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-3">Card Limits</h3>
        <div className="space-y-3 text-sm">
          {[["Daily Spend", "₦500,000", "₦1,000,000"], ["Single Transaction", "₦200,000", "₦500,000"], ["ATM Withdrawal", "₦150,000", "₦300,000"]].map(([label, used, limit]) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-muted-foreground">{label}</span>
              <span>{used} / {limit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}