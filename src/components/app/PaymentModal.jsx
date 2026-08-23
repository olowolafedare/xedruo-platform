import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, CreditCard } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { motion, AnimatePresence } from "framer-motion";
import { ngnToUsd } from "@/lib/currency";

const METHODS = [
  { id: "paystack", label: "Paystack (Local)", emoji: "🇳🇬", desc: "Card, bank transfer or USSD — pay in NGN (Nigeria/Africa)" },
  { id: "stripe", label: "Stripe (International)", emoji: "🌍", desc: "Pay with international card (Visa, Mastercard) — USD" },
];

// item = { name, price (display string), amount (number in NGN) }
// Accepts either `plan` (legacy) or `item` prop
export default function PaymentModal({ open, onClose, plan, item: itemProp, onSuccess }) {
  const item = itemProp || plan;
  const [step, setStep] = useState("method"); // method | details | processing | done
  const [method, setMethod] = useState("paystack");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    setStep("processing");
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2500));
    // Record the transaction
    await xedruo.entities.WalletTransaction.create({
      description: item?.name || "Payment",
      type: "debit",
      amount: item?.amount || 0,
      currency: "NGN",
      category: item?.category || "subscription",
      status: "completed",
    });
    setProcessing(false);
    setStep("done");
    setTimeout(() => {
      onSuccess?.();
      onClose();
      setStep("method");
      setCard({ number: "", expiry: "", cvv: "", name: "" });
    }, 2000);
  };

  const reset = () => {
    setStep("method");
    setCard({ number: "", expiry: "", cvv: "", name: "" });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {step === "done" ? "Payment Successful!" : `Pay for ${item?.name}`}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "method" && (
            <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <div className="text-lg font-bold text-primary">{item?.price}</div>
                {item?.amount && <div className="text-sm text-green-500">≈ ${ngnToUsd(item.amount)} USD</div>}
                <div className="text-sm text-muted-foreground">{item?.name}{item?.subtitle ? ` · ${item.subtitle}` : ""}</div>
              </div>
              <p className="text-sm font-medium">Choose payment method:</p>
              <div className="space-y-2">
                {METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${method === m.id ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <div>
                      <div className="font-medium text-sm">{m.label}</div>
                      <div className="text-xs text-muted-foreground">{m.desc}</div>
                    </div>
                    {method === m.id && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
              <Button className="w-full" onClick={() => setStep("details")}>Continue</Button>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-lg">{METHODS.find(m => m.id === method)?.emoji}</span>
                Paying via {METHODS.find(m => m.id === method)?.label}
                {item?.amount && <span className="ml-auto font-semibold text-foreground">{method === "stripe" ? `$${ngnToUsd(item.amount)}` : item?.price}</span>}
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Cardholder Name</Label>
                  <Input placeholder="John Doe" value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Card Number</Label>
                  <Input placeholder="4242 4242 4242 4242" value={card.number} onChange={e => setCard({ ...card, number: e.target.value })} maxLength={19} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Expiry</Label>
                    <Input placeholder="MM/YY" value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value })} maxLength={5} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CVV</Label>
                    <Input placeholder="123" value={card.cvv} onChange={e => setCard({ ...card, cvv: e.target.value })} maxLength={4} type="password" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("method")}>Back</Button>
                <Button className="flex-1" onClick={handlePay} disabled={!card.name || !card.number || !card.expiry || !card.cvv}>
                   Pay {method === "stripe" && item?.amount ? `$${ngnToUsd(item.amount)}` : item?.price}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">🔒 Secured by {method === "paystack" ? "Paystack" : "Stripe"}. Your card details are encrypted.</p>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="text-center">
                <p className="font-semibold">Processing payment…</p>
                <p className="text-sm text-muted-foreground mt-1">Please don't close this window</p>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-green-600">Payment Successful!</p>
                <p className="text-sm text-muted-foreground mt-1">{item?.successMessage || `${item?.name} confirmed. Welcome to Xedruo!`}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}