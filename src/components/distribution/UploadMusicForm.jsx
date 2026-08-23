import React, { useState } from "react";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";

const GENRES = ["Afrobeats", "Afropop", "Amapiano", "Afrohouse", "Highlife", "Fuji", "Juju", "R&B", "Hip-Hop", "Gospel", "Pop", "Alternative", "Jazz", "Soul"];

export default function UploadMusicForm({ onCreated }) {
  const [form, setForm] = useState({ genre: "", language: "English" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [artworkFile, setArtworkFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [step, setStep] = useState(1); // 1: info, 2: files
  const { toast } = useToast();

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.artist) {
      toast({ title: "Missing required fields", description: "Title and artist are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    await xedruo.entities.Release.create({
      title: form.title,
      artist: form.artist,
      featured_artist: form.featured_artist,
      genre: form.genre,
      language: form.language,
      release_date: form.release_date,
      status: "in_review",
    });
    setSaving(false);
    setDone(true);
    setForm({ genre: "", language: "English" });
    setArtworkFile(null);
    setAudioFile(null);
    setStep(1);
    onCreated?.();
    toast({ title: "🎉 Music submitted!", description: "Your release is under review. We'll notify you when it's live." });
    setTimeout(() => setDone(false), 4000);
  };

  const errors = {
    title: form.title === "" && step === 2 ? "Song title is required" : null,
    artist: form.artist === "" && step === 2 ? "Artist name is required" : null,
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-2">
        {[1, 2].map(s => (
          <React.Fragment key={s}>
            <button type="button" onClick={() => s < step && setStep(s)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${step === s ? "border-primary bg-primary text-primary-foreground" : step > s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </button>
            {s < 2 && <div className={`flex-1 h-0.5 rounded ${step > s ? "bg-primary" : "bg-border"}`} />}
          </React.Fragment>
        ))}
        <span className="text-xs text-muted-foreground ml-2">{step === 1 ? "Song Info" : "Files & Submit"}</span>
      </div>

      {step === 1 && (
        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h3 className="font-semibold">Song Information</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Song Title <span className="text-destructive">*</span></Label>
              <Input value={form.title || ""} onChange={set("title")} placeholder="e.g. Midnight Drive" className={errors.title ? "border-destructive" : ""} />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Artist Name <span className="text-destructive">*</span></Label>
              <Input value={form.artist || ""} onChange={set("artist")} placeholder="e.g. Ada O." className={errors.artist ? "border-destructive" : ""} />
              {errors.artist && <p className="text-xs text-destructive">{errors.artist}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Featured Artist</Label>
              <Input value={form.featured_artist || ""} onChange={set("featured_artist")} placeholder="e.g. Burna Boy" />
            </div>
            <div className="space-y-1.5">
              <Label>Genre</Label>
              <select value={form.genre || ""} onChange={set("genre")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-sm">
                <option value="">Select genre…</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Input value={form.language || ""} onChange={set("language")} placeholder="English" />
            </div>
            <div className="space-y-1.5">
              <Label>Release Date</Label>
              <Input type="date" value={form.release_date || ""} onChange={set("release_date")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Lyrics (optional)</Label>
            <Textarea rows={3} value={form.lyrics || ""} onChange={set("lyrics")} placeholder="Paste lyrics here…" />
          </div>

          <Button type="button" className="w-full sm:w-auto" onClick={() => setStep(2)} disabled={!form.title || !form.artist}>
            Next: Upload Files →
          </Button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <h3 className="font-semibold">Upload Files</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`border-2 border-dashed rounded-xl p-6 text-center text-sm cursor-pointer transition-colors flex flex-col items-center gap-2 ${artworkFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <input type="file" accept="image/*" className="hidden" onChange={e => setArtworkFile(e.target.files?.[0])} />
              <UploadCloud className={`w-8 h-8 ${artworkFile ? "text-primary" : "text-muted-foreground"}`} />
              {artworkFile ? (
                <><span className="font-medium text-primary">{artworkFile.name}</span><span className="text-xs text-muted-foreground">Artwork uploaded</span></>
              ) : (
                <><span className="font-medium">Upload Artwork</span><span className="text-xs text-muted-foreground">JPG or PNG, min 3000×3000px</span></>
              )}
            </label>

            <label className={`border-2 border-dashed rounded-xl p-6 text-center text-sm cursor-pointer transition-colors flex flex-col items-center gap-2 ${audioFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
              <input type="file" accept=".mp3,.wav,.flac,.aiff" className="hidden" onChange={e => setAudioFile(e.target.files?.[0])} />
              <UploadCloud className={`w-8 h-8 ${audioFile ? "text-primary" : "text-muted-foreground"}`} />
              {audioFile ? (
                <><span className="font-medium text-primary">{audioFile.name}</span><span className="text-xs text-muted-foreground">Audio uploaded</span></>
              ) : (
                <><span className="font-medium">Upload Audio</span><span className="text-xs text-muted-foreground">MP3, WAV, FLAC or AIFF</span></>
              )}
            </label>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-1">
            <p className="font-medium">Submitting: <span className="text-primary">{form.title}</span> by <span className="text-primary">{form.artist}</span></p>
            {form.genre && <p className="text-muted-foreground">Genre: {form.genre} · Language: {form.language}</p>}
            {form.release_date && <p className="text-muted-foreground">Release date: {form.release_date}</p>}
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
            <Button type="submit" disabled={saving} className="gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> :
               done ? <><CheckCircle2 className="w-4 h-4" /> Submitted!</> :
               "Submit for Distribution"}
            </Button>
          </div>
        </motion.div>
      )}
    </form>
  );
}