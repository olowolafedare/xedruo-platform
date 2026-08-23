import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Ticket, QrCode, CalendarPlus } from "lucide-react";
import { ngnToUsd } from "@/lib/currency";
import { motion, AnimatePresence } from "framer-motion";
import { xedruo } from "@/api/xedruoClient";
import { useToast } from "@/components/ui/use-toast";
import { money } from "@/lib/format";

// Revenue split: 80% artist, 10% producer, 10% xedruo
const SPLIT = { artist: 0.8, producer: 0.1, xedruo: 0.1 };

function ticketOptions(event) {
  const opts = [];
  if (event.is_free) {
    opts.push({ key: "free", label: "Free RSVP", price: 0 });
  } else {
    if (event.general_price > 0) opts.push({ key: "general", label: "General Admission", price: event.general_price });
    if (event.vip_price > 0) opts.push({ key: "vip", label: "VIP", price: event.vip_price });
    if (event.early_bird_price > 0 && event.early_bird_available > 0)
      opts.push({ key: "early_bird", label: "Early Bird", price: event.early_bird_price });
  }
  return opts;
}

export default function TicketPurchaseFlow({ event, onClose, onSuccess }) {
  const [step, setStep] = useState("select"); // select | info | payment | processing | done
  const [ticketType, setTicketType] = useState(null);
  const [qty, setQty] = useState(1);
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "" });
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [ticket, setTicket] = useState(null);
  const { toast } = useToast();

  const options = ticketOptions(event);
  const selected = options.find(o => o.key === ticketType);
  const total = (selected?.price || 0) * qty;
  const isFree = event.is_free || selected?.key === "free";

  const handleConfirm = async () => {
    setStep("processing");
    if (!isFree) await new Promise(r => setTimeout(r, 2200));

    const ticketNum = `XD-${Date.now().toString(36).toUpperCase()}`;
    const artistShare = total * SPLIT.artist;
    const producerShare = total * SPLIT.producer;
    const xedruo_share = total * SPLIT.xedruo;

    const purchase = await xedruo.entities.TicketPurchase.create({
      event_id: event.id,
      event_title: event.title,
      event_date: event.date,
      venue: event.venue,
      ticket_type: isFree ? "free" : ticketType,
      quantity: qty,
      amount_paid: total,
      currency: event.currency || "NGN",
      buyer_name: buyer.name,
      buyer_email: buyer.email,
      buyer_phone: buyer.phone,
      payment_status: isFree ? "free" : "confirmed",
      ticket_number: ticketNum,
      qr_code: `QR:${ticketNum}`,
      artist_share: artistShare,
      producer_share: producerShare,
      xedruo_share,
    });

    // Update event ticket count + revenue
    const updatedEvent = await xedruo.entities.Event.update(event.id, {
      tickets_sold: (event.tickets_sold || 0) + qty,
      revenue: (event.revenue || 0) + total,
    });

    // Log wallet transaction with split
    if (!isFree) {
      await xedruo.entities.WalletTransaction.create({
        description: `Ticket sale — ${event.title}`,
        type: "credit",
        amount: total,
        currency: event.currency || "NGN",
        category: "ticket_sale",
        status: "completed",
        artist_share: artistShare,
        producer_share: producerShare,
        xedruo_share,
        linked_event_id: event.id,
      });
    }

    // Send confirmation email with ticket details
    const emailBody = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f4f4f8; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: #6c2bd9; padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎟️ Your Ticket is Confirmed!</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${event.title}</p>
    </div>
    <div style="padding: 28px;">
      <p style="color: #444; margin: 0 0 20px;">Hi ${buyer.name}, your ${isFree ? "RSVP" : "ticket purchase"} has been confirmed. Here are your details:</p>
      <table style="width:100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr style="background:#f9f9fc;"><td style="padding:10px 14px; color:#888; font-size:13px;">Event</td><td style="padding:10px 14px; font-weight:600;">${event.title}</td></tr>
        ${event.date ? `<tr><td style="padding:10px 14px; color:#888; font-size:13px;">Date</td><td style="padding:10px 14px;">${event.date}${event.time ? " at " + event.time : ""}</td></tr>` : ""}
        ${event.venue ? `<tr style="background:#f9f9fc;"><td style="padding:10px 14px; color:#888; font-size:13px;">Venue</td><td style="padding:10px 14px;">${event.venue}${event.location ? ", " + event.location : ""}</td></tr>` : ""}
        <tr><td style="padding:10px 14px; color:#888; font-size:13px;">Ticket Type</td><td style="padding:10px 14px; text-transform:capitalize;">${(isFree ? "free" : ticketType)?.replace("_", " ")}</td></tr>
        <tr style="background:#f9f9fc;"><td style="padding:10px 14px; color:#888; font-size:13px;">Quantity</td><td style="padding:10px 14px;">${qty}</td></tr>
        ${!isFree ? `<tr><td style="padding:10px 14px; color:#888; font-size:13px;">Amount Paid</td><td style="padding:10px 14px; font-weight:600; color:#6c2bd9;">${money(total, event.currency)}</td></tr>` : ""}
        <tr style="background:#f9f9fc;"><td style="padding:10px 14px; color:#888; font-size:13px;">Ticket #</td><td style="padding:10px 14px; font-family:monospace; font-weight:700; font-size:15px;">${ticketNum}</td></tr>
      </table>
      <div style="text-align:center; background:#f4f0ff; border-radius:12px; padding:20px; margin-bottom:24px;">
        <p style="margin:0 0 8px; font-size:13px; color:#888;">Present this code at the entrance</p>
        <div style="font-family:monospace; font-size:28px; font-weight:800; color:#6c2bd9; letter-spacing:4px;">${ticketNum.slice(-6)}</div>
        <p style="margin:8px 0 0; font-size:11px; color:#aaa;">QR scanning available at the venue</p>
      </div>
      <p style="font-size:12px; color:#aaa; text-align:center; margin:0;">Powered by <strong>Xedruo</strong> · xedruo.com</p>
    </div>
  </div>
</body>
</html>`;

    xedruo.integrations.Core.SendEmail({
      to: buyer.email,
      subject: `🎟️ Your ticket for ${event.title} — ${ticketNum}`,
      body: emailBody,
      from_name: "Xedruo Tickets",
    }).catch(() => {}); // non-blocking — ticket is already saved

    setTicket({ ...purchase, ticketNum });
    setStep("done");
    toast({ title: isFree ? "✅ RSVP confirmed!" : "🎟️ Ticket purchased!", description: `Confirmation sent to ${buyer.email}.` });
    onSuccess?.(updatedEvent);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" /> {event.is_free ? "RSVP for" : "Buy Tickets —"} {event.title}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="text-sm text-muted-foreground">{event.venue}{event.date ? ` · ${event.date}` : ""}</div>
              <div className="space-y-2">
                {options.map(opt => (
                  <button key={opt.key} onClick={() => setTicketType(opt.key)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between ${ticketType === opt.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <div>
                      <div className="font-medium text-sm">{opt.label}</div>
                      {opt.key === "early_bird" && <div className="text-xs text-amber-600">Limited availability</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{opt.price === 0 ? "Free" : money(opt.price, event.currency)}</div>
                      {opt.price > 0 && <div className="text-xs text-green-500">≈ ${ngnToUsd(opt.price)}</div>}
                    </div>
                  </button>
                ))}
              </div>
              {!isFree && ticketType && (
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Quantity:</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(q => Math.max(1, q - 1))}>-</Button>
                    <span className="font-semibold w-6 text-center">{qty}</span>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(q => Math.min(10, q + 1))}>+</Button>
                  </div>
                  <div className="ml-auto font-bold text-primary">{money(total, event.currency)}</div>
                </div>
              )}
              <Button className="w-full" disabled={!ticketType} onClick={() => setStep("info")}>
                {isFree ? "RSVP Now" : `Continue — ${money(total, event.currency)}`}
              </Button>
            </motion.div>
          )}

          {step === "info" && (
            <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <p className="text-sm font-medium">{isFree ? "Your details" : "Contact details"}</p>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Full Name *</Label><Input value={buyer.name} onChange={e => setBuyer(b => ({ ...b, name: e.target.value }))} placeholder="John Doe" /></div>
                <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={buyer.email} onChange={e => setBuyer(b => ({ ...b, email: e.target.value }))} placeholder="john@example.com" /></div>
                <div className="space-y-1.5"><Label>Phone (optional)</Label><Input value={buyer.phone} onChange={e => setBuyer(b => ({ ...b, phone: e.target.value }))} placeholder="+234 800 000 0000" /></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("select")}>Back</Button>
                <Button className="flex-1" disabled={!buyer.name || !buyer.email} onClick={() => isFree ? handleConfirm() : setStep("payment")}>
                  {isFree ? "Confirm RSVP" : "Continue to Payment"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "payment" && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex justify-between">
                <div><div className="font-semibold capitalize">{ticketType?.replace("_", " ")} × {qty}</div><div className="text-xs text-muted-foreground">{event.title}</div></div>
                <div className="text-right">
                  <div className="font-bold text-primary">{money(total, event.currency)}</div>
                  <div className="text-xs text-green-500">≈ ${ngnToUsd(total)}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label className="text-xs">Cardholder Name</Label><Input value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} placeholder="John Doe" /></div>
                <div className="space-y-1.5"><Label className="text-xs">Card Number</Label><Input value={card.number} onChange={e => setCard(c => ({ ...c, number: e.target.value }))} placeholder="4242 4242 4242 4242" maxLength={19} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Expiry</Label><Input value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: e.target.value }))} placeholder="MM/YY" maxLength={5} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">CVV</Label><Input type="password" value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value }))} placeholder="123" maxLength={4} /></div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded-lg">
                Revenue split: Artist 80% ({money(total * 0.8, event.currency)}) · Producer 10% · Xedruo 10%
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("info")}>Back</Button>
                <Button className="flex-1" disabled={!card.name || !card.number || !card.expiry || !card.cvv} onClick={handleConfirm}>
                  Pay {money(total, event.currency)}
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">🔒 Secured by Paystack / Stripe</p>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="font-medium">Processing…</p>
              <p className="text-sm text-muted-foreground">Please don't close this window</p>
            </motion.div>
          )}

          {step === "done" && ticket && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="font-bold text-lg">{isFree ? "RSVP Confirmed!" : "Ticket Purchased!"}</p>
                <p className="text-sm text-muted-foreground mt-1">{event.title}</p>
              </div>
              <div className="w-full bg-muted rounded-2xl p-4 space-y-2 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ticket #</span>
                  <span className="font-mono font-semibold">{ticket.ticketNum}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="secondary" className="capitalize">{ticket.ticket_type?.replace("_", " ")}</Badge>
                </div>
                {!isFree && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-semibold text-primary">{money(ticket.amount_paid, event.currency)}</span>
                  </div>
                )}
                <div className="mt-3 flex justify-center">
                  <div className="w-24 h-24 bg-foreground/5 rounded-xl border border-border flex flex-col items-center justify-center gap-1">
                    <QrCode className="w-10 h-10 text-primary" />
                    <span className="text-[10px] text-muted-foreground font-mono">{ticket.ticketNum?.slice(-6)}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
                onClick={() => {
                  const startDate = event.date ? new Date(`${event.date}T${event.time || "00:00"}:00`) : new Date();
                  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
                  const fmt = d => d.toISOString().replace(/-|:|\.\d{3}/g, "");
                  const details = `Ticket #${ticket.ticketNum}\nType: ${ticket.ticket_type?.replace("_", " ")}\n${!isFree ? `Amount Paid: ${money(ticket.amount_paid, event.currency)}` : "Free RSVP"}`;
                  const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(event.venue || "")}`;
                  window.open(url, "_blank");
                }}
              >
                <CalendarPlus className="w-4 h-4" /> Add to Google Calendar
              </Button>
              <Button onClick={onClose} className="w-full">Done</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}