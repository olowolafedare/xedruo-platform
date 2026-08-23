import React from "react";
import { Mic, Music, Users, PenTool, Mic2, Video, Check } from "lucide-react";
import { money } from "@/lib/format";

const PRICING = [
  { key: "performance_fee", label: "Live Performance", icon: Mic, suffix: "starting from" },
  { key: "feature_price", label: "Feature Verse", icon: Music },
  { key: "collaboration_price", label: "Collaboration", icon: Users },
  { key: "songwriting_price", label: "Songwriting", icon: PenTool },
  { key: "studio_session_price", label: "Studio Session", icon: Mic2 },
  { key: "music_video_price", label: "Music Video Appearance", icon: Video },
];

const SERVICE_LABELS = {
  live_performance: "Book for Live Performance",
  feature: "Feature Artist",
  collaboration: "Collaboration",
  songwriting: "Songwriting",
  brand_ambassador: "Brand Ambassador",
  event_appearance: "Event Appearance",
  studio_session: "Studio Session",
  voice_over: "Voice Over",
};

export default function ArtistPricing({ artist }) {
  const priced = PRICING.filter(p => artist[p.key] > 0);
  const services = artist.services || [];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Pricing */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-1">Pricing</h3>
        <p className="text-xs text-muted-foreground mb-4">Service rates (local currency)</p>
        {priced.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No pricing set yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {priced.map(({ key, label, icon: Icon, suffix }) => (
              <div key={key} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                  <Icon className="w-4 h-4" />{label}
                </div>
                <div className="text-xl font-bold text-primary">{money(artist[key])}</div>
                {suffix && <div className="text-xs text-muted-foreground">{suffix}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Services */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-1">Services</h3>
        <p className="text-xs text-muted-foreground mb-4">What you can book this artist for</p>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No services listed.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {services.map(s => (
              <div key={s} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2.5 text-sm">
                <span className="w-5 h-5 rounded-full bg-green-500/15 text-green-500 grid place-items-center shrink-0"><Check className="w-3 h-3" /></span>
                {SERVICE_LABELS[s] || s}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}