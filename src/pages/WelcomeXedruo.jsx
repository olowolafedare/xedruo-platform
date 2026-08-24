import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ensureXedruoId, saveCustomerContact } from "@/lib/xedruoIdentity";
import { Download, ArrowRight, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function WelcomeXedruo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [xedruoId, setXedruoId] = useState(null);
  const [created, setCreated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    ensureXedruoId()
      .then(({ xedruoId, created }) => {
        setXedruoId(xedruoId);
        setCreated(created);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyId = () => {
    navigator.clipboard?.writeText(xedruoId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background text-foreground flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center font-display font-bold text-2xl text-primary-foreground mx-auto mb-4">
              X
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Registration successful
            </div>
            <h1 className="text-3xl font-display font-bold">Welcome to Xedruo</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {created
                ? "Your Xedruo account has been created automatically."
                : "Your existing Xedruo identity has been connected."}
            </p>
          </div>

          {/* Xedruo ID card */}
          <div className="rounded-2xl p-6 bg-gradient-to-br from-primary/15 to-card border border-primary/30 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Your Xedruo ID / Bank Account Number</div>
            <div className="font-mono text-3xl font-bold tracking-wider mb-1">{xedruoId}</div>
            <div className="text-xs text-muted-foreground">
              This 10-digit number is both your Xedruo ID and your Xedruo Bank Account Number.
            </div>
            <button
              onClick={copyId}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy ID"}
            </button>
          </div>

          {/* Download / Open Pay & Play */}
          <div className="mt-6 rounded-2xl p-5 bg-card border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl">💳</div>
              <div>
                <div className="font-semibold text-sm">Xedruo Pay/Bank</div>
                <div className="text-xs text-muted-foreground">Bank, payments & Pay & Play</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Download the app or open it in your browser to access your account.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950">
                <Download className="w-4 h-4 mr-1.5" /> Download
              </Button>
              <Link to="/company/pay-bank">
                <Button variant="outline" className="w-full">
                  Open <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2 text-center">
              Download links will connect to the mobile app stores once published.
            </div>
          </div>

          <Link to="/dashboard" className="block mt-6">
            <Button variant="ghost" className="w-full">
              Explore the Xedruo ecosystem <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}