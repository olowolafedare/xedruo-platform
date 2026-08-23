import React, { useEffect, useState } from "react";
import { Ticket, QrCode, Loader2, Calendar, MapPin } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { money } from "@/lib/format";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    xedruo.entities.TicketPurchase.list("-created_date", 50)
      .then(setTickets).finally(() => setLoading(false));
    const unsub = xedruo.entities.TicketPurchase.subscribe(() => {
      xedruo.entities.TicketPurchase.list("-created_date", 50).then(setTickets);
    });
    return unsub;
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (tickets.length === 0) return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-14 text-center flex flex-col items-center gap-3">
      <Ticket className="w-10 h-10 text-muted-foreground" />
      <p className="font-medium">No tickets yet</p>
      <p className="text-sm text-muted-foreground">Browse events and buy or RSVP to see your tickets here.</p>
    </div>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tickets.map((t, i) => (
        <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-sm">{t.event_title}</div>
              {t.event_date && <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" />{t.event_date}</div>}
              {t.venue && <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{t.venue}</div>}
            </div>
            <Badge variant="secondary" className="capitalize text-xs shrink-0">{t.ticket_type?.replace("_", " ")}</Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-muted rounded-xl flex flex-col items-center justify-center border border-border shrink-0">
              <QrCode className="w-8 h-8 text-primary" />
              <span className="text-[9px] font-mono text-muted-foreground mt-0.5">{t.ticket_number?.slice(-6)}</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Ticket #</span>
                <span className="font-mono font-medium">{t.ticket_number}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Qty</span>
                <span className="font-medium">{t.quantity}</span>
              </div>
              {t.amount_paid > 0 && (
                <div className="flex justify-between gap-6">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold text-primary">{money(t.amount_paid, t.currency)}</span>
                </div>
              )}
              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Status</span>
                <Badge className={`border-0 text-[10px] ${t.payment_status === "confirmed" || t.payment_status === "free" ? "bg-green-500/15 text-green-600" : "bg-amber-500/15 text-amber-600"}`}>
                  {t.payment_status === "free" ? "Registered" : t.payment_status}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}