import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Calendar, Mic, Users, MessageSquare } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import ArtistHeader from "@/components/artists/ArtistHeader";
import ArtistPricing from "@/components/artists/ArtistPricing";
import ArtistGallery from "@/components/artists/ArtistGallery";
import ArtistReviews from "@/components/artists/ArtistReviews";
import BookingDialog from "@/components/artists/BookingDialog";
import AvailabilityPicker from "@/components/artists/AvailabilityPicker";

export default function ArtistProfilePage() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const a = await xedruo.entities.ArtistProfile.get(id);
        setArtist(a);
        if (a?.name) {
          const rels = await xedruo.entities.Release.filter({ artist: a.name }, "-created_date", 20).catch(() => []);
          setReleases(rels);
        }
      } catch { setArtist(null); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!artist) return (
    <div className="text-center py-24">
      <p className="text-muted-foreground mb-4">Artist not found.</p>
      <Link to="/artist-management"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4">
        <Link to="/artist-management"><Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"><ArrowLeft className="w-4 h-4" /> Back to Artists</Button></Link>
      </div>

      <ArtistHeader artist={artist} />

      {/* Booking buttons */}
      <div className="my-5 flex flex-wrap gap-2">
        <Button onClick={() => setBooking("live_performance")} className="gap-2"><Calendar className="w-4 h-4" /> Book Artist</Button>
        <Button variant="outline" onClick={() => setBooking("feature")} className="gap-2"><Mic className="w-4 h-4" /> Request Feature</Button>
        <Button variant="outline" onClick={() => setBooking("collaboration")} className="gap-2"><Users className="w-4 h-4" /> Request Collaboration</Button>
        <Button variant="outline" onClick={() => setBooking("message")} className="gap-2"><MessageSquare className="w-4 h-4" /> Message Artist</Button>
      </div>

      <div className="space-y-5">
        <AvailabilityPicker artist={artist} />
        <ArtistPricing artist={artist} />
        <ArtistGallery artist={artist} releases={releases} />
        <ArtistReviews artistId={artist.id} />
      </div>

      {booking && <BookingDialog artist={artist} type={booking} open={!!booking} onClose={() => setBooking(null)} />}
    </div>
  );
}