import React, { useEffect, useState, useCallback } from "react";
import { CalendarPlus, Trash2, Clock, Calendar, Loader2, CircleDot, CheckCircle2, XCircle } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

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

const STATUS_META = {
  open: { label: "Open", color: "bg-green-500/15 text-green-400", icon: CircleDot },
  booked: { label: "Booked", color: "bg-blue-500/15 text-blue-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-500/15 text-red-400", icon: XCircle },
};

export default function AvailabilityManager({ artist }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: "", start_time: "", end_time: "", title: "", booking_type: "any", notes: "" });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await xedruo.entities.AvailabilitySlot.filter({ artist_id: artist.id }, "date", 100).catch(() => []);
    setSlots(data);
    setLoading(false);
  }, [artist.id]);

  useEffect(() => {
    load();
    const unsub = xedruo.entities.AvailabilitySlot.subscribe(load);
    return unsub;
  }, [load]);

  const addSlot = async () => {
    if (!form.date || !form.start_time) { toast({ title: "Date and start time required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await xedruo.entities.AvailabilitySlot.create({
        artist_id: artist.id,
        artist_name: artist.name,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time || form.start_time,
        title: form.title,
        booking_type: form.booking_type,
        notes: form.notes,
        status: "open",
      });
      toast({ title: "Slot added", description: "Your available slot is now live on your profile." });
      setForm({ date: "", start_time: "", end_time: "", title: "", booking_type: "any", notes: "" });
    } catch {
      toast({ title: "Could not add slot", variant: "destructive" });
    }
    setSaving(false);
  };

  const removeSlot = async (id) => {
    setBusy(id);
    await xedruo.entities.AvailabilitySlot.delete(id);
    setSlots(prev => prev.filter(s => s.id !== id));
    setBusy(null);
  };

  const cancelSlot = async (id) => {
    setBusy(id);
    const updated = await xedruo.entities.AvailabilitySlot.update(id, { status: "cancelled" });
    setSlots(prev => prev.map(s => s.id === id ? updated : s));
    setBusy(null);
  };

  const reopenSlot = async (id) => {
    setBusy(id);
    const updated = await xedruo.entities.AvailabilitySlot.update(id, { status: "open", booked_by_booking_id: "", booked_by_name: "" });
    setSlots(prev => prev.map(s => s.id === id ? updated : s));
    setBusy(null);
  };

  const upcoming = slots.filter(s => s.status !== "cancelled").sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));

  return (
    <div className="space-y-5">
      {/* Add slot form */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarPlus className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Add Available Slot</h4>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Date *</Label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Start Time *</Label>
            <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">End Time</Label>
            <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Session Type</Label>
            <select value={form.booking_type} onChange={e => setForm({ ...form, booking_type: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k} className="bg-card">{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Title / Label</Label>
            <Input placeholder="e.g. Studio session open, Available for bookings" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Location, rate, special instructions…" />
          </div>
        </div>
        <Button className="mt-4 gap-2" onClick={addSlot} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
          Add Slot
        </Button>
      </div>

      {/* Slot list */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : upcoming.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center flex flex-col items-center gap-3">
          <Calendar className="w-10 h-10 text-muted-foreground" />
          <p className="font-medium">No available slots yet.</p>
          <p className="text-sm text-muted-foreground">Add a slot above and it will appear on your public profile for booking.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {upcoming.map(s => {
            const sm = STATUS_META[s.status] || STATUS_META.open;
            const SIcon = sm.icon;
            return (
              <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{s.title || TYPE_LABELS[s.booking_type] || "Available Slot"}</div>
                      <div className="text-xs text-muted-foreground">{s.date} · {s.start_time}{s.end_time && s.end_time !== s.start_time ? ` – ${s.end_time}` : ""}</div>
                    </div>
                  </div>
                  <Badge className={`${sm.color} border-0 gap-1`}><SIcon className="w-3 h-3" />{sm.label}</Badge>
                </div>
                {s.notes && <p className="text-xs text-muted-foreground mt-2 bg-muted/40 rounded-lg p-2">{s.notes}</p>}
                {s.status === "booked" && s.booked_by_name && (
                  <p className="text-xs text-blue-400 mt-2">Booked by {s.booked_by_name}</p>
                )}
                <div className="flex gap-2 mt-3">
                  {s.status === "open" && (
                    <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => cancelSlot(s.id)} disabled={busy === s.id}>
                      {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}Cancel
                    </Button>
                  )}
                  {s.status === "booked" && (
                    <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => reopenSlot(s.id)} disabled={busy === s.id}>
                      <CircleDot className="w-3.5 h-3.5" />Reopen
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-red-400 hover:text-red-500" onClick={() => removeSlot(s.id)} disabled={busy === s.id}>
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}