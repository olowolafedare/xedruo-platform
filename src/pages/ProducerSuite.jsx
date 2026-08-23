import React, { useEffect, useState } from "react";
import { Wallet, Clock, TrendingUp, Music, Plus, Loader2 } from "lucide-react";
import { ngnToUsd } from "@/lib/currency";
import BeatMarketplace from "@/components/producer/BeatMarketplace";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { money } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";

export default function ProducerSuite() {
  const [beats, setBeats] = useState([]);
  const [form, setForm] = useState({});
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => xedruo.entities.Beat.list("-created_date", 50).then(setBeats);
  useEffect(() => { load(); }, []);

  const upload = async () => {
    setSaving(true);
    await xedruo.entities.Beat.create({
      title: form.title, producer: form.producer, genre: form.genre, mood: form.mood,
      bpm: Number(form.bpm) || undefined, key: form.key, description: form.description,
      price: Number(form.price) || 0, exclusive_price: Number(form.exclusive_price) || undefined,
    });
    setSaving(false); setOpen(false); setForm({}); load();
  };

  const buy = async (beat) => {
    const producerCut = Math.round((beat.price || 0) * 0.8);
    await xedruo.entities.WalletTransaction.create({ description: `Beat purchase: ${beat.title}`, type: "debit", amount: beat.price, category: "beat_sale", currency: "NGN" });
    await xedruo.entities.Beat.update(beat.id, { sales: (beat.sales || 0) + 1 });
    toast({ title: "Beat purchased", description: `Producer earns ${money(producerCut)} (80%), Xedruo ${money(beat.price - producerCut)} (20%).` });
    load();
  };

  const revenue = beats.reduce((a, b) => a + (b.sales || 0) * (b.price || 0), 0);
  const producerBalance = Math.round(revenue * 0.8);

  return (
    <div>
      <PageHeader title="Xedruo Producer Suite" subtitle="A global marketplace connecting producers and artists." action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Upload Beat</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Upload Beat</DialogTitle></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              {[["title","Title"],["producer","Producer"],["genre","Genre"],["mood","Mood"],["bpm","BPM"],["key","Key"],["price","Price (₦)"],["exclusive_price","Exclusive Price (₦)"]].map(([k,l]) => (
                <div key={k} className="space-y-1.5">
                  <Label>{l}</Label>
                  <Input value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                  {(k === "price" || k === "exclusive_price") && form[k] && Number(form[k]) > 0 && (
                    <p className="text-xs text-green-500">≈ ${ngnToUsd(Number(form[k]))} USD</p>
                  )}
                </div>
              ))}
              <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={upload} disabled={saving || !form.title}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Beat"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon={Wallet} label="Available Balance" value="0" hint="80% producer share" />
        <StatCard icon={Clock} label="Pending" value="0" />
        <StatCard icon={TrendingUp} label="Lifetime Earnings" value="0" />
        <StatCard icon={Music} label="Beats Listed" value="0" />
      </div>

      <Tabs defaultValue="marketplace">
        <TabsList className="mb-6">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="catalog">My Catalog</TabsTrigger>
        </TabsList>
        <TabsContent value="marketplace">
          <BeatMarketplace beats={beats} onBuy={buy} />
        </TabsContent>
        <TabsContent value="catalog">
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {beats.map((b) => (
              <div key={b.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0"><div className="font-medium truncate">{b.title}</div><div className="text-sm text-muted-foreground">0 sales</div></div>
                <span className="text-sm">0</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}