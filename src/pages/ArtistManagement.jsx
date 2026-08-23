import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Plus, ExternalLink } from "lucide-react";
import { ngnToUsd } from "@/lib/currency";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AddArtistForm from "@/components/artists/AddArtistForm";
import InquiriesInbox from "@/components/artists/InquiriesInbox";
import AvailabilityManager from "@/components/artists/AvailabilityManager";
import { Inbox, CalendarClock } from "lucide-react";

export default function ArtistManagement() {
  const [profiles, setProfiles] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);

  const load = () => xedruo.entities.ArtistProfile.list("-created_date", 50).then((p) => {
    setProfiles(p);
    if (p.length > 0 && !active) setActive(p[0]);
  });
  useEffect(() => { load(); }, []);

  const update = async (field, value) => {
    if (!active) return;
    const updated = await xedruo.entities.ArtistProfile.update(active.id, { [field]: value });
    setActive(updated);
    setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const setA = (k) => (e) => { const v = typeof e === "string" ? e : e.target.value; setActive({ ...active, [k]: v }); };

  return (
    <div>
      <PageHeader title="Artist Management" subtitle="Your professional artist dashboard." action={
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Artist</Button>
      } />

      <AddArtistForm open={open} onClose={() => setOpen(false)} onCreated={(p) => { load(); setActive(p); }} />

      {profiles.length === 0 && <div className="p-10 text-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">No artist profiles yet. Click "Add Artist" to create one.</div>}

      {profiles.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Profile list */}
          <div className="lg:col-span-1 space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">My Artists</div>
            {profiles.map(p => (
              <button key={p.id} onClick={() => setActive(p)}
                className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${active?.id === p.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold overflow-hidden shrink-0">
                  {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" alt="" /> : p.name?.[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.genre || "—"}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Active profile detail */}
          {active && (
            <div className="lg:col-span-3 space-y-5">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/40 grid place-items-center text-white text-3xl font-bold overflow-hidden shrink-0">
                    {active.avatar_url ? <img src={active.avatar_url} className="w-full h-full object-cover" alt="" /> : active.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-lg">{active.name}</div>
                      {active.verified && <Badge className="bg-blue-500/15 text-blue-600 border-0">Verified</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">{active.genre} · {[active.city, active.country].filter(Boolean).join(", ") || active.location}</div>
                  </div>
                  <Link to={`/artist/${active.id}`} target="_blank">
                    <Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> View Public Profile</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                  <div className="bg-muted rounded-lg p-2 text-center"><div className="font-bold">{(active.total_streams || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">Streams</div></div>
                  <div className="bg-muted rounded-lg p-2 text-center"><div className="font-bold">{(active.followers || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">Followers</div></div>
                  <div className="bg-muted rounded-lg p-2 text-center"><div className="font-bold">{(active.monthly_listeners || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">Monthly</div></div>
                </div>
              </div>

              <Tabs defaultValue="profile">
                <TabsList className="mb-4 flex-wrap h-auto gap-1">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="contact">Contact & Socials</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing & Services</TabsTrigger>
                  <TabsTrigger value="bio">Bio</TabsTrigger>
                  <TabsTrigger value="availability" className="gap-1.5"><CalendarClock className="w-3.5 h-3.5" /> Availability</TabsTrigger>
                  <TabsTrigger value="inquiries" className="gap-1.5"><Inbox className="w-3.5 h-3.5" /> Inquiries</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[["Artist Name", "name"], ["Stage Name", "stage_name"], ["Genre", "genre"], ["Country", "country"], ["City", "city"]].map(([label, key]) => (
                        <div key={key} className="space-y-1.5">
                          <Label>{label}</Label>
                          <Input value={active[key] || ""} onChange={setA(key)} onBlur={() => update(key, active[key])} />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact">
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[["Manager Name", "manager_name"], ["Booking Email", "booking_email"], ["Phone", "phone"], ["WhatsApp", "whatsapp"]].map(([label, key]) => (
                        <div key={key} className="space-y-1.5">
                          <Label>{label}</Label>
                          <Input value={active[key] || ""} onChange={setA(key)} onBlur={() => update(key, active[key])} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label>Social Media</Label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[["Instagram", "instagram_url"], ["TikTok", "tiktok_url"], ["Facebook", "facebook_url"], ["X (Twitter)", "twitter_url"], ["YouTube", "youtube_url"], ["Threads", "threads_url"], ["Snapchat", "snapchat_url"], ["Telegram", "telegram_url"], ["Twitch", "twitch_url"], ["LinkedIn", "linkedin_url"], ["Pinterest", "pinterest_url"], ["Spotify", "spotify_url"], ["Apple Music", "apple_music_url"], ["Audiomack", "audiomack_url"], ["SoundCloud", "soundcloud_url"], ["Boomplay", "boomplay_url"], ["Deezer", "deezer_url"], ["Bandcamp", "bandcamp_url"], ["Mixcloud", "mixcloud_url"], ["Website", "website_url"]].map(([label, key]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                            <Input placeholder={label} value={active[key] || ""} onChange={setA(key)} className="h-8 text-xs" onBlur={() => update(key, active[key])} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing">
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[["Performance Fee (₦)", "performance_fee"], ["Feature Verse (₦)", "feature_price"], ["Collaboration (₦)", "collaboration_price"], ["Songwriting (₦)", "songwriting_price"], ["Studio Session (₦)", "studio_session_price"], ["Music Video (₦)", "music_video_price"]].map(([label, key]) => (
                        <div key={key} className="space-y-1.5">
                          <Label>{label}</Label>
                          <Input type="number" value={active[key] || ""} onChange={setA(key)} onBlur={() => update(key, Number(active[key]) || 0)} />
                          {active[key] > 0 && (
                            <div className="flex gap-4 text-xs">
                              <span className="text-muted-foreground">₦{Number(active[key]).toLocaleString()}</span>
                              <span className="text-green-500">${ngnToUsd(active[key])}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Services (comma-separated)</Label>
                      <Input value={(active.services || []).join(", ")} onChange={e => setActive({ ...active, services: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                        onBlur={() => update("services", active.services)} />
                      <p className="text-xs text-muted-foreground">live_performance, feature, collaboration, songwriting, brand_ambassador, event_appearance, studio_session, voice_over</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bio">
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                    <div className="space-y-1.5"><Label>Artist Biography</Label><Textarea rows={6} value={active.bio || ""} onChange={setA("bio")} /></div>
                    <Button onClick={() => update("bio", active.bio)}>Save Bio</Button>
                  </div>
                </TabsContent>

                <TabsContent value="availability">
                  <AvailabilityManager artist={active} />
                </TabsContent>

                <TabsContent value="inquiries">
                  <InquiriesInbox artist={active} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}
    </div>
  );
}