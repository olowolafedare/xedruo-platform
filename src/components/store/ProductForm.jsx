import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

const TYPES = ["merch", "album", "single", "beat_pack", "sample_pack", "drum_kit", "preset", "template", "course", "ebook", "digital_download", "membership"];

export default function ProductForm({ onCreated }) {
  const [form, setForm] = useState({ type: "digital_download", currency: "NGN" });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: typeof e === "string" ? e : e.target.value });

  const submit = async () => {
    setSaving(true);
    await xedruo.entities.Product.create({ ...form, price: Number(form.price) || 0, status: "active", sales: 0 });
    setSaving(false);
    onCreated?.();
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1.5"><Label>Product Name</Label><Input value={form.name || ""} onChange={set("name")} /></div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={form.type} onValueChange={set("type")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description || ""} onChange={set("description")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Price (₦)</Label><Input type="number" min="0" value={form.price || ""} onChange={set("price")} /></div>
          <div className="space-y-1.5"><Label>Inventory (-1 = unlimited)</Label><Input type="number" value={form.inventory ?? "-1"} onChange={set("inventory")} /></div>
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button onClick={submit} disabled={saving || !form.name}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create Product
        </Button>
      </DialogFooter>
    </>
  );
}