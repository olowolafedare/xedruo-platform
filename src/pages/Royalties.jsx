import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Download, Plus, Loader2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { money } from "@/lib/format";
const TYPES = ["streaming", "publishing", "producer", "sync", "performance"];

function RoyaltiesInner() {
  const [statements, setStatements] = useState([]);
  const [form, setForm] = useState({ type: "streaming", currency: "NGN" });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => xedruo.entities.RoyaltyStatement.list("-created_date", 60).then(setStatements);
  useEffect(() => { load(); }, []);

  const add = async () => {
    setSaving(true);
    const amount = Number(form.amount) || 0;
    // Distribution is excluded from revenue split; all other types get split
    const isDistribution = form.type === "streaming" && form.notes?.includes("distribution");
    const artistShare = isDistribution ? amount : amount * 0.8;
    const producerShare = isDistribution ? 0 : amount * 0.1;
    const xedruo_share = isDistribution ? 0 : amount * 0.1;
    await xedruo.entities.RoyaltyStatement.create({
      ...form, amount, status: "pending",
      artist_share: artistShare, producer_share: producerShare, xedruo_share,
    });
    setSaving(false); setOpen(false); setForm({ type: "streaming", currency: "NGN" }); load();
  };

  const total = statements.reduce((a, s) => a + (s.amount || 0), 0);
  const pending = statements.filter(s => s.status === "pending").reduce((a, s) => a + s.amount, 0);
  const withdrawn = statements.filter(s => s.status === "withdrawn").reduce((a, s) => a + s.amount, 0);

  const byType = TYPES.map(t => ({ type: t, amount: statements.filter(s => s.type === t).reduce((a, s) => a + s.amount, 0) }));

  const withdraw = async (id) => {
    await xedruo.entities.RoyaltyStatement.update(id, { status: "withdrawn" });
    await xedruo.entities.WalletTransaction.create({ description: "Royalty withdrawal", type: "credit", amount: statements.find(s => s.id === id)?.amount || 0, currency: "NGN", category: "royalty", status: "completed" });
    load();
  };

  const statusColor = { pending: "bg-amber-500/15 text-amber-600", paid: "bg-blue-500/15 text-blue-600", withdrawn: "bg-green-500/15 text-green-600" };

  return (
    <div>
      <PageHeader title="Royalty Engine" subtitle="Track, manage, and withdraw all your royalty earnings." action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Statement</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Royalty Statement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Period (e.g. June 2026)</Label><Input value={form.period || ""} onChange={(e) => setForm({ ...form, period: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Amount</Label><Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Streams</Label><Input type="number" value={form.streams || ""} onChange={(e) => setForm({ ...form, streams: Number(e.target.value) })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={add} disabled={saving || !form.period}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon={DollarSign} label="Total Royalties" value={money(total)} />
        <StatCard icon={TrendingUp} label="Pending Withdrawal" value={money(pending)} hint="Available now" />
        <StatCard icon={DollarSign} label="Withdrawn" value={money(withdrawn)} />
        <StatCard icon={TrendingUp} label="Statements" value={String(statements.length)} />
      </div>

      <Tabs defaultValue="statements">
        <TabsList className="mb-5 flex-wrap h-auto gap-1">
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="statements">
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {statements.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No royalty statements yet.</div>}
            {statements.map((s) => (
              <div key={s.id} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{s.period}</div>
                  <div className="text-sm text-muted-foreground capitalize">{s.type} · {s.streams?.toLocaleString() || "—"} streams</div>
                  {/* Revenue split breakdown */}
                  {(s.artist_share > 0 || s.producer_share > 0 || s.xedruo_share > 0) && (
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-[11px] bg-green-500/10 text-green-700 px-2 py-0.5 rounded-full">
                        Artist {money(s.artist_share, s.currency)}
                      </span>
                      {s.producer_share > 0 && (
                        <span className="text-[11px] bg-blue-500/10 text-blue-700 px-2 py-0.5 rounded-full">
                          Producer {money(s.producer_share, s.currency)}
                        </span>
                      )}
                      {s.xedruo_share > 0 && (
                        <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Xedruo {money(s.xedruo_share, s.currency)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold">{money(s.amount, s.currency)}</div>
                </div>
                <Badge className={`border-0 capitalize text-xs shrink-0 ${statusColor[s.status]}`}>{s.status}</Badge>
                {s.status === "pending" && <Button size="sm" variant="outline" onClick={() => withdraw(s.id)}>Withdraw</Button>}
                <Button variant="ghost" size="icon"><Download className="w-4 h-4 text-muted-foreground" /></Button>
              </div>
            ))}
          </div>
          {pending > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div><div className="font-semibold">Total available: {money(pending)}</div><div className="text-sm text-muted-foreground">Withdraw to your Xedruo wallet instantly</div></div>
              <Button onClick={async () => { for (const s of statements.filter(x => x.status === "pending")) await withdraw(s.id); }}>Withdraw All</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="rounded-2xl border border-border bg-card p-5 mb-5">
            <h3 className="font-semibold mb-4">Royalties by Type</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byType} barSize={32}>
                <XAxis dataKey="type" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(v) => money(v)} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {byType.map((_, i) => <Cell key={i} fill="hsl(var(--primary))" opacity={0.7 + i * 0.05} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Royalties() {
  return <RoyaltiesInner />;
}