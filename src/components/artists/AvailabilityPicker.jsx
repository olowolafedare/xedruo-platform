import React, { useEffect, useState, useCallback } from "react";
import { Clock, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SlotBookingDialog from "@/components/artists/SlotBookingDialog";

const TYPE_LABELS = {
  any: "Any Session",
  live_performance: "Live Performance",
  feature: "Feature Verse",
  collaboration: "Collaboration",
  songwriting: "Songwriting",
  studio_session: "Studio Session",
  voice_over: "Voice Over",
  event_appearance: "Event Appearance",
  brand_ambassador: "Brand Ambassador",
};

export default function AvailabilityPicker({ artist }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await xedruo.entities.AvailabilitySlot.filter({ artist_id: artist.id, status: "open" }, "date", 50).catch(() => []);
    setSlots(data);
    setLoading(false);
  }, [artist.id]);

  useEffect(() => {
    load();
    const unsub = xedruo.entities.AvailabilitySlot.subscribe(load);
    return unsub;
  }, [load]);

  const open = slots.filter(s => s.status === "open" && (!s.date || new Date(s.date + "T00:00") >= new Date(new Date().toDateString())))
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Available Booking Slots</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Pick an open slot to request a booking with {artist.name}. Updates in real time.</p>

      {open.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground flex flex-col items-center gap-2">
          <Clock className="w-8 h-8 opacity-50" />
          <p>No open slots right now. Check back soon or request a custom booking below.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {open.map(s => (
            <div key={s.id} className="rounded-xl border border-border bg-muted/30 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{s.date}</span>
                <Badge className="bg-green-500/15 text-green-400 border-0 gap-1"><CheckCircle2 className="w-3 h-3" />Open</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />{s.start_time}{s.end_time && s.end_time !== s.start_time ? ` – ${s.end_time}` : ""}
              </div>
              {(s.title || s.booking_type !== "any") && (
                <div className="text-xs text-primary">{s.title || TYPE_LABELS[s.booking_type]}</div>
              )}
              {s.notes && <p className="text-xs text-muted-foreground line-clamp-2">{s.notes}</p>}
              <Button size="sm" className="mt-1" onClick={() => setBookingSlot(s)}>Book This Slot</Button>
            </div>
          ))}
        </div>
      )}

      {bookingSlot && (
        <SlotBookingDialog artist={artist} slot={bookingSlot} open={!!bookingSlot} onClose={() => setBookingSlot(null)} />
      )}
    </div>
  );
}