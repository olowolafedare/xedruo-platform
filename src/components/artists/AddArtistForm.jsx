import React, { useState } from "react";
import { Loader2, Upload, X, Plus } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const SERVICES = [
  { id: "live_performance", label: "Book for Live Performance" },
  { id: "feature", label: "Feature Artist" },
  { id: "collaboration", label: "Collaboration" },
  { id: "songwriting", label: "Songwriting" },
  { id: "brand_ambassador", label: "Brand Ambassador" },
  { id: "event_appearance", label: "Event Appearance" },
  { id: "studio_session", label: "Studio Session" },
  { id: "voice_over", label: "Voice Over" },
];

const SOCIAL_FIELDS = [
  ["Instagram", "instagram_url"], ["TikTok", "tiktok_url"], ["Facebook", "facebook_url"],
  ["X (Twitter)", "twitter_url"], ["YouTube", "youtube_url"], ["Threads", "threads_url"],
  ["Snapchat", "snapchat_url"], ["Telegram", "telegram_url"], ["Twitch", "twitch_url"],
  ["LinkedIn", "linkedin_url"], ["Pinterest", "pinterest_url"],
  ["Spotify", "spotify_url"], ["Apple Music", "apple_music_url"], ["Audiomack", "audiomack_url"],
  ["SoundCloud", "soundcloud_url"], ["Boomplay", "boomplay_url"], ["Deezer", "deezer_url"],
  ["Bandcamp", "bandcamp_url"], ["Mixcloud", "mixcloud_url"], ["Official Website", "website_url"],
];

const PRICE_FIELDS = [
  ["Performance Fee (starting from)", "performance_fee"],
  ["Feature Verse Price", "feature_price"],
  ["Collaboration Price", "collaboration_price"],
  ["Songwriting Price", "songwriting_price"],
  ["Studio Session Price", "studio_session_price"],
  ["Music Video Appearance Price", "music_video_price"],
];

export default function AddArtistForm({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ services: [], gallery_photos: [], gallery_videos: [] });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const { toast } = useToast();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleService = (id) => {
    setForm(f => ({ ...f, services: f.services.includes(id) ? f.services.filter(s => s !== id) : [...f.services, id] }));
  };

  const uploadFile = async (file, key, isMultiple = false) => {
    setUploading(key);
    try {
      const { file_url } = await xedruo.integrations.Core.UploadFile({ file });
      if (isMultiple) {
        setForm(f => ({ ...f, [key]: [...(f[key] || []), file_url] }));
      } else {
        setForm(f => ({ ...f, [key]: file_url }));
      }
      toast({ title: "Uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(null);
  };

  const removeMedia = (key, idx) => {
    setForm(f => ({ ...f, [key]: (f[key] || []).filter((_, i) => i !== idx) }));
  };

  const submit = async () => {
    if (!form.name) { toast({ title: "Artist name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        performance_fee: Number(form.performance_fee) || 0,
        feature_price: Number(form.feature_price) || 0,
        collaboration_price: Number(form.collaboration_price) || 0,
        songwriting_price: Number(form.songwriting_price) || 0,
        studio_session_price: Number(form.studio_session_price) || 0,
        music_video_price: Number(form.music_video_price) || 0,
        booking_fee: Number(form.performance_fee) || 0,
        verified: false,
        monthly_listeners: 0,
        followers: 0,
        total_streams: 0,
      };
      const created = await xedruo.entities.ArtistProfile.create(payload);
      toast({ title: "Artist profile created!", description: `${form.name} is now live.` });
      setForm({ services: [], gallery_photos: [], gallery_videos: [] });
      onCreated?.(created);
      onClose();
    } catch {
      toast({ title: "Could not create profile", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Artist Profile</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="media">Gallery</TabsTrigger>
          </TabsList>

          {/* Profile */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Artist Name *</Label><Input value={form.name || ""} onChange={set("name")} /></div>
              <div className="space-y-1.5"><Label>Stage Name</Label><Input value={form.stage_name || ""} onChange={set("stage_name")} /></div>
              <div className="space-y-1.5"><Label>Genre</Label><Input value={form.genre || ""} onChange={set("genre")} /></div>
              <div className="space-y-1.5"><Label>Location (legacy)</Label><Input value={form.location || ""} onChange={set("location")} /></div>
              <div className="space-y-1.5"><Label>Country</Label><Input value={form.country || ""} onChange={set("country")} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city || ""} onChange={set("city")} /></div>
            </div>
            <div className="space-y-1.5"><Label>Bio / About</Label><Textarea rows={4} value={form.bio || ""} onChange={set("bio")} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <UploadField label="Profile Picture" value={form.avatar_url} onFile={(f) => uploadFile(f, "avatar_url")} uploading={uploading === "avatar_url"} />
              <UploadField label="Cover Banner" value={form.banner_url} onFile={(f) => uploadFile(f, "banner_url")} uploading={uploading === "banner_url"} />
            </div>
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact" className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Manager Name</Label><Input value={form.manager_name || ""} onChange={set("manager_name")} /></div>
              <div className="space-y-1.5"><Label>Booking Email</Label><Input type="email" value={form.booking_email || ""} onChange={set("booking_email")} /></div>
              <div className="space-y-1.5"><Label>Phone Number</Label><Input value={form.phone || ""} onChange={set("phone")} /></div>
              <div className="space-y-1.5"><Label>Business WhatsApp</Label><Input value={form.whatsapp || ""} onChange={set("whatsapp")} /></div>
            </div>
            <div className="space-y-2">
              <Label>Social Media Links</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                {SOCIAL_FIELDS.map(([label, key]) => (
                  <div key={key} className="space-y-1"><Input placeholder={label} value={form[key] || ""} onChange={set(key)} /></div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {PRICE_FIELDS.map(([label, key]) => (
                <div key={key} className="space-y-1.5"><Label>{label} (₦)</Label><Input type="number" value={form[key] || ""} onChange={set(key)} /></div>
              ))}
            </div>
          </TabsContent>

          {/* Services */}
          <TabsContent value="services" className="space-y-3">
            <p className="text-sm text-muted-foreground">Select the services this artist offers.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {SERVICES.map(s => (
                <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm text-left transition-colors ${form.services.includes(s.id) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"}`}>
                  <span className={`w-5 h-5 rounded-md grid place-items-center text-xs ${form.services.includes(s.id) ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{form.services.includes(s.id) ? "✓" : ""}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="media" className="space-y-4">
            <MultiUpload label="Artist Photos" items={form.gallery_photos} onFile={(f) => uploadFile(f, "gallery_photos", true)} onRemove={(i) => removeMedia("gallery_photos", i)} uploading={uploading === "gallery_photos"} />
            <MultiUpload label="Music / Performance Videos" items={form.gallery_videos} onFile={(f) => uploadFile(f, "gallery_videos", true)} onRemove={(i) => removeMedia("gallery_videos", i)} uploading={uploading === "gallery_videos"} />
            <div className="space-y-1.5"><Label>Availability Calendar (notes)</Label><Textarea rows={2} value={form.availability_calendar || ""} onChange={set("availability_calendar")} placeholder="e.g. Available weekends, fully booked Dec 2026" /></div>
            <div className="space-y-1.5"><Label>Payment Details</Label><Textarea rows={2} value={form.payment_details || ""} onChange={set("payment_details")} placeholder="Bank, PayPal, crypto, payment terms…" /></div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !form.name} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Create Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadField({ label, value, onFile, uploading }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <label className="block">
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-3 text-center cursor-pointer hover:border-primary transition-colors">
          {value ? <img src={value} alt="" className="h-20 mx-auto rounded-lg object-cover" /> : (
            <div className="text-xs text-muted-foreground flex flex-col items-center gap-1 py-2">
              <Upload className="w-5 h-5" />{uploading ? "Uploading…" : "Click to upload"}
            </div>
          )}
        </div>
        <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
      </label>
    </div>
  );
}

function MultiUpload({ label, items, onFile, onRemove, uploading }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {(items || []).map((url, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
            {url.match(/\.(mp4|webm|mov)$/i) ? <video src={url} className="w-full h-full object-cover" /> : <img src={url} alt="" className="w-full h-full object-cover" />}
            <button type="button" onClick={() => onRemove(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white grid place-items-center"><X className="w-3 h-3" /></button>
          </div>
        ))}
        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border grid place-items-center cursor-pointer hover:border-primary transition-colors">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
          <input type="file" className="hidden" accept="image/*,video/*" onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
        </label>
      </div>
    </div>
  );
}