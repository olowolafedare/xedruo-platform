import React from "react";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import PlanCard from "@/components/app/PlanCard";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">Simple, creator-first pricing</h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Distribution plans billed annually. Keep 100% of your royalties on every plan.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <PlanCard name="Artist" price="₦30,000/yr" cta="Get started" features={["Unlimited uploads", "Unlimited releases", "100% royalties", "Analytics", "Smart Links", "Fast approval"]} />
          <PlanCard name="Pro" price="₦80,000/yr" highlight cta="Get started" features={["Everything in Artist", "Publishing", "Sync licensing", "YouTube Content ID", "Priority support"]} />
          <PlanCard name="Label" price="₦150,000/yr" cta="Contact sales" features={["Unlimited artists", "Unlimited releases", "Team members", "Advanced analytics", "Dedicated support"]} />
        </div>
      </section>
      <Footer />
    </div>
  );
}