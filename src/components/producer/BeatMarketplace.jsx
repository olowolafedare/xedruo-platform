import React, { useState, useMemo } from "react";
import { Music, ShoppingCart, Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/format";

const GENRES = ["Afrobeats", "Amapiano", "Hip-Hop", "R&B", "Trap", "Gospel", "Pop", "Drill", "Highlife", "Reggae"];
const MOODS = ["Dark", "Uplifting", "Energetic", "Chill", "Romantic", "Motivational", "Melancholic", "Party"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BPM_RANGES = [
  { label: "Any", min: 0, max: 999 },
  { label: "Slow (< 80)", min: 0, max: 79 },
  { label: "Mid (80–120)", min: 80, max: 120 },
  { label: "Fast (121–160)", min: 121, max: 160 },
  { label: "Very Fast (160+)", min: 161, max: 999 },
];

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
        active ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export default function BeatMarketplace({ beats, onBuy }) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [key, setKey] = useState("");
  const [bpmRange, setBpmRange] = useState(BPM_RANGES[0]);
  const [showFilters, setShowFilters] = useState(true);

  const clearAll = () => { setSearch(""); setGenre(""); setMood(""); setKey(""); setBpmRange(BPM_RANGES[0]); };
  const hasFilters = search || genre || mood || key || bpmRange.label !== "Any";

  const filtered = useMemo(() => {
    return beats.filter((b) => {
      if (search && !b.title?.toLowerCase().includes(search.toLowerCase()) && !b.producer?.toLowerCase().includes(search.toLowerCase())) return false;
      if (genre && b.genre?.toLowerCase() !== genre.toLowerCase()) return false;
      if (mood && b.mood?.toLowerCase() !== mood.toLowerCase()) return false;
      if (key && b.key !== key) return false;
      if (bpmRange.label !== "Any" && b.bpm != null) {
        if (b.bpm < bpmRange.min || b.bpm > bpmRange.max) return false;
      }
      return true;
    });
  }, [beats, search, genre, mood, key, bpmRange]);

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search beats by title or producer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className={showFilters ? "border-primary text-primary" : ""}>
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
            <X className="w-4 h-4 mr-1" />Clear
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-2xl border border-border bg-card p-4 mb-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Genre</p>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip label="Any" active={!genre} onClick={() => setGenre("")} />
              {GENRES.map((g) => <FilterChip key={g} label={g} active={genre === g} onClick={() => setGenre(genre === g ? "" : g)} />)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mood</p>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip label="Any" active={!mood} onClick={() => setMood("")} />
              {MOODS.map((m) => <FilterChip key={m} label={m} active={mood === m} onClick={() => setMood(mood === m ? "" : m)} />)}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">BPM</p>
              <div className="flex flex-wrap gap-1.5">
                {BPM_RANGES.map((r) => <FilterChip key={r.label} label={r.label} active={bpmRange.label === r.label} onClick={() => setBpmRange(r)} />)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key</p>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip label="Any" active={!key} onClick={() => setKey("")} />
                {KEYS.map((k) => <FilterChip key={k} label={k} active={key === k} onClick={() => setKey(key === k ? "" : k)} />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 mb-4 items-center">
          <span className="text-xs text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          {genre && <Badge variant="secondary" className="gap-1">{genre} <X className="w-3 h-3 cursor-pointer" onClick={() => setGenre("")} /></Badge>}
          {mood && <Badge variant="secondary" className="gap-1">{mood} <X className="w-3 h-3 cursor-pointer" onClick={() => setMood("")} /></Badge>}
          {key && <Badge variant="secondary" className="gap-1">Key: {key} <X className="w-3 h-3 cursor-pointer" onClick={() => setKey("")} /></Badge>}
          {bpmRange.label !== "Any" && <Badge variant="secondary" className="gap-1">{bpmRange.label} <X className="w-3 h-3 cursor-pointer" onClick={() => setBpmRange(BPM_RANGES[0])} /></Badge>}
        </div>
      )}

      {/* Beat grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="col-span-full p-10 text-center text-sm text-muted-foreground rounded-2xl border border-border bg-card">
            <Music className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            No beats match your filters. Try adjusting your search.
          </div>
        )}
        {filtered.map((b) => (
          <div key={b.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
            <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 grid place-items-center">
              <Music className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="font-semibold">{b.title}</div>
              <div className="text-sm text-muted-foreground">{b.producer}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {b.genre && <Badge variant="secondary" className="text-xs">{b.genre}</Badge>}
              {b.mood && <Badge variant="secondary" className="text-xs">{b.mood}</Badge>}
              {b.bpm && <Badge variant="outline" className="text-xs">{b.bpm} BPM</Badge>}
              {b.key && <Badge variant="outline" className="text-xs">Key {b.key}</Badge>}
            </div>
            <div className="flex items-center justify-between mt-auto">
              <span className="font-bold text-lg">{money(b.price)}</span>
              <Button size="sm" onClick={() => onBuy(b)}>
                <ShoppingCart className="w-4 h-4 mr-1" />Buy
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}