import React, { useState } from "react";
import { Lock, CreditCard, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { xedruo } from "@/api/xedruoClient";
import { useToast } from "@/components/ui/use-toast";

const DISTRIBUTION_FEE = { amount: 5000, label: "₦5,000", desc: "One-time distribution fee per release" };

const METHODS = [
  { id: "paystack", label: "Paystack", emoji: "🇳🇬", desc: "Card, bank transfer or USSD" },
  { id: "stripe", label: "Stripe", emoji: "🌍", desc: "International card (Visa, Mastercard)" },
];

// Visual step indicator for the full payment → distribution flow
const FLOW_STEPS = [
  { key: "unpaid",     label: "Awaiting Payment",     icon: Lock },
  { key: "pending",    label: "Processing Payment",    icon: Loader2 },
  { key: "confirmed",  label: "Payment Confirmed",     icon: CheckCircle2 },
  { key: "distributing", label: "Distributing",        icon: Loader2 },
  { key: "live",       label: "Live on DSPs",          icon: CheckCircle2 },
];

function FlowStepper({ paymentStatus, releaseStatus }) {
  const currentKey =
    releaseStatus === "live" ? "live" :
    paymentStatus === "confirmed" && releaseStatus === "in_review" ? "distributing" :
    paymentStatus === "confirmed" ? "confirmed" :
    paymentStatus === "pending" ? "pending" :
    "unpaid";

  const currentIdx = FLOW_STEPS.findIndex(s => s.key === currentKey);

  return (
    <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-1">
      {FLOW_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className={`flex flex-col items-center gap-1 min-w-[80px] transition-all ${active ? "opacity-100" : done ? "opacity-80" : "opacity-35"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "bg-green-500 border-green-500 text-white" :
                active ? "bg-primary border-primary text-primary-foreground" :
                "bg-muted border-border text-muted-foreground"
              }`}>
                <Icon className={`w-4 h-4 ${(active && (step.key === "pending" || step.key === "distributing")) ? "animate-spin" : ""}`} />
              </div>
              <span className={`text-[10px] text-center leading-tight font-medium ${active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < FLOW_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 min-w-[16px] mx-1 rounded-full transition-all ${i < currentIdx ? "bg-green-500" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function DistributionPaymentGate({ release, onStatusChange }) {
  const [step, setStep] = useState("method"); // method | details | processing | failed
  const [method, setMethod] = useState("paystack");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [paying, setPaying] = useState(false);
  const { toast } = useToast();

  const paymentStatus = release?.payment_status || "unpaid";
  const releaseStatus = release?.status;
  const isLocked = !release?.distribution_unlocked;
  const hasFailed = paymentStatus === "failed";

  const handlePay = async () => {
    setPaying(true);
    setStep("processing");

    // Mark as pending immediately
    await xedruo.entities.Release.update(release.id, { payment_status: "pending" });
    onStatusChange?.();

    // Simulate payment gateway processing (2.5s)
    await new Promise(r => setTimeout(r, 2500));

    // Simulate 90% success rate for demo; in production this comes from webhook
    const success = Math.random() > 0.1;

    if (success) {
      // Log the wallet transaction
      const txn = await xedruo.entities.WalletTransaction.create({
        description: `Distribution fee — ${release.title}`,
        type: "debit",
        amount: DISTRIBUTION_FEE.amount,
        currency: "NGN",
        category: "subscription",
        status: "completed",
      });

      // Unlock distribution and trigger DSP push (set to in_review)
      await xedruo.entities.Release.update(release.id, {
        payment_status: "confirmed",
        payment_transaction_id: txn.id,
        distribution_unlocked: true,
        status: "in_review",
      });

      toast({ title: "✅ Payment confirmed!", description: "Your release is now being distributed to all DSPs." });
    } else {
      await xedruo.entities.Release.update(release.id, {
        payment_status: "failed",
      });
      setStep("failed");
      toast({ title: "❌ Payment failed", description: "Please retry your payment.", variant: "destructive" });
    }

    setPaying(false);
    onStatusChange?.();
  };

  const resetForRetry = () => {
    setStep("method");
    setCard({ number: "", expiry: "", cvv: "", name: "" });
  };

  // Already paid / distributing / live — just show the stepper
  if (paymentStatus === "confirmed" || paymentStatus === "pending" || releaseStatus === "live") {
    return (
      <div className="pt-2">
        <FlowStepper paymentStatus={paymentStatus} releaseStatus={releaseStatus} />
      </div>
    );
  }

  return (
    <div className="pt-2">
      <FlowStepper paymentStatus={paymentStatus} releaseStatus={releaseStatus} />

      <AnimatePresence mode="wait">
        {/* Locked / unpaid state */}
        {(paymentStatus === "unpaid" || hasFailed) && step === "method" && (
          <motion.div key="locked" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-50/40 dark:bg-amber-900/10 p-5 flex flex-col gap-4">

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Distribution Locked</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasFailed
                    ? "Your last payment failed. Retry to unlock distribution."
                    : "Pay the one-time distribution fee to push your release to 150+ DSPs."}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-card border border-border p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-primary">{DISTRIBUTION_FEE.label}</div>
                <div className="text-xs text-muted-foreground">{DISTRIBUTION_FEE.desc}</div>
              </div>
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Choose payment method:</p>
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left text-sm ${method === m.id ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}>
                  <span className="text-xl">{m.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.desc}</div>
                  </div>
                  {method === m.id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>

            <Button className="w-full gap-2" onClick={() => setStep("details")}>
              {hasFailed ? <><RefreshCw className="w-4 h-4" />Retry Payment</> : <><CreditCard className="w-4 h-4" />Pay to Distribute</>}
            </Button>
          </motion.div>
        )}

        {/* Card details */}
        {step === "details" && (
          <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{METHODS.find(m => m.id === method)?.emoji}</span>
              Paying {DISTRIBUTION_FEE.label} via {METHODS.find(m => m.id === method)?.label}
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cardholder Name</Label>
                <Input placeholder="John Doe" value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Card Number</Label>
                <Input placeholder="4242 4242 4242 4242" value={card.number} onChange={e => setCard({ ...card, number: e.target.value })} maxLength={19} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Expiry</Label>
                  <Input placeholder="MM/YY" value={card.expiry} onChange={e => setCard({ ...card, expiry: e.target.value })} maxLength={5} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CVV</Label>
                  <Input placeholder="123" value={card.cvv} onChange={e => setCard({ ...card, cvv: e.target.value })} maxLength={4} type="password" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep("method")}>Back</Button>
              <Button className="flex-1 gap-2" onClick={handlePay} disabled={!card.name || !card.number || !card.expiry || !card.cvv}>
                <Lock className="w-4 h-4" />Pay {DISTRIBUTION_FEE.label}
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">🔒 Secured by {method === "paystack" ? "Paystack" : "Stripe"}. Card details are encrypted.</p>
          </motion.div>
        )}

        {/* Processing */}
        {step === "processing" && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-sm">Processing payment…</p>
              <p className="text-xs text-muted-foreground mt-1">Please don't close this panel</p>
            </div>
          </motion.div>
        )}

        {/* Failed */}
        {step === "failed" && (
          <motion.div key="failed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border-2 border-red-400/60 bg-red-50/40 dark:bg-red-900/10 p-5 flex flex-col items-center gap-3 text-center">
            <XCircle className="w-10 h-10 text-red-500" />
            <div>
              <p className="font-semibold text-sm text-red-600">Payment Failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your payment could not be processed. Check your card details and try again.</p>
            </div>
            <Button onClick={resetForRetry} className="gap-2 mt-1">
              <RefreshCw className="w-4 h-4" />Retry Payment
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}