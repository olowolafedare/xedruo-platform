import React, { useState } from "react";
import { Loader2, Send, CheckCircle2, Calendar } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function SlotBookingDialog({ artist, slot, open, onClose }) {
  const [form, setForm] = useState({ requester_name: "", requester_email: "", requester_phone: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!form.requester_name || !form.requester_email) return;
    setSaving(true);
    try {
      const booking = await xedruo.entities.ArtistBooking.create({
        artist_id: artist.id,
        artist_name: artist.name,
        booking_type: slot.booking_type && slot.booking_type !== "any" ? slot.booking_type : "live_performance",
        requester_name: form.requester_name,
        requester_email: form.requester_email,
        requester_phone: form.requester_phone,
        event_date: slot.date,
        venue: slot.title || slot.notes || "",
        message: form.message || `Booking request for slot ${slot.date} at ${slot.start_time}`,
        status: "pending",
      });
      await xedruo.entities.AvailabilitySlot.update(slot.id, {
        status: "booked",
        booked_by_booking_id: booking.id,
        booked_by_name: form.requester_name,
      });
      setSent(true);
      toast({ title: "Slot booked!", description: `${artist.name}'s team will confirm shortly.` });
      setForm({ requester_name: "", requester_email: "", requester_phone: "", message: "" });
    } catch {
      toast({ title: "Could not book slot", variant: "destructive" });
    }
    setSaving(false);
  };

  const close = () => { setSent(false); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        {sent ? (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/15 grid place-items-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Slot Reserved</h3>
              <p className="text-sm text-muted-foreground mt-1">Your booking request for <span className="text-primary font-medium">{slot.date} at {slot.start_time}</span> has been sent to <span className="text-primary font-medium">{artist.name}</span>'s dashboard.</p>
            </div>
            <Button onClick={close} className="w-full">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Book Slot — {slot.date} at {slot.start_time}</DialogTitle>
            </DialogHeader>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {slot.title || "Available session"}{slot.end_time && slot.end_time !== slot.start_time ? ` · ${slot.start_time}–${slot.end_time}` : ""}
            </div>
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Your Name *</Label><Input value={form.requester_name} onChange={e => setForm({ ...form, requester_name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.requester_email} onChange={e => setForm({ ...form, requester_email: e.target.value })} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Phone</Label><Input value={form.requester_phone} onChange={e => setForm({ ...form, requester_phone: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5">
                <Label>Message (optional)</Label>
                <Textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell the artist about your project…" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={saving || !form.requester_name || !form.requester_email} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Request Booking
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}