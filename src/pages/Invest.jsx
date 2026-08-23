import React, { useEffect, useState } from "react";
import { TrendingUp, PieChart, DollarSign, FileText, Users, Loader2, CheckCircle2, Calculator } from "lucide-react";
import { ngnToUsd } from "@/lib/currency";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/format";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import PaymentModal from "@/components/app/PaymentModal";

const PACKAGES = [
  { amount: 100000, shares: 9, label: "Starter" },
  { amount: 200000, shares: 19, label: "Growth" },
  { amount: 500000, shares: 50, label: "Builder" },
  { amount: 1000000, shares: 105, label: "Partner" },
  { amount: 2000000, shares: 215, label: "Leader" },
  { amount: 5000000, shares: 555, label: "Director" },
  { amount: 10000000, shares: 1150, label: "Founder" },
];

const PRICE_PER_SHARE = 10526; // ~₦10,526 per share

const mockGrowth = [
  { month: "Jan", value: 100 }, { month: "Feb", value: 108 }, { month: "Mar", value: 115 },
  { month: "Apr", value: 124 }, { month: "May", value: 130 }, { month: "Jun", value: 143 },
  { month: "Jul", value: 152 }, { month: "Aug", value: 168 }, { month: "Sep", value: 179 },
  { month: "Oct", value: 195 }, { month: "Nov", value: 210 }, { month: "Dec", value: 232 },
];

function InvestContent() {
  const [investments, setInvestments] = useState([]);
  const [calcAmount, setCalcAmount] = useState("500000");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [payPkg, setPayPkg] = useState(null);

  const load = () => xedruo.entities.Investment.list("-created_date", 50).then(setInvestments);
  useEffect(() => { load(); }, []);

  const confirmInvest = async () => {
    const pkg = payPkg;
    setSaving(pkg.amount);
    await xedruo.entities.Investment.create({ shares: pkg.shares, price_per_share: PRICE_PER_SHARE, amount: pkg.amount, currency: "NGN", status: "confirmed" });
    setSaving(null); setDone(pkg.amount); load();
    setTimeout(() => setDone(null), 3000);
  };

  const totalShares = investments.reduce((a, i) => a + (i.shares || 0), 0);
  const totalInvested = investments.reduce((a, i) => a + (i.amount || 0), 0);
  const calcShares = Math.floor((Number(calcAmount) || 0) / PRICE_PER_SHARE);
  const projectedValue = Math.round(calcShares * PRICE_PER_SHARE * 1.32);

  return (
    <div>
      <PageHeader title="Xedruo Invest" subtitle="Own a piece of the platform you build your career on." />

      <Tabs defaultValue="portfolio">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="packages">Investment Packages</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard icon={DollarSign} label="Total Invested" value={money(totalInvested)} />
            <StatCard icon={PieChart} label="Your Shares" value={totalShares.toLocaleString()} />
            <StatCard icon={TrendingUp} label="Current Value" value={money(Math.round(totalShares * PRICE_PER_SHARE * 1.32))} hint="+32% est. gain" />
            <StatCard icon={Users} label="Co-investors" value="0" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-4">Portfolio Performance</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={mockGrowth}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v) => [`₦${v.toLocaleString()}`, "Value Index"]} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#colorVal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-4">Key Metrics</h3>
              <div className="space-y-4 text-sm">
                {[
                  ["Company Valuation", "₦850,000,000"],
                  ["Total Shares Issued", "80,000"],
                  ["Your Ownership", totalShares > 0 ? `${((totalShares / 80000) * 100).toFixed(3)}%` : "—"],
                  ["Dividend Yield (est.)", "8.5% annually"],
                  ["Last Valuation Date", "July 2026"],
                  ["Voting Rights", totalShares >= 50 ? "✓ Active" : "Requires 50+ shares"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h3 className="font-semibold mb-3">Investment History</h3>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {investments.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No investments yet. Choose a package to get started.</div>}
            {investments.map((i) => (
              <div key={i.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center text-primary font-bold">{i.shares}</div>
                <div className="flex-1">
                  <div className="font-medium">{i.shares} shares</div>
                  <div className="text-sm text-muted-foreground">{new Date(i.created_date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{money(i.amount, i.currency)}</div>
                  <div className="text-xs text-green-600">+32% est. gain</div>
                </div>
                <Badge variant="secondary" className="capitalize">{i.status}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="packages">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {PACKAGES.map((pkg) => (
              <div key={pkg.amount} className={`rounded-2xl border-2 bg-card p-5 flex flex-col gap-3 transition-all ${selected === pkg.amount ? "border-primary shadow-lg shadow-primary/10" : "border-border"}`} onClick={() => setSelected(pkg.amount)}>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-lg">{pkg.label}</span>
                  {pkg.label === "Partner" && <Badge className="bg-primary text-primary-foreground text-xs">Popular</Badge>}
                </div>
                <div className="text-2xl font-bold">{money(pkg.amount)}</div>
                <div className="text-sm text-green-500">≈ ${ngnToUsd(pkg.amount)} USD</div>
                <div className="text-sm text-muted-foreground">{pkg.shares} shares · ≈{((pkg.shares / 80000) * 100).toFixed(3)}% equity · ₦{PRICE_PER_SHARE.toLocaleString()}/share</div>
                <ul className="text-sm text-muted-foreground space-y-1.5 flex-1">
                  <li>✓ Share certificate</li>
                  <li>✓ Dividend reports</li>
                  {pkg.shares >= 50 && <li>✓ Voting rights</li>}
                  {pkg.shares >= 215 && <li>✓ Quarterly calls</li>}
                  {pkg.shares >= 555 && <li>✓ Board observer rights</li>}
                </ul>
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>🇳🇬 NGN: <span className="font-semibold text-foreground">₦{pkg.amount.toLocaleString()}</span></div>
                  <div>🌍 USD: <span className="font-semibold text-foreground">${ngnToUsd(pkg.amount)}</span></div>
                </div>
                <Button className="w-full mt-2" onClick={() => { setSelected(pkg.amount); setPayPkg(pkg); }} disabled={saving === pkg.amount}>
                  {saving === pkg.amount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : done === pkg.amount ? <CheckCircle2 className="w-4 h-4 mr-2" /> : null}
                  {saving === pkg.amount ? "Processing…" : done === pkg.amount ? "Invested!" : "Invest Now"}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calculator">
          <div className="max-w-lg">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
              <div className="flex items-center gap-2 mb-2"><Calculator className="w-5 h-5 text-primary" /><h3 className="font-semibold">Investment Calculator</h3></div>
              <div className="space-y-1.5">
                <Label>Investment Amount (₦)</Label>
                <Input type="number" value={calcAmount} onChange={(e) => setCalcAmount(e.target.value)} />
              </div>
              <div className="bg-muted rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Shares received</span><span className="font-semibold">{calcShares.toLocaleString()} shares</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ownership stake</span><span className="font-semibold">{((calcShares / 80000) * 100).toFixed(4)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Est. value in 12 months (+32%)</span><span className="font-semibold text-green-600">{money(projectedValue)}</span></div>
                <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Est. ROI</span><span className="font-semibold text-green-600">+{money(projectedValue - (Number(calcAmount) || 0))}</span></div>
              </div>
              <p className="text-xs text-muted-foreground">Projections are estimates only. Past performance does not guarantee future results.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="max-w-2xl space-y-3">
            {[
              { name: "Share Certificate", date: investments.length > 0 ? new Date(investments[0]?.created_date).toLocaleDateString() : "—", available: investments.length > 0 },
              { name: "Shareholders Agreement", date: "Jan 2026", available: true },
              { name: "Memorandum & Articles", date: "Jan 2026", available: true },
              { name: "Company Valuation Report (Q2 2026)", date: "Jun 2026", available: true },
              { name: "Dividend Statement", date: "—", available: investments.length > 0 },
              { name: "Tax Document (2025)", date: "Feb 2026", available: true },
            ].map((doc) => (
              <div key={doc.name} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 grid place-items-center"><FileText className="w-4 h-4 text-primary" /></div>
                  <div>
                    <div className="font-medium text-sm">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">{doc.date}</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled={!doc.available}>
                  {doc.available ? "Download" : "Pending Investment"}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="announcements">
          <div className="max-w-2xl space-y-4">
            {[
              { title: "Q2 2026 Valuation Update", date: "Jun 30, 2026", body: "Xedruo's valuation has been updated to ₦850M following strong revenue growth in Q2. Streaming royalty processing grew 340% YoY." },
              { title: "Dividend Announcement – H1 2026", date: "Jun 15, 2026", body: "A dividend of ₦450 per share has been declared for H1 2026. Payments will be processed to all shareholders before July 31, 2026." },
              { title: "New Product Launch: Xedruo AI", date: "May 20, 2026", body: "We have launched Xedruo AI — an integrated AI assistant for creators. This is expected to increase user retention significantly." },
              { title: "Series A Fundraise Complete", date: "Mar 1, 2026", body: "We successfully closed our Series A round. Existing investor equity has been preserved with full anti-dilution protection." },
            ].map((a) => (
              <div key={a.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="font-semibold">{a.title}</h4>
                  <span className="text-xs text-muted-foreground shrink-0">{a.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PaymentModal
        open={!!payPkg}
        onClose={() => setPayPkg(null)}
        item={payPkg ? {
          name: `${payPkg.label} Investment Package`,
          price: `₦${payPkg.amount.toLocaleString()}`,
          amount: payPkg.amount,
          subtitle: `${payPkg.shares} shares · equity stake`,
          category: "subscription",
          successMessage: `You now own ${payPkg.shares} Xedruo shares. Welcome to the family!`,
        } : null}
        onSuccess={confirmInvest}
      />
    </div>
  );
}

export default function Invest() {
  return <InvestContent />;
}