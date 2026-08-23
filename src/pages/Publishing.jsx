import React, { useEffect, useState } from "react";
import { BookOpen, Plus, Loader2, FileCheck, Layers, Music, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const statusColor = { registered: "bg-green-500/15 text-green-600", pending: "bg-amber-500/15 text-amber-600", rejected: "bg-red-500/15 text-red-600" };

export default function Publishing() {
  const [songs, setSongs] = useState([]);
  const [form, setForm] = useState({ splits: [] });
  const activePlan = localStorage.getItem("xedruo_active_plan") || "Artist";
  const hasLicensing = activePlan === "Pro" || activePlan === "Label";
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [split, setSplit] = useState({ name: "", role: "Composer", percentage: 50 });

  const load = () => xedruo.entities.Song.list("-created_date", 50).then(setSongs);
  useEffect(() => { load(); }, []);

  const addSplit = () => {
    setForm({ ...form, splits: [...(form.splits || []), { ...split }] });
    setSplit({ name: "", role: "Composer", percentage: 0 });
  };

  const register = async () => {
    if (!hasLicensing) return;
    setSaving(true);
    await xedruo.entities.Song.create({ ...form, status: "pending" });
    setSaving(false); setOpen(false); setForm({ splits: [] }); load();
  };

  const registered = songs.filter(s => s.status === "registered").length;
  const pending = songs.filter(s => s.status === "pending").length;
  const syncAvailable = songs.filter(s => s.sync_available).length;

  return (
    <div>
      {!hasLicensing && (
        <div className="mb-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Pro or Label plan required</p>
            <p className="text-xs text-amber-500 mt-0.5">Song registration, sync licensing, and publishing rights management are only available on Pro and Label plans.{" "}
              <Link to="/pricing" className="underline font-semibold">Upgrade to Pro →</Link>
            </p>
          </div>
        </div>
      )}

      <PageHeader title="Rights & Publishing" subtitle="Register songs, manage splits, and administer your publishing rights." action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Register Song</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Register Song</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2"><Label>Song Title</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-1.5 col-span-2"><Label>Artist</Label><Input value={form.artist || ""} onChange={(e) => setForm({ ...form, artist: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>ISRC</Label><Input value={form.isrc || ""} onChange={(e) => setForm({ ...form, isrc: e.target.value })} placeholder="Auto-generated" /></div>
                <div className="space-y-1.5"><Label>ISWC</Label><Input value={form.iswc || ""} onChange={(e) => setForm({ ...form, iswc: e.target.value })} placeholder="Auto-generated" /></div>
                <div className="space-y-1.5"><Label>UPC</Label><Input value={form.upc || ""} onChange={(e) => setForm({ ...form, upc: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Genre</Label><Input value={form.genre || ""} onChange={(e) => setForm({ ...form, genre: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Language</Label><Input value={form.language || ""} onChange={(e) => setForm({ ...form, language: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Release Date</Label><Input type="date" value={form.release_date || ""} onChange={(e) => setForm({ ...form, release_date: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="sync" checked={form.sync_available || false}
                    onChange={(e) => setForm({ ...form, sync_available: e.target.checked })} className="rounded" />
                  <Label htmlFor="sync">Available for Sync Licensing</Label>
                  {!hasLicensing && <Badge variant="outline" className="text-xs text-amber-500 border-amber-400/50">Pro</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="cid" checked={form.content_id || false}
                    onChange={(e) => setForm({ ...form, content_id: e.target.checked })} className="rounded" />
                  <Label htmlFor="cid">Enable YouTube Content ID</Label>
                  {!hasLicensing && <Badge variant="outline" className="text-xs text-amber-500 border-amber-400/50">Pro</Badge>}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Split Sheet</Label>
                {(form.splits || []).map((s, i) => (
                  <div key={i} className="text-sm bg-muted rounded px-3 py-1.5 mb-1 flex justify-between">
                    <span>{s.name} ({s.role})</span><span>{s.percentage}%</span>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Input placeholder="Name" value={split.name} onChange={(e) => setSplit({ ...split, name: e.target.value })} />
                  <Select value={split.role} onValueChange={(v) => setSplit({ ...split, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Composer", "Lyricist", "Producer", "Publisher"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="%" value={split.percentage} onChange={(e) => setSplit({ ...split, percentage: Number(e.target.value) })} />
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={addSplit}>+ Add to Split Sheet</Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={register} disabled={saving || !form.title || !hasLicensing}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Register</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      } />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon={Music} label="Registered Songs" value={String(registered)} />
        <StatCard icon={FileCheck} label="Pending Review" value={String(pending)} />
        <StatCard icon={Layers} label="Sync Available" value={String(syncAvailable)} />
        <StatCard icon={BookOpen} label="Total Songs" value={String(songs.length)} />
      </div>

      <Tabs defaultValue="catalog">
        <TabsList className="mb-5">
          <TabsTrigger value="catalog">Song Catalog</TabsTrigger>
          <TabsTrigger value="sync">Sync Licensing</TabsTrigger>
          <TabsTrigger value="isrc">ISRC / UPC</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog">
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {songs.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No registered songs yet.</div>}
            {songs.map((s) => (
              <div key={s.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center font-bold text-primary">{s.title?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.artist} · {s.genre || "—"}</div>
                  {s.splits?.length > 0 && <div className="text-xs text-muted-foreground mt-0.5">{s.splits.length} splits · {s.splits.reduce((a, sp) => a + sp.percentage, 0)}% allocated</div>}
                </div>
                <div className="flex items-center gap-2">
                  {s.sync_available && <Badge variant="outline" className="text-xs">Sync</Badge>}
                  {s.content_id && <Badge variant="outline" className="text-xs">Content ID</Badge>}
                  <Badge className={`border-0 capitalize text-xs ${statusColor[s.status]}`}>{s.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sync">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-muted-foreground text-sm mb-4">Songs marked as sync-available will be pitched to TV, film, and ad placements globally.</p>
            <div className="space-y-3">
              {songs.filter(s => s.sync_available).map((s) => (
                <div key={s.id} className="flex items-center gap-3 bg-muted rounded-xl p-3">
                  <Music className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0"><div className="font-medium truncate text-sm">{s.title}</div><div className="text-xs text-muted-foreground">{s.artist}</div></div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              ))}
              {songs.filter(s => s.sync_available).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No songs in sync library. Enable sync when registering a song.</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="isrc">
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            <div className="grid grid-cols-4 gap-4 p-3 text-xs font-semibold text-muted-foreground">
              <span>Title</span><span>ISRC</span><span>ISWC</span><span>UPC</span>
            </div>
            {songs.map((s) => (
              <div key={s.id} className="grid grid-cols-4 gap-4 p-4 text-sm items-center">
                <span className="font-medium truncate">{s.title}</span>
                <span className="font-mono text-muted-foreground text-xs">{s.isrc || "—"}</span>
                <span className="font-mono text-muted-foreground text-xs">{s.iswc || "—"}</span>
                <span className="font-mono text-muted-foreground text-xs">{s.upc || "—"}</span>
              </div>
            ))}
            {songs.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No songs registered.</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}