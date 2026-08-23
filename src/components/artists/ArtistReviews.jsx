import React, { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function ArtistReviews({ artistId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reviewer_name: "", rating: 5, body: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await xedruo.entities.ArtistReview.filter({ artist_id: artistId }, "-created_date", 50).catch(() => []);
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [artistId]);

  const avg = reviews.length ? reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length : 0;

  const submit = async () => {
    if (!form.reviewer_name || !form.body) return;
    setSaving(true);
    try {
      await xedruo.entities.ArtistReview.create({ ...form, artist_id: artistId });
      setForm({ reviewer_name: "", rating: 5, body: "" });
      setShowForm(false);
      toast({ title: "Review submitted", description: "Thanks for your feedback!" });
      load();
    } catch {
      toast({ title: "Could not submit review", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Reviews</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{avg.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviews.length})</span>
            </div>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowForm(s => !s)}>Write a Review</Button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Your Name</Label><Input value={form.reviewer_name} onChange={e => setForm({ ...form, reviewer_name: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <div className="flex gap-1 pt-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setForm({ ...form, rating: n })}>
                    <Star className={`w-6 h-6 ${n <= form.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Review</Label><Textarea rows={3} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
          <Button onClick={submit} disabled={saving || !form.reviewer_name || !form.body}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Submit Review
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-sm">{r.reviewer_name}</div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />)}
                </div>
              </div>
              {r.title && <div className="text-sm font-medium mb-0.5">{r.title}</div>}
              <p className="text-sm text-muted-foreground">{r.body}</p>
              <div className="text-xs text-muted-foreground mt-1 capitalize">{r.reviewer_type} {r.booking_type ? `· ${r.booking_type.replace("_", " ")}` : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}