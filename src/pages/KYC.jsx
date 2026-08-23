import React, { useEffect, useState } from "react";
import { Shield, CheckCircle2, Clock, AlertCircle, Upload, Smartphone, KeyRound, History } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const DOC_TYPES = ["bvn", "nin", "passport", "drivers_license", "utility_bill", "cac", "tin"];
const statusColor = { approved: "bg-green-500/15 text-green-600", pending: "bg-amber-500/15 text-amber-600", rejected: "bg-red-500/15 text-red-600" };
const statusIcon = { approved: CheckCircle2, pending: Clock, rejected: AlertCircle };

export default function KYC() {
  const [docs, setDocs] = useState([]);
  const [type, setType] = useState("nin");
  const [saving, setSaving] = useState(false);
  const [twoFa, setTwoFa] = useState(false);

  const load = () => xedruo.entities.KycDocument.list("-created_date", 20).then(setDocs);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await xedruo.entities.KycDocument.create({ type, status: "pending" });
    setSaving(false); load();
  };

  const level = docs.filter(d => d.status === "approved").length;
  const kycLevel = level === 0 ? "Unverified" : level === 1 ? "Basic" : level >= 2 ? "Verified" : "Basic";

  const loginHistory = [
    { device: "Chrome · macOS", ip: "102.89.45.12", location: "Lagos, Nigeria", date: "Today, 09:41 AM", current: true },
    { device: "Safari · iPhone 15", ip: "102.89.45.13", location: "Lagos, Nigeria", date: "Yesterday, 10:22 PM" },
    { device: "Chrome · Windows", ip: "41.58.100.23", location: "Abuja, Nigeria", date: "Jul 8, 2026" },
  ];

  return (
    <div>
      <PageHeader title="KYC & Security" subtitle="Verify your identity and protect your account." />

      <div className={`rounded-2xl p-5 mb-6 flex items-center gap-4 ${level >= 2 ? "bg-green-500/10 border border-green-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
        <Shield className={`w-8 h-8 shrink-0 ${level >= 2 ? "text-green-600" : "text-amber-600"}`} />
        <div>
          <div className="font-semibold">{kycLevel} Account</div>
          <div className="text-sm text-muted-foreground">{level >= 2 ? "Your identity is fully verified. All features are unlocked." : "Complete identity verification to unlock higher limits and all features."}</div>
        </div>
      </div>

      <Tabs defaultValue="verification">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="2fa">Two-Factor Auth</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="verification">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-4">Document Verification</h3>
              <div className="space-y-3 mb-5">
                {docs.map((d) => {
                  const Icon = statusIcon[d.status] || Clock;
                  return (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                      <Icon className={`w-5 h-5 shrink-0 ${d.status === "approved" ? "text-green-600" : d.status === "rejected" ? "text-red-600" : "text-amber-600"}`} />
                      <div className="flex-1"><div className="font-medium text-sm capitalize">{d.type?.replace(/_/g, " ")}</div></div>
                      <Badge className={`border-0 text-xs capitalize ${statusColor[d.status]}`}>{d.status}</Badge>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h4 className="font-medium">Submit a Document</h4>
                <div className="space-y-1.5"><Label>Document Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ").toUpperCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center text-sm text-muted-foreground">
                  <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />Upload document (JPG, PNG, PDF)
                </div>
                <Button type="submit" className="w-full" disabled={saving}>{saving ? "Submitting…" : "Submit for Review"}</Button>
              </form>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Verification Levels</h3>
              <div className="space-y-3">
                {[
                  { level: "Level 1 — Basic", docs: ["BVN or NIN"], limits: "₦200,000/day · ₦50,000 single", done: level >= 1 },
                  { level: "Level 2 — Standard", docs: ["Government ID (Passport / Driver's License)"], limits: "₦1,000,000/day · ₦500,000 single", done: level >= 2 },
                  { level: "Level 3 — Business", docs: ["CAC Certificate, TIN, Utility Bill"], limits: "Unlimited · custom limits", done: level >= 3 },
                ].map((v) => (
                  <div key={v.level} className={`rounded-xl border p-4 ${v.done ? "border-green-500/30 bg-green-500/5" : "border-border bg-card"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {v.done ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                      <span className="font-medium text-sm">{v.level}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Required: {v.docs.join(", ")}</div>
                    <div className="text-xs text-muted-foreground">Limits: {v.limits}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="2fa">
          <div className="max-w-md space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3"><KeyRound className="w-6 h-6 text-primary" /><h3 className="font-semibold">Authenticator App</h3></div>
              <p className="text-sm text-muted-foreground">Use an app like Google Authenticator or Authy to generate one-time codes.</p>
              {!twoFa ? (
                <Button className="w-full" onClick={() => setTwoFa(true)}>Enable 2FA</Button>
              ) : (
                <div className="space-y-3">
                  <div className="w-40 h-40 mx-auto bg-muted rounded-xl border border-dashed border-border grid place-items-center text-muted-foreground text-sm">QR Code</div>
                  <div className="space-y-1.5"><Label>Enter 6-digit code to confirm</Label><Input maxLength={6} placeholder="000000" /></div>
                  <Button className="w-full">Confirm &amp; Enable</Button>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-3"><Smartphone className="w-6 h-6 text-primary" /><h3 className="font-semibold">SMS Verification</h3></div>
              <div className="space-y-1.5"><Label>Phone Number</Label><Input type="tel" placeholder="+234 800 000 0000" /></div>
              <Button variant="outline" className="w-full">Verify Phone Number</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="devices">
          <div className="max-w-2xl space-y-3">
            {loginHistory.map((h, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                <History className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{h.device} {h.current && <Badge className="ml-2 text-xs bg-green-500/15 text-green-600 border-0">Current</Badge>}</div>
                  <div className="text-xs text-muted-foreground">{h.location} · {h.ip} · {h.date}</div>
                </div>
                {!h.current && <Button variant="outline" size="sm" className="text-destructive">Revoke</Button>}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="limits">
          <div className="max-w-2xl rounded-2xl border border-border bg-card divide-y divide-border">
            {[["Daily Transfer Limit", "₦200,000", "KYC Level 1+"], ["Single Transaction Limit", "₦50,000", "KYC Level 1+"], ["Monthly Total", "₦2,000,000", "KYC Level 2+"], ["International Transfers", "Not Available", "KYC Level 2+"], ["Crypto Transactions", "Not Available", "KYC Level 3"]].map(([k, v, req]) => (
              <div key={k} className="p-4 grid grid-cols-3 text-sm items-center gap-4">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
                <Badge variant="secondary" className="text-xs w-fit">{req}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}