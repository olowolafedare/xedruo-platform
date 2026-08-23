import React, { useState } from "react";
import { Loader2, Send, CheckCircle2, Bell } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const TYPE_LABELS = {
  live_performance: "Live Performance",
  feature: "Feature Verse",
  collaboration: "Collaboration",
  songwriting: "Songwriting",
  brand_ambassador: "Brand Ambassador",
  event_appearance: "Event Appearance",
  studio_session: "Studio Session",
  voice_over: "Voice Over",
  message: "Message Artist",
};

export default function BookingDialog({ artist, type, open, onClose }) {
  const [form, setForm] = useState({ requester_name: "", requester_email: "", requester_phone: "", event_date: "", venue: "", budget: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const isMessage = type === "message";

  const submit = async () => {
    if (!form.requester_name || !form.requester_email) return;
    setSaving(true);
    try {
      await xedruo.entities.ArtistBooking.create({
        artist_id: artist.id,
        artist_name: artist.name,
        booking_type: type,
        requester_name: form.requester_name,
        requester_email: form.requester_email,
        requester_phone: form.requester_phone,
        event_date: isMessage ? undefined : form.event_date,
        venue: isMessage ? undefined : form.venue,
        budget: Number(form.budget) || 0,
        message: form.message,
        status: "pending",
      });
      setSent(true);
      toast({ title: "Request sent!", description: `${artist.name}'s team will reach out soon.` });
      setForm({ requester_name: "", requester_email: "", requester_phone: "", event_date: "", venue: "", budget: "", message: "" });
    } catch {
      toast({ title: "Could not send request", variant: "destructive" });
    }
    setSaving(false);
  };

  const close = () => { setSent(false); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-lg">
        {sent ? (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/15 grid place-items-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Request Delivered</h3>
              <p className="text-sm text-muted-foreground mt-1">Your {isMessage ? "message" : TYPE_LABELS[type]?.toLowerCase() || "request"} has been sent directly to <span className="text-primary font-medium">{artist.name}</span>'s dashboard.</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2 w-full">
              <Bell className="w-4 h-4 text-primary shrink-0" />
              The artist will see your inquiry in their Inquiries inbox and can accept, decline, or reply.
            </div>
            <Button onClick={close} className="w-full">Done</Button>
          </div>
        ) : (
        <>
        <DialogHeader>
          <DialogTitle>{isMessage ? `Message ${artist.name}` : `Request ${TYPE_LABELS[type]}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Your Name *</Label><Input value={form.requester_name} onChange={e => setForm({ ...form, requester_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.requester_email} onChange={e => setForm({ ...form, requester_email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.requester_phone} onChange={e => setForm({ ...form, requester_phone: e.target.value })} /></div>
            {!isMessage && (
              <>
                <div className="space-y-1.5"><Label>Event Date</Label><Input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Venue / Location</Label><Input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Budget (₦)</Label><Input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} /></div>
              </>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>{isMessage ? "Message" : "Details"}</Label>
            <Textarea rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={isMessage ? "Write your message…" : "Tell the artist about your event or project…"} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving || !form.requester_name || !form.requester_email} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isMessage ? "Send Message" : "Send Request"}
          </Button>
        </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}