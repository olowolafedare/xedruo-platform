import React, { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Send } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const banks = ["Access Bank", "GTBank", "Zenith Bank", "First Bank", "UBA", "Kuda", "Opay", "Moniepoint", "Sterling Bank", "Wema Bank"];

export default function BeneficiariesTab() {
  const [bens, setBens] = useState([]);
  const [form, setForm] = useState({ type: "bank", currency: "NGN" });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => xedruo.entities.Beneficiary.list("-created_date", 50).then(setBens);
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: typeof e === "string" ? e : e.target.value });

  const save = async () => {
    setSaving(true);
    await xedruo.entities.Beneficiary.create(form);
    setSaving(false); setOpen(false); setForm({ type: "bank", currency: "NGN" }); load();
  };

  const remove = async (id) => { await xedruo.entities.Beneficiary.delete(id); load(); };

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Saved Beneficiaries</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Add Beneficiary</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Beneficiary</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.name || ""} onChange={set("name")} /></div>
              <div className="space-y-1.5"><Label>Nickname</Label><Input value={form.nickname || ""} onChange={set("nickname")} placeholder="e.g. My Manager" /></div>
              <div className="space-y-1.5"><Label>Bank</Label>
                <Select value={form.bank_name} onValueChange={(v) => setForm({ ...form, bank_name: v })}>
                  <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>{banks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Account Number</Label><Input value={form.account_number || ""} onChange={set("account_number")} maxLength={10} /></div>
            </div>
            <DialogFooter><Button onClick={save} disabled={saving || !form.name}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Beneficiary"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {bens.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No saved beneficiaries yet. Add one to send money faster.</div>}
        {bens.map((b) => (
          <div key={b.id} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center font-bold text-primary">{b.name?.[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{b.name} {b.nickname && <span className="text-muted-foreground font-normal">({b.nickname})</span>}</div>
              <div className="text-sm text-muted-foreground">{b.bank_name} · {b.account_number}</div>
            </div>
            <Button variant="outline" size="sm"><Send className="w-3.5 h-3.5 mr-1" />Send</Button>
            <Button variant="ghost" size="icon" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}