import React, { useState } from "react";
import {
  Globe2, Send, RefreshCw, Zap, ArrowDownToLine, AlertTriangle, History,
  CheckCircle2, Loader2, Pencil, ShieldCheck, Save, X
} from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export const TERRITORIES = [
  "Worldwide", "Nigeria", "Ghana", "Kenya", "South Africa", "Tanzania", "Uganda",
  "UK", "USA", "Canada", "France", "Germany", "Netherlands", "Brazil", "Australia", "Japan",
];

export const PLATFORMS = [
  { id: "spotify", name: "Spotify", emoji: "🎵" },
  { id: "apple_music", name: "Apple Music", emoji: "🍎" },
  { id: "tidal", name: "Tidal", emoji: "🌊" },
  { id: "youtube_music", name: "YouTube Music", emoji: "▶️" },
  { id: "amazon_music", name: "Amazon Music", emoji: "📦" },
  { id: "boomplay", name: "Boomplay", emoji: "🎶" },
  { id: "audiomack", name: "Audiomack", emoji: "🎧" },
  { id: "deezer", name: "Deezer", emoji: "🎼" },
  { id: "soundcloud", name: "SoundCloud", emoji: "☁️" },
  { id: "pandora", name: "Pandora", emoji: "📻" },
  { id: "anghami", name: "Anghami", emoji: "🏜️" },
  { id: "tiktok_music", name: "TikTok Music", emoji: "🎬" },
];

function Section({ icon: Icon, title, desc, children, action }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{title}</h4>
            {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DistributionManager({ release, onUpdated }) {
  const [busy, setBusy] = useState(null);
  const [editMeta, setEditMeta] = useState(false);
  const [meta, setMeta] = useState({ title: release?.title, artist: release?.artist, genre: release?.genre, featured_artist: release?.featured_artist });
  const [takedownReason, setTakedownReason] = useState("");
  const [correction, setCorrection] = useState("");
  const { toast } = useToast();

  if (!release) {
    return <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Select a release from My Releases to manage its distribution.</div>;
  }

  const update = async (patch, msg) => {
    setBusy("update");
    const updated = await xedruo.entities.Release.update(release.id, patch);
    onUpdated?.(updated);
    if (msg) toast({ title: msg });
    setBusy(null);
    return updated;
  };

  const toggleTerritory = (t) => {
    const cur = release.territories || ["worldwide"];
    let next;
    if (t === "Worldwide") next = ["worldwide"];
    else next = cur.includes("worldwide") ? [t] : cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t];
    if (next.length === 0) next = ["worldwide"];
    update({ territories: next }, "Territories updated");
  };

  const togglePlatform = (id) => {
    const cur = release.platforms && release.platforms.length ? release.platforms : PLATFORMS.map(p => p.id);
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    update({ platforms: next }, "Platform selection updated");
  };

  const redistribute = async () => {
    setBusy("redist");
    await update({
      status: "in_review",
      distribution_attempts: (release.distribution_attempts || 0) + 1,
      last_distributed_at: new Date().toISOString(),
      takedown_status: "none",
    });
    setBusy(null);
    toast({ title: "🔄 Re-distribution started", description: "Your release is being pushed to all selected platforms again." });
  };

  const fastReview = async () => {
    setBusy("fast");
    await update({ fast_review: true });
    setBusy(null);
    toast({ title: "⚡ Fast Review activated", description: "Your release is now prioritized in the review queue." });
  };

  const requestTakedown = async () => {
    if (!takedownReason.trim()) { toast({ title: "Reason required", variant: "destructive" }); return; }
    setBusy("takedown");
    await update({ takedown_status: "requested", takedown_reason: takedownReason, status: "takedown" });
    setTakedownReason("");
    setBusy(null);
    toast({ title: "⬇️ Takedown requested", description: "Your release will be removed from all platforms." });
  };

  const saveCorrection = async () => {
    setBusy("correct");
    await update({ ...meta, correction_notes: correction, status: "in_review", metadata_valid: false });
    setEditMeta(false);
    setBusy(null);
    toast({ title: "✏️ Correction submitted", description: "Updated metadata sent for re-review." });
  };

  const reupload = async () => {
    setBusy("reupload");
    const v = (release.version || "v1").replace("v", "");
    await update({ version: `v${Number(v) + 1}`, status: "in_review", distribution_attempts: (release.distribution_attempts || 0) + 1 });
    setBusy(null);
    toast({ title: "📤 Re-upload queued", description: "New version flagged for re-delivery to all platforms." });
  };

  const selectedPlatforms = release.platforms && release.platforms.length ? release.platforms : PLATFORMS.map(p => p.id);
  const territories = release.territories || ["worldwide"];
  const isLive = release.status === "live";
  const isDown = release.takedown_status !== "none";

  return (
    <div className="space-y-5">
      {/* Header summary */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/10 grid place-items-center text-primary font-bold text-xl shrink-0 overflow-hidden">
          {release.artwork_url ? <img src={release.artwork_url} className="w-full h-full object-cover" alt="" /> : release.title?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-lg">{release.title}</h3>
            <Badge variant="outline" className="capitalize">{release.version || "v1"}</Badge>
            {release.fast_review && <Badge className="bg-amber-500/15 text-amber-500 border-0 gap-1"><Zap className="w-3 h-3" />Fast Review</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{release.artist}{release.featured_artist ? ` ft. ${release.featured_artist}` : ""}{release.genre ? ` · ${release.genre}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={`${isLive ? "bg-green-500/15 text-green-500" : "bg-amber-500/15 text-amber-500"} border-0 capitalize`}>{release.status?.replace("_", " ")}</Badge>
          <Badge className={`${release.content_id_status === "active" ? "bg-green-500/15 text-green-500" : release.content_id_status === "pending" ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"} border-0`}>Content ID: {release.content_id_status || "not_enrolled"}</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Territory Management */}
        <Section icon={Globe2} title="Territory Management" desc="Control which countries your release is available in.">
          <div className="flex flex-wrap gap-2">
            {TERRITORIES.map(t => {
              const active = t === "Worldwide" ? territories.includes("worldwide") : territories.includes(t);
              return (
                <button key={t} onClick={() => toggleTerritory(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {active && <CheckCircle2 className="w-3 h-3 inline mr-1" />}{t}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">{territories.includes("worldwide") ? "Available worldwide." : `${territories.length} territories selected.`}</p>
        </Section>

        {/* Platform Selection */}
        <Section icon={Send} title="Platform Selection" desc="Choose which stores receive your release.">
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(p => {
              const active = selectedPlatforms.includes(p.id);
              return (
                <button key={p.id} onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition-colors text-left ${active ? "border-primary/40 bg-primary/5" : "border-border opacity-60 hover:opacity-100"}`}>
                  <span>{p.emoji}</span>
                  <span className="flex-1 text-xs font-medium truncate">{p.name}</span>
                  {active ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> : <X className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Release Correction */}
        <Section icon={Pencil} title="Release Correction" desc="Fix metadata errors and resubmit for review."
          action={editMeta ? <Button size="sm" variant="ghost" onClick={() => setEditMeta(false)}>Cancel</Button> : null}>
          {!editMeta ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditMeta(true)}><Pencil className="w-3.5 h-3.5" />Edit Metadata</Button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={meta.title || ""} onChange={e => setMeta({ ...meta, title: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Artist</Label><Input value={meta.artist || ""} onChange={e => setMeta({ ...meta, artist: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Featured</Label><Input value={meta.featured_artist || ""} onChange={e => setMeta({ ...meta, featured_artist: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Genre</Label><Input value={meta.genre || ""} onChange={e => setMeta({ ...meta, genre: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label className="text-xs">Correction notes (optional)</Label><Textarea rows={2} value={correction} onChange={e => setCorrection(e.target.value)} placeholder="Describe what was fixed…" /></div>
              <Button size="sm" className="gap-2" onClick={saveCorrection} disabled={busy === "correct"}>{busy === "correct" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Submit Correction</Button>
            </div>
          )}
        </Section>

        {/* Distribution History */}
        <Section icon={History} title="Distribution History" desc="Delivery attempts and timeline.">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Distribution attempts</span><span className="font-semibold">{release.distribution_attempts || 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Current version</span><span className="font-semibold">{release.version || "v1"}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Last distributed</span><span className="font-semibold">{release.last_distributed_at ? new Date(release.last_distributed_at).toLocaleDateString() : "—"}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Metadata validated</span>{release.metadata_valid ? <Badge className="bg-green-500/15 text-green-500 border-0 gap-1"><ShieldCheck className="w-3 h-3" />Valid</Badge> : <Badge className="bg-amber-500/15 text-amber-500 border-0">Pending</Badge>}</div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Takedown status</span><Badge className={isDown ? "bg-red-500/15 text-red-500 border-0 capitalize" : "bg-muted text-muted-foreground border-0 capitalize"}>{release.takedown_status || "none"}</Badge></div>
          </div>
        </Section>
      </div>

      {/* Action tools */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={redistribute} disabled={busy === "redist"}
          className="rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/40 transition-colors group">
          <RefreshCw className={`w-5 h-5 text-primary mb-2 ${busy === "redist" ? "animate-spin" : "group-hover:rotate-180 transition-transform"}`} />
          <div className="font-semibold text-sm">Re-distribute</div>
          <p className="text-xs text-muted-foreground mt-0.5">Push to all platforms again.</p>
        </button>
        <button onClick={fastReview} disabled={busy === "fast" || release.fast_review}
          className="rounded-2xl border border-border bg-card p-4 text-left hover:border-amber-400/40 transition-colors disabled:opacity-50">
          <Zap className="w-5 h-5 text-amber-500 mb-2" />
          <div className="font-semibold text-sm">Fast Review</div>
          <p className="text-xs text-muted-foreground mt-0.5">{release.fast_review ? "Activated" : "Priority review queue."}</p>
        </button>
        <button onClick={reupload} disabled={busy === "reupload"}
          className="rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/40 transition-colors group">
          <ArrowDownToLine className={`w-5 h-5 text-primary mb-2 ${busy === "reupload" ? "animate-bounce" : ""}`} />
          <div className="font-semibold text-sm">Re-upload Manager</div>
          <p className="text-xs text-muted-foreground mt-0.5">Flag new audio/artwork version.</p>
        </button>
        <div className="rounded-2xl border border-border bg-card p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
          <div className="font-semibold text-sm">Takedown Request</div>
          <Textarea rows={2} value={takedownReason} onChange={e => setTakedownReason(e.target.value)} placeholder="Reason for takedown…" className="my-2 text-xs h-16" />
          <Button size="sm" variant="destructive" className="w-full gap-1.5" onClick={requestTakedown} disabled={busy === "takedown" || isDown}>
            {busy === "takedown" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowDownToLine className="w-3.5 h-3.5" />}
            {isDown ? "Requested" : "Request Takedown"}
          </Button>
        </div>
      </div>
    </div>
  );
}