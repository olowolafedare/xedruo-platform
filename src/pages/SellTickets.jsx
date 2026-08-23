import React, { useEffect, useState } from "react";
import { Ticket, Plus, Users, TrendingUp, Calendar, MapPin, Loader2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import EventForm from "@/components/tickets/EventForm";
import TicketPurchaseFlow from "@/components/tickets/TicketPurchaseFlow";
import MyTickets from "@/components/tickets/MyTickets";
import { money } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

const statusColor = {
  draft: "bg-muted text-muted-foreground",
  on_sale: "bg-green-500/15 text-green-600",
  sold_out: "bg-red-500/15 text-red-600",
  cancelled: "bg-red-500/15 text-red-600",
  completed: "bg-blue-500/15 text-blue-600",
};

function SellTicketsContent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("events");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await xedruo.entities.Event.list("-created_date", 50).catch(() => []);
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = xedruo.entities.Event.subscribe((ev) => {
      if (ev.type === "create") {
        setEvents(prev => [ev.data, ...prev]);
        toast({ title: "🎉 Event created!", description: "Your event is now live." });
      } else if (ev.type === "update") {
        setEvents(prev => prev.map(e => e.id === ev.data.id ? ev.data : e));
      }
    });
    return unsub;
  }, []);

  const totalRevenue = events.reduce((a, e) => a + (e.revenue || 0), 0);
  const totalSold = events.reduce((a, e) => a + (e.tickets_sold || 0), 0);
  const activeEvents = events.filter(e => e.status === "on_sale").length;

  return (
    <div>
      <PageHeader
        title="Sell Tickets"
        subtitle="Create events, sell tickets, and manage attendees."
        action={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Event
          </Button>
        }
      />

      <div className="grid gap-5 sm:grid-cols-3 mb-6">
        <StatCard icon={TrendingUp} label="Total Revenue" value={money(totalRevenue)} />
        <StatCard icon={Ticket} label="Tickets Sold" value={String(totalSold)} />
        <StatCard icon={Calendar} label="Active Events" value={String(activeEvents)} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="events">My Events</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : events.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-border bg-card p-14 text-center flex flex-col items-center gap-3">
              <Ticket className="w-10 h-10 text-muted-foreground" />
              <p className="font-medium">No events yet</p>
              <p className="text-sm text-muted-foreground">Create your first event to start selling tickets.</p>
              <Button onClick={() => setCreateOpen(true)}>Create Event</Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {events.map((event, i) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow">
                  <div className="p-4 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 grid place-items-center text-primary font-bold text-lg shrink-0">
                      🎤
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold truncate">{event.title}</div>
                        <Badge className={`border-0 capitalize text-xs shrink-0 ${statusColor[event.status]}`}>
                          {event.status?.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">{event.artist}</div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {event.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>}
                        {event.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>}
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.tickets_sold || 0} / {event.total_tickets} sold</span>
                        {!event.is_free && <span className="text-primary font-medium">Rev: {money(event.revenue || 0)}</span>}
                        {event.is_free && <Badge variant="secondary" className="text-xs">Free Event</Badge>}
                      </div>
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, ((event.tickets_sold || 0) / (event.total_tickets || 1)) * 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border px-4 py-2 flex gap-2 bg-muted/30">
                    <Button size="sm" variant="outline" onClick={() => setSelectedEvent(event)}>
                      <Ticket className="w-3.5 h-3.5 mr-1.5" /> Buy / RSVP
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-tickets">
          <MyTickets />
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {createOpen && (
          <EventForm onClose={() => setCreateOpen(false)} onCreated={load} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEvent && (
          <TicketPurchaseFlow
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onSuccess={(updated) => {
              setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
              setSelectedEvent(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SellTickets() {
  return (
    <div>
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>To create and sell tickets, you need at least one song or beat uploaded first. <a href="/distribution" className="underline font-medium">Upload music →</a></span>
      </div>
      <SellTicketsContent />
    </div>
  );
}