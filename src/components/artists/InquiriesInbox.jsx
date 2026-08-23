import React, { useEffect, useState, useCallback } from "react";
import {
  Calendar, Mic, Users, PenTool, Megaphone, Mic2, Video, MessageSquare,
  Check, X, Mail, Phone, MapPin, Inbox, Loader2
} from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const TYPE_META = {
  live_performance: { label: "Live Performance", icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10" },
  feature: { label: "Feature Verse", icon: Mic, color: "text-purple-400", bg: "bg-purple-500/10" },
  collaboration: { label: "Collaboration", icon: Users, color: "text-green-400", bg: "bg-green-500/10" },
  songwriting: { label: "Songwriting", icon: PenTool, color: "text-amber-400", bg: "bg-amber-500/10" },
  brand_ambassador: { label: "Brand Ambassador", icon: Megaphone, color: "text-pink-400", bg: "bg-pink-500/10" },
  event_appearance: { label: "Event Appearance", icon: Calendar, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  studio_session: { label: "Studio Session", icon: Mic2, color: "text-orange-400", bg: "bg-orange-500/10" },
  voice_over: { label: "Voice Over", icon: Video, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  message: { label: "Message", icon: MessageSquare, color: "text-slate-400", bg: "bg-slate-500/10" },
};

const STATUS_META = {
  pending: { label: "Pending", color: "bg-amber-500/15 text-amber-400" },
  accepted: { label: "Accepted", color: "bg-green-500/15 text-green-400" },
  declined: { label: "Declined", color: "bg-red-500/15 text-red-400" },
  completed: { label: "Completed", color: "bg-blue-500/15 text-blue-400" },
};

export default function InquiriesInbox({ artist }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await xedruo.entities.ArtistBooking.filter({ artist_id: artist.id }, "-created_date", 100).catch(() => []);
    setBookings(data);
    setLoading(false);
  }, [artist.id]);

  useEffect(() => {
    load();
    const unsub = xedruo.entities.ArtistBooking.subscribe(load);
    return unsub;
  }, [load]);

  const act = async (id, status, label) => {
    setBusy(id);
    await xedruo.entities.ArtistBooking.update(id, { status });
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    toast({ title: `Inquiry ${label.toLowerCase()}`, description: `The requester will be notified.` });
    setBusy(null);
  };

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);
  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    accepted: bookings.filter(b => b.status === "accepted").length,
    declined: bookings.filter(b => b.status === "declined").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "pending", "accepted", "declined", "completed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            {f} <span className="ml-1 opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center flex flex-col items-center gap-3">
          <Inbox className="w-10 h-10 text-muted-foreground" />
          <p className="font-medium">No inquiries yet.</p>
          <p className="text-sm text-muted-foreground">Booking and collaboration requests from your public profile will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => {
            const meta = TYPE_META[b.booking_type] || TYPE_META.message;
            const Icon = meta.icon;
            const sm = STATUS_META[b.status] || STATUS_META.pending;
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${meta.bg} grid place-items-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <span className="font-semibold text-sm">{meta.label}</span>
                        <span className="text-muted-foreground text-sm"> · from {b.requester_name}</span>
                      </div>
                      <Badge className={`${sm.color} border-0`}>{sm.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{b.requester_email}</span>
                      {b.requester_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.requester_phone}</span>}
                      {b.event_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.event_date}</span>}
                      {b.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.venue}</span>}
                      {b.budget > 0 && <span className="text-green-400 font-medium">₦{Number(b.budget).toLocaleString()}</span>}
                    </div>
                    {b.message && <p className="text-sm mt-2 text-muted-foreground bg-muted/40 rounded-lg p-3">{b.message}</p>}
                    {b.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="gap-1.5 h-8" onClick={() => act(b.id, "accepted", "Accepted")} disabled={busy === b.id}>
                          {busy === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}Accept
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => act(b.id, "declined", "Declined")} disabled={busy === b.id}>
                          <X className="w-3.5 h-3.5" />Decline
                        </Button>
                      </div>
                    )}
                    {b.status === "accepted" && (
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 mt-3" onClick={() => act(b.id, "completed", "Completed")} disabled={busy === b.id}>
                        <Check className="w-3.5 h-3.5" />Mark Completed
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}