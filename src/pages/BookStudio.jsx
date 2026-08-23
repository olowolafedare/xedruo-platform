import React, { useState } from "react";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Mic, Music, Calendar, Globe } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { xedruo } from "@/api/xedruoClient";
import PaymentModal from "@/components/app/PaymentModal";

const services = [
  {
    id: "studio",
    icon: <Mic className="w-7 h-7 text-blue-400" />,
    title: "Book a Studio Session",
    desc: "Professional recording studio with top-tier equipment and in-house engineers.",
    localPrice: "₦150,000",
    intlPrice: "$115",
    priceNote: "per session",
    features: ["Full-day studio access", "In-house sound engineer", "Pro recording equipment", "Mixing console & vocal booth"],
  },
  {
    id: "mixing",
    icon: <Music className="w-7 h-7 text-green-400" />,
    title: "Mix & Mastering",
    desc: "Industry-standard mixing and mastering to make your music radio-ready.",
    localPrice: "₦50,000",
    intlPrice: "$39",
    priceNote: "per track",
    features: ["Professional mixing", "Mastering for all platforms", "Stem separation", "2 free revisions"],
  },
];

export default function BookStudio() {
  const [selected, setSelected] = useState(null);
  const [currency, setCurrency] = useState("local");
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [pendingForm, setPendingForm] = useState(null);
  const { toast } = useToast();

  const selectedService = services.find(s => s.id === selected);
  const paymentItem = selectedService ? {
    name: selectedService.title,
    price: currency === "local" ? selectedService.localPrice : selectedService.intlPrice,
    amount: selected === "studio" ? 150000 : 50000,
    subtitle: selectedService.priceNote,
    category: "payment_link",
    successMessage: "Booking confirmed! Our team will contact you shortly.",
  } : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) { toast({ title: "Please select a service first.", variant: "destructive" }); return; }
    setPendingForm({ ...form });
    setPayOpen(true);
  };

  const confirmBooking = async () => {
    setLoading(true);
    await xedruo.entities.StudioBooking.create({
      service: selected,
      name: pendingForm?.name || form.name,
      email: pendingForm?.email || form.email,
      phone: pendingForm?.phone || form.phone,
      date: pendingForm?.date || form.date,
      notes: pendingForm?.notes || form.notes,
      status: "pending",
    }).catch(() => {});
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/15 grid place-items-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Booking Received!</h2>
        <p className="text-muted-foreground max-w-sm">Your {selected === "studio" ? "studio session" : "mix & mastering"} booking has been submitted. Our team will reach out to confirm your slot.</p>
        <Button onClick={() => { setSubmitted(false); setSelected(null); setForm({ name: "", email: "", phone: "", date: "", notes: "" }); }}>
          Book Another
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Studio & Production" subtitle="Book a studio session or get professional mix & mastering for your music." />

      {/* Currency Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Pay in:</span>
        <div className="flex rounded-lg overflow-hidden border border-border">
          <button
            onClick={() => setCurrency("local")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${currency === "local" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            🇳🇬 NGN
          </button>
          <button
            onClick={() => setCurrency("intl")}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${currency === "intl" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            🌍 USD
          </button>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className={`text-left rounded-2xl p-6 border-2 transition-all ${selected === s.id ? "border-blue-500 shadow-lg shadow-blue-500/10" : "border-border hover:border-blue-500/40"}`}
            style={{ background: selected === s.id ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.04)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl grid place-items-center" style={{ background: "rgba(255,255,255,0.07)" }}>
                {s.icon}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{s.title}</h3>
                <div className="text-xl font-black text-blue-400">
                  {currency === "local" ? s.localPrice : s.intlPrice}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{s.priceNote}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {currency === "local" ? `≈ ${s.intlPrice} USD` : `≈ ${s.localPrice} NGN`}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
            <ul className="space-y-1.5">
              {s.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />{f}
                </li>
              ))}
            </ul>
            {selected === s.id && (
              <div className="mt-4 text-xs font-semibold text-blue-400 flex items-center gap-1">✓ Selected</div>
            )}
          </button>
        ))}
      </div>

      {/* Booking Form */}
      <div className="rounded-2xl p-6 border border-border" style={{ background: "rgba(255,255,255,0.04)" }}>
        <h3 className="font-bold text-white text-lg mb-5 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" /> Book Your Slot
        </h3>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label>Phone Number</Label>
            <Input placeholder="+234..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label>Preferred Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label>Additional Notes</Label>
            <Textarea placeholder="Genre, number of tracks, special requirements..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
              {loading ? "Submitting..." : "Proceed to Payment"}
            </Button>
          </div>
        </form>
      </div>

      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        item={paymentItem}
        onSuccess={confirmBooking}
      />
    </div>
  );
}