import React, { useEffect, useState } from "react";
import { Building2, Users, Music, DollarSign, Plus, Loader2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function LabelDashboard() {
  const [labels, setLabels] = useState([]);
  const [form, setForm] = useState({});
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => xedruo.entities.Label.list("-created_date", 20).then(setLabels);
  useEffect(() => { load(); }, []);

  const create = async () => {
    setSaving(true);
    await xedruo.entities.Label.create({ ...form, status: "active", artist_count: 0, total_releases: 0, revenue: 0 });
    setSaving(false); setOpen(false); setForm({}); load();
  };

  const totalRevenue = labels.reduce((a, l) => a + (l.revenue || 0), 0);
  const totalArtists = labels.reduce((a, l) => a + (l.artist_count || 0), 0);

  return (
    <div>
      <PageHeader title="Label Dashboard" subtitle="Manage your record label, artists, and releases." action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Create Label</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Record Label</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Label Name</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Country</Label><Input value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Website</Label><Input type="url" value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={create} disabled={saving || !form.name}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Label"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      } />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon={Building2} label="Labels" value="0" />
        <StatCard icon={Users} label="Total Artists" value="0" />
        <StatCard icon={Music} label="Total Releases" value="0" />
        <StatCard icon={DollarSign} label="Revenue" value="0" />
      </div>

      <Tabs defaultValue="labels">
        <TabsList className="mb-5">
          <TabsTrigger value="labels">My Labels</TabsTrigger>
          <TabsTrigger value="invite">Invite Artists</TabsTrigger>
          <TabsTrigger value="roles">Team Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="labels">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {labels.length === 0 && <div className="col-span-full p-10 text-center text-sm text-muted-foreground rounded-2xl border border-border bg-card">No labels yet. Create your first label to get started.</div>}
            {labels.map((l) => (
              <div key={l.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 grid place-items-center font-bold text-xl text-primary mb-3">{l.name?.[0]}</div>
                <div className="font-semibold text-lg">{l.name}</div>
                {l.country && <div className="text-sm text-muted-foreground mb-3">{l.country}</div>}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted rounded-lg p-2 text-center"><div className="font-bold">0</div><div className="text-muted-foreground text-xs">Artists</div></div>
                  <div className="bg-muted rounded-lg p-2 text-center"><div className="font-bold">0</div><div className="text-muted-foreground text-xs">Releases</div></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" size="sm">Manage</Button>
                  <Button variant="outline" size="sm">Releases</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invite">
          <div className="max-w-md rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Invite an Artist</h3>
            <div className="space-y-1.5"><Label>Artist Email</Label><Input type="email" placeholder="artist@example.com" /></div>
            <div className="space-y-1.5"><Label>Role</Label>
              <div className="flex gap-2">
                {["Artist", "Co-Manager", "A&R"].map((r) => <Button key={r} variant="outline" size="sm">{r}</Button>)}
              </div>
            </div>
            <Button className="w-full">Send Invitation</Button>
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <div className="max-w-2xl rounded-2xl border border-border bg-card divide-y divide-border">
            {[["Label Owner", "Full access to all label features", "Admin"], ["A&R Manager", "Manage artist releases and approvals", "Manager"], ["Finance", "Revenue, royalties, withdrawals", "Finance"], ["Marketing", "Promotion campaigns only", "Limited"]].map(([r, desc, level]) => (
              <div key={r} className="p-4 flex items-center gap-4">
                <div className="flex-1"><div className="font-medium">{r}</div><div className="text-sm text-muted-foreground">{desc}</div></div>
                <Badge variant="secondary">{level}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}