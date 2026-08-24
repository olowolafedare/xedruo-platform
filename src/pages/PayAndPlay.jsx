import React, { useState } from "react";
import { Link } from "react-router-dom";\nimport { xedruo, supabase } from "@/api/xedruoClient";\nimport { ensureXedruoId } from "@/lib/xedruoIdentity";
import {
  Play, Pause, Search, Heart, Ticket, Calendar, MapPin,
  ChevronLeft, ShoppingBag, Star, Download, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const artists = [
  { id: "a1", name: "Lunar Ave", genre: "Afro-Fusion", rating: 4.9, fee: 2500, img: "https://images.unsplash.com/photo-1516280440614-3795a0b8254e?w=400&q=70", monthly: 18400 },
  { id: "a2", name: "Mara Sound", genre: "Soul / R&B", rating: 4.8, fee: 3200, img: "https://images.unsplash.com/photo-1534580793956-78c2c66e9d8a?w=400&q=70", monthly: 22100 },
  { id: "a3", name: "Kobe Drift", genre: "Hip-Hop", rating: 4.7, fee: 4000, img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=70", monthly: 30900 },
  { id: "a4", name: "Nneka Blues", genre: "Blues", rating: 5.0, fee: 2800, img: "https://images.unsplash.com/photo-1483412468200-72182dc777c7?w=400&q=70", monthly: 15600 },
  { id: "a5", name: "Echo Ray", genre: "Electronic", rating: 4.6, fee: 3500, img: "https://images.unsplash.com/photo-1517087125658-9b4f6c6b5868?w=400&q=70", monthly: 27300 },
  { id: "a6", name: "Tola Vibes", genre: "Afrobeats", rating: 4.9, fee: 5000, img: "https://images.unsplash.com/photo-1504703395950-b8914a0c673e?w=400&q=70", monthly: 41200 },
];

const events = [
  { id: "e1", title: "Afro Nights Live", artist: "Tola Vibes", date: "Sep 12", venue: "Eko Convention Centre", price: 25, img: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=70" },
  { id: "e2", title: "Soul Sundown", artist: "Mara Sound", date: "Sep 20", venue: "Freedom Park", price: 18, img: "https://images.unsplash.com/photo-1501386761578-eac5c94b214a?w=600&q=70" },
  { id: "e3", title: "Electronic Garden", artist: "Echo Ray", date: "Oct 03", venue: "Muri Okunola Park", price: 32, img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=70" },
];

const merch = [
  { id: "m1", name: "Lunar Ave Tee", price: 35, img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=70" },
  { id: "m2", name: "Tola Vibes Sneakers", price: 120, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=70" },
  { id: "m3", name: "Echo Ray Tote", price: 28, img: "https://images.unsplash.com/photo-1591561954557-2694c697f3ba?w=300&q=70" },
  { id: "m4", name: "Mara Sound Belt", price: 45, img: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=300&q=70" },
];

export default function PayAndPlay() {
  const [tab, setTab] = useState("discover");
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState(null);
  const [cart, setCart] = useState([]);
  const [bookArtist, setBookArtist] = useState(null);
  const [bookEvent, setBookEvent] = useState(null);\n  const [accountNumber, setAccountNumber] = useState(null);\n  const [balance, setBalance] = useState(0);\n  const [myLoading, setMyLoading] = useState(false);

  const openMy = async () => {\n    setTab("my"); setMyLoading(true);\n    try { const result = await ensureXedruoId(); setAccountNumber(result.xedruoId); const me = await xedruo.auth.me(); const { data } = await supabase.from("wallets").select("balance").eq("user_id", me.id).maybeSingle(); setBalance(Number(data?.balance || 0)); } catch {} finally { setMyLoading(false); }\n  };\n\n  const filteredArtists = artists.filter(
    (a) => a.name.toLowerCase().includes(query.toLowerCase()) || a.genre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-background to-background text-foreground pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/company/pay-bank" className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-xl">💳</div>
          <div className="hidden sm:block">
            <div className="font-display font-bold leading-none">Pay & Play</div>
            <div className="text-[11px] text-muted-foreground">Bank · Book artists · Buy tickets</div>
          </div>
          <div className="flex-1 max-w-xs ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search artists…" className="pl-9 h-9 bg-secondary/60" />
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-2">
          {[
            { k: "discover", l: "Discover" },
            { k: "events", l: "Tickets" },
            { k: "store", l: "Store" },
            { k: "wallet", l: "Wallet" },\n            { k: "my", l: "My" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => t.k === "my" ? openMy() : setTab(t.k)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                tab === t.k ? "bg-emerald-500 text-emerald-950" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === "discover" && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-display font-bold mb-4">Featured artists</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {filteredArtists.map((a) => (
                  <div key={a.id} className="group rounded-xl bg-card border border-border overflow-hidden hover:border-emerald-500/50 transition">
                    <div className="relative aspect-square">
                      <img src={a.img} alt={a.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setPlaying(playing === a.id ? null : a.id)}
                        className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition shadow-lg"
                      >
                        {playing === a.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-sm truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.genre}</div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" /> {a.rating}
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3 h-8 bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
                        onClick={() => setBookArtist(a)}
                      >
                        Book · ${a.fee.toLocaleString()}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-display font-bold mb-4">Upcoming events</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {events.map((e) => (
                  <div key={e.id} className="rounded-xl bg-card border border-border overflow-hidden hover:border-emerald-500/50 transition">
                    <div className="relative h-40">
                      <img src={e.img} alt={e.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-3">
                        <div className="font-semibold">{e.title}</div>
                        <div className="text-xs text-white/80">{e.artist}</div>
                      </div>
                    </div>
                    <div className="p-3 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                        <Calendar className="w-3.5 h-3.5" /> {e.date} · <MapPin className="w-3.5 h-3.5" /> {e.venue}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold text-emerald-400">${e.price}</span>
                        <Button size="sm" className="h-8 bg-emerald-500 hover:bg-emerald-400 text-emerald-950" onClick={() => setBookEvent(e)}>
                          <Ticket className="w-3.5 h-3.5 mr-1" /> Buy ticket
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "events" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.concat(events).map((e, i) => (
              <div key={i} className="rounded-xl bg-card border border-border overflow-hidden">
                <img src={e.img} alt={e.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-sm text-muted-foreground">{e.artist}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <Calendar className="w-3.5 h-3.5" /> {e.date} · <MapPin className="w-3.5 h-3.5" /> {e.venue}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-emerald-400">${e.price}</span>
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950" onClick={() => setBookEvent(e)}>
                      Buy ticket
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "store" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold">Artist store</h2>
              {cart.length > 0 && (
                <span className="text-sm text-emerald-400">{cart.length} item(s) · ${cart.reduce((s, m) => s + m.price, 0)}</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {merch.map((m) => (
                <div key={m.id} className="rounded-xl bg-card border border-border overflow-hidden hover:border-emerald-500/40 transition">
                  <img src={m.img} alt={m.name} className="w-full aspect-square object-cover" />
                  <div className="p-3">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-semibold text-emerald-400">${m.price}</span>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => setCart((c) => [...c, m])}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

\n        {tab === "my" && (\n          <div className="max-w-xl mx-auto space-y-5">\n            <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-600 to-emerald-900 text-white shadow-xl">\n              <div className="text-xs opacity-80">Xedruo account</div>\n              <div className="text-3xl font-mono font-bold tracking-widest mt-2">{myLoading ? "••••••••••" : (accountNumber || "—")}</div>\n              <div className="text-xs opacity-75 mt-2">Your 10-digit Xedruo account number</div>\n              <div className="mt-6 text-xs opacity-80">Local balance</div>\n              <div className="text-4xl font-display font-bold mt-1">₦{balance.toLocaleString("en-NG", {minimumFractionDigits:2, maximumFractionDigits:2})}</div>\n            </div>\n            <div className="grid grid-cols-2 gap-3">\n              <Button className="h-12 bg-emerald-500 hover:bg-emerald-400 text-emerald-950"><Plus className="w-4 h-4 mr-2" /> Add money</Button>\n              <Button variant="outline" className="h-12">Send / Pay</Button>\n            </div>\n            <div className="rounded-2xl bg-card border border-border p-5">\n              <h3 className="font-display font-semibold">My Xedruo services</h3>\n              <p className="text-sm text-muted-foreground mt-1">One Xedruo identity works across every service and company.</p>\n            </div>\n          </div>\n        )}\n\n        {tab === "wallet" && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-600 to-emerald-800 text-emerald-50">
              <div className="text-xs opacity-80">Available balance</div>
              <div className="text-3xl font-display font-bold mt-1">$0.00</div>
              <div className="text-xs opacity-70 mt-3">Xedruo Pay/Bank · USD</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-12"><Download className="w-4 h-4 mr-2" /> Receive</Button>
              <Button className="h-12 bg-emerald-500 hover:bg-emerald-400 text-emerald-950"><ShoppingBag className="w-4 h-4 mr-2" /> Pay</Button>
            </div>
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-sm font-medium mb-2">Recent transactions</div>
              <div className="text-sm text-muted-foreground py-6 text-center">No transactions yet.</div>
            </div>
          </div>
        )}
      </main>

      {/* Now playing bar — Spotify-like */}
      {playing && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
            <img src={artists.find((a) => a.id === playing)?.img} className="w-10 h-10 rounded-md object-cover" alt="" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{artists.find((a) => a.id === playing)?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{artists.find((a) => a.id === playing)?.genre}</div>
            </div>
            <button onClick={() => setPlaying(null)} className="ml-auto w-10 h-10 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center">
              <Pause className="w-4 h-4" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground"><Heart className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* Booking modal — artist */}
      {bookArtist && (
        <BookingModal
          title={`Book ${bookArtist.name}`}
          subtitle={`${bookArtist.genre} · ${bookArtist.rating}★`}
          price={bookArtist.fee}
          onClose={() => setBookArtist(null)}
        />
      )}
      {bookEvent && (
        <BookingModal
          title={bookEvent.title}
          subtitle={`${bookEvent.artist} · ${bookEvent.date} · ${bookEvent.venue}`}
          price={bookEvent.price}
          cta="Buy ticket"
          onClose={() => setBookEvent(null)}
        />
      )}
    </div>
  );
}

function BookingModal({ title, subtitle, price, cta = "Confirm booking", onClose }) {
  const [done, setDone] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="font-display font-bold text-lg">Request received</h3>
            <p className="text-sm text-muted-foreground mt-1">We'll confirm via your Xedruo notifications. No payment has been charged — payment provider configuration is required.</p>
            <Button className="w-full mt-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <>
            <h3 className="font-display font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-4 space-y-3">
              <Input placeholder="Event date" />
              <Input placeholder="Location / venue" />
              <Input placeholder="Notes for the artist" />
            </div>
            <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-secondary/60">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-bold text-emerald-400">${price.toLocaleString()}</span>
            </div>
            <Button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950" onClick={() => setDone(true)}>
              {cta}
            </Button>
            <Button variant="ghost" className="w-full mt-2" onClick={onClose}>Cancel</Button>
          </>
        )}
      </div>
    </div>
  );
}