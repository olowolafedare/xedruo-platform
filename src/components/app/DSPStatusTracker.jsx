import React from "react";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

const DSPS = [
  { name: "Spotify", emoji: "🎵" },
  { name: "Apple Music", emoji: "🍎" },
  { name: "Tidal", emoji: "🌊" },
  { name: "YouTube Music", emoji: "▶️" },
  { name: "Amazon Music", emoji: "📦" },
  { name: "Boomplay", emoji: "🎶" },
  { name: "Audiomack", emoji: "🎧" },
  { name: "Deezer", emoji: "🎼" },
];

function getDSPStatus(releaseStatus) {
  if (releaseStatus === "live") return "live";
  if (releaseStatus === "in_review") return "processing";
  return "pending";
}

export default function DSPStatusTracker({ release }) {
  const status = getDSPStatus(release?.status);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Distribution Status</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          status === "live" ? "bg-green-500/15 text-green-600" :
          status === "processing" ? "bg-amber-500/15 text-amber-600" :
          "bg-muted text-muted-foreground"
        }`}>
          {status === "live" ? "Live on all platforms" : status === "processing" ? "In Review" : "Pending"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DSPS.map((dsp, i) => (
          <div key={dsp.name} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border transition-all ${
            status === "live" ? "bg-green-500/5 border-green-500/20" :
            status === "processing" && i < 2 ? "bg-amber-500/5 border-amber-500/20" :
            "bg-muted/30 border-border"
          }`}>
            <span>{dsp.emoji}</span>
            <span className="flex-1 text-xs font-medium">{dsp.name}</span>
            {status === "live" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
            ) : status === "processing" && i < 2 ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}