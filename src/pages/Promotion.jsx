import React, { useState } from "react";
import { CheckCircle2, MessageCircle, Globe, MapPin } from "lucide-react";
import { ngnToUsd } from "@/lib/currency";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { xedruo } from "@/api/xedruoClient";
import { motion } from "framer-motion";
import PaymentModal from "@/components/app/PaymentModal";

const ngPackages = [
  {
    id: "starter",
    name: "Starter",
    price: "₦100,000",
    ngn: 100000,
    duration: "7-day campaign",
    popular: false,
    features: [
      "Social media promotion",
      "Artist branding",
      "Basic digital marketing",
      "Campaign report",
    ],
  },
  {
    id: "street_favorite",
    name: "Street Favorite",
    price: "₦300,000",
    ngn: 300000,
    duration: "14-day campaign",
    popular: false,
    features: [
      "Spotify promotion",
      "TikTok promotion",
      "Instagram promotion",
      "Playlist pitching",
      "Campaign report",
    ],
  },
  {
    id: "recognized_artist",
    name: "Recognized Artist",
    price: "₦700,000",
    ngn: 700000,
    duration: "30-day campaign",
    popular: true,
    features: [
      "Spotify campaign",
      "Apple Music campaign",
      "TikTok promotion",
      "YouTube campaign",
      "Influencer marketing",
      "Press release",
      "Full campaign report",
    ],
  },
  {
    id: "top_chart",
    name: "Top Nigeria Chart",
    price: "₦2,500,000",
    ngn: 2500000,
    duration: "30–60 day campaign",
    popular: false,
    features: [
      "Spotify + Apple Music campaign",
      "YouTube campaign",
      "TikTok campaign",
      "Instagram & Facebook Ads",
      "National influencer campaign",
      "Media coverage",
      "Full campaign report",
    ],
  },
];

const intPackages = [
  {
    id: "int_starter",
    name: "Global Starter",
    price: "$199",
    usd: 199,
    duration: "7-day campaign",
    popular: false,
    features: [
      "Global social media promotion",
      "Artist branding package",
      "Basic digital marketing",
      "Campaign analytics report",
    ],
  },
  {
    id: "int_rising",
    name: "Rising Global",
    price: "$499",
    usd: 499,
    duration: "14-day campaign",
    popular: false,
    features: [
      "Spotify global pitching",
      "TikTok international promotion",
      "Instagram worldwide promotion",
      "Playlist placement (global)",
      "Campaign analytics report",
    ],
  },
  {
    id: "int_recognized",
    name: "International Artist",
    price: "$1,200",
    usd: 1200,
    duration: "30-day campaign",
    popular: true,
    features: [
      "Spotify & Apple Music global campaign",
      "TikTok + YouTube campaign",
      "International influencer marketing",
      "Press release (global outlets)",
      "Instagram & Facebook Ads",
      "Full analytics + ROI report",
    ],
  },
  {
    id: "int_top_chart",
    name: "Global Chart Campaign",
    price: "$4,500",
    usd: 4500,
    duration: "30–60 day campaign",
    popular: false,
    features: [
      "Spotify, Apple Music, Amazon Music",
      "YouTube + TikTok full campaign",
      "Global Instagram & Facebook Ads",
      "International influencer network",
      "Billboard / media coverage",
      "Radio airplay pitching",
      "Full campaign report + strategy",
    ],
  },
];

function PackageGrid({ packages }) {
  const [selectedPkg, setSelectedPkg] = useState(null);

  const handleSuccess = async () => {
    if (!selectedPkg) return;
    await xedruo.entities.Campaign.create({
      name: `${selectedPkg.name} Campaign`,
      package: selectedPkg.id.replace("int_", "").replace("recognized", "recognized_artist").replace("rising", "street_favorite"),
      status: "active",
    }).catch(() => {});
    setSelectedPkg(null);
  };

  const modalPlan = selectedPkg ? {
    name: selectedPkg.name,
    price: selectedPkg.price,
    amount: selectedPkg.ngn || (selectedPkg.usd ? selectedPkg.usd * 1300 : 0),
  } : null;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {packages.map((pkg, i) => (
          <motion.div key={pkg.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`relative rounded-2xl border-2 bg-card p-6 flex flex-col ${pkg.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`}>
            {pkg.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-4">Most Popular</Badge>
            )}
            <div className="mb-5">
              <h3 className="font-bold text-lg mb-1">{pkg.name}</h3>
              <div className="text-2xl font-bold text-primary">{pkg.price}</div>
              {pkg.ngn && <div className="text-sm text-green-500">≈ ${ngnToUsd(pkg.ngn)} USD</div>}
              {pkg.usd && <div className="text-sm text-blue-400">≈ ₦{(pkg.usd * 1300).toLocaleString()} NGN</div>}
              <div className="text-xs text-muted-foreground mt-1">{pkg.duration}</div>
            </div>
            <ul className="space-y-2.5 flex-1 mb-6">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button className="w-full" variant={pkg.popular ? "default" : "outline"} onClick={() => setSelectedPkg(pkg)}>
              Order Now
            </Button>
          </motion.div>
        ))}
      </div>

      <PaymentModal
        open={!!selectedPkg}
        onClose={() => setSelectedPkg(null)}
        plan={modalPlan}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export default function Promotion() {
  return (
    <div>
      <PageHeader
        title="Xedruo Promotion"
        subtitle="Professional music promotion campaigns tailored for African and global audiences."
      />

      <Tabs defaultValue="nigeria">
        <TabsList className="mb-8">
          <TabsTrigger value="nigeria" className="gap-2"><MapPin className="w-3.5 h-3.5" /> Nigeria</TabsTrigger>
          <TabsTrigger value="international" className="gap-2"><Globe className="w-3.5 h-3.5" /> International</TabsTrigger>
        </TabsList>

        <TabsContent value="nigeria">
          <PackageGrid packages={ngPackages} />
        </TabsContent>

        <TabsContent value="international">
          <PackageGrid packages={intPackages} />
        </TabsContent>
      </Tabs>

      {/* WhatsApp contact */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold mb-1">Have questions about a campaign?</h3>
          <p className="text-sm text-muted-foreground">Our promotion team is available to help you choose the right package.</p>
        </div>
        <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-2 shrink-0">
            <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}