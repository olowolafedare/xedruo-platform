import React from "react";
import { QrCode, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function ReceiveTab() {
  const { toast } = useToast();
  const account = { bank: "Xedruo Microfinance Bank", number: "8104429583", name: "Ada Obi" };
  const copy = (text) => { navigator.clipboard.writeText(text); toast({ title: "Copied to clipboard!" }); };

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Your Virtual Account</h3>
        <div className="bg-primary/5 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Bank</p>
            <p className="font-semibold">{account.bank}</p>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Account Number</p>
              <p className="text-2xl font-bold tracking-widest font-mono">{account.number}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => copy(account.number)}><Copy className="w-4 h-4 mr-1" />Copy</Button>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Account Name</p>
            <p className="font-medium">{account.name}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Send money to this account from any Nigerian bank. Funds arrive instantly.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4">
        <h3 className="font-semibold">QR Code Payment</h3>
        <div className="w-44 h-44 mx-auto rounded-2xl bg-muted grid place-items-center border-2 border-dashed border-border">
          <QrCode className="w-28 h-28 text-primary/60" />
        </div>
        <p className="text-sm text-muted-foreground">Share this QR code to receive instant payments from any wallet or app</p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">Share</Button>
          <Button className="flex-1">Download QR</Button>
        </div>
      </div>
    </div>
  );
}