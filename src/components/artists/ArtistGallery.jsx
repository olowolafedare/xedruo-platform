import React from "react";
import { Image, Play, Music2 } from "lucide-react";

export default function ArtistGallery({ artist, releases }) {
  const photos = artist.gallery_photos || [];
  const videos = artist.gallery_videos || [];
  const topSongs = [...releases].sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 5);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Gallery */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Image className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Gallery</h3>
        </div>
        {photos.length === 0 && videos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No gallery media yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {videos.map((url, i) => (
              <div key={`v${i}`} className="aspect-square rounded-lg overflow-hidden bg-muted relative grid place-items-center">
                <video src={url} className="w-full h-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-black/30"><Play className="w-6 h-6 text-white" /></span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Music */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Music2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Music</h3>
        </div>
        {topSongs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No music uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {topSongs.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
                <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 grid place-items-center text-primary text-sm font-bold shrink-0 overflow-hidden">
                  {r.artwork_url ? <img src={r.artwork_url} className="w-full h-full object-cover" alt="" /> : r.title?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground truncate capitalize">{r.type} · {(r.streams || 0).toLocaleString()} streams</div>
                </div>
                {r.audio_url && (
                  <button className="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0">
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}