import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";

export default function EventForm({ onClose, onCreated }) {
  const [form, setForm] = useState({
    currency: "NGN", status: "on_sale", total_tickets: 100,
    is_free: false, general_price: 0, vip_price: 0, early_bird_price: 0, early_bird_available: 0
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: typeof e === "string" ? e : e.target?.type === "number" ? Number(e.target.value) : e.target.value }));

  const save = async () => {
    if (!form.title || !form.artist) return;
    setSaving(true);
    await xedruo.entities.Event.create(form);
    setSaving(false);
    onClose();
    onCreated?.();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>Event Title *</Label><Input value={form.title || ""} onChange={set("title")} placeholder="e.g. Lagos Unplugged Concert" /></div>
            <div className="space-y-1.5"><Label>Artist *</Label><Input value={form.artist || ""} onChange={set("artist")} placeholder="Your stage name" /></div>
            <div className="space-y-1.5"><Label>Venue</Label><Input value={form.venue || ""} onChange={set("venue")} placeholder="e.g. Eko Hotel" /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ""} onChange={set("date")} /></div>
            <div className="space-y-1.5"><Label>Time</Label><Input type="time" value={form.time || ""} onChange={set("time")} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Location / City</Label><Input value={form.location || ""} onChange={set("location")} placeholder="Lagos, Nigeria" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description || ""} onChange={set("description")} placeholder="Tell fans about your event…" /></div>
            <div className="space-y-1.5"><Label>Total Tickets</Label><Input type="number" value={form.total_tickets} onChange={set("total_tickets")} /></div>
            <div className="space-y-1.5"><Label>Currency</Label>
              <Select value={form.currency} onValueChange={set("currency")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["NGN","USD","GBP","GHS","KES"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <Switch checked={form.is_free} onCheckedChange={(v) => setForm(f => ({ ...f, is_free: v }))} />
            <Label className="cursor-pointer">Free Event (no payment required)</Label>
          </div>

          {!form.is_free && (
            <div className="space-y-3 p-3 border border-border rounded-xl">
              <p className="text-sm font-medium">Ticket Pricing</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">General Admission</Label><Input type="number" value={form.general_price} onChange={set("general_price")} /></div>
                <div className="space-y-1.5"><Label className="text-xs">VIP</Label><Input type="number" value={form.vip_price} onChange={set("vip_price")} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Early Bird</Label><Input type="number" value={form.early_bird_price} onChange={set("early_bird_price")} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Early Bird Qty</Label><Input type="number" value={form.early_bird_available} onChange={set("early_bird_available")} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Revenue split: 80% Artist · 10% Producer · 10% Xedruo</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.title || !form.artist}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}