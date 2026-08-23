import React, { useEffect, useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import StatCard from "@/components/app/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SendMoneyTab from "@/components/instant-pay/SendMoneyTab";
import ReceiveTab from "@/components/instant-pay/ReceiveTab";
import CardsTab from "@/components/instant-pay/CardsTab";
import ExchangeTab from "@/components/instant-pay/ExchangeTab";
import BillsTab from "@/components/instant-pay/BillsTab";
import BeneficiariesTab from "@/components/instant-pay/BeneficiariesTab";
import HistoryTab from "@/components/instant-pay/HistoryTab";
import { money } from "@/lib/format";

export default function InstantPay() {
  const [txns, setTxns] = useState([]);
  const load = () => xedruo.entities.WalletTransaction.list("-created_date", 60).then(setTxns);
  useEffect(() => { load(); }, []);

  const balance = txns.reduce((a, t) => a + (t.type === "credit" ? 1 : -1) * (t.amount || 0), 0);
  const income = txns.filter(t => t.type === "credit").reduce((a, t) => a + t.amount, 0);
  const expenses = txns.filter(t => t.type === "debit").reduce((a, t) => a + t.amount, 0);
  const recent = txns.slice(0, 6);

  return (
    <div>
      <PageHeader title="Xedruo Instant Pay" subtitle="Digital banking built for creators and businesses." />

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="receive">Receive</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="exchange">Exchange</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="rounded-2xl bg-primary text-primary-foreground p-7 mb-6 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
            <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-1">
              <Wallet className="w-4 h-4" />Total Balance
            </div>
            <div className="text-4xl font-bold">{money(balance)}</div>
            <div className="text-primary-foreground/60 text-sm mt-1">Xedruo Microfinance Bank · 8104 4295 83</div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 mb-8">
            <StatCard icon={ArrowDownLeft} label="Total Income" value={money(income)} />
            <StatCard icon={ArrowUpRight} label="Total Expenses" value={money(expenses)} />
            <StatCard icon={TrendingUp} label="Net Balance" value={money(income - expenses)} />
          </div>

          <h3 className="font-semibold mb-3">Recent Transactions</h3>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {recent.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet.</div>}
            {recent.map((t) => (
              <div key={t.id} className="p-4 flex items-center gap-3">
                <span className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 ${t.type === "credit" ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-600"}`}>
                  {t.type === "credit" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">{t.description || t.category}</div>
                  <div className="text-xs text-muted-foreground capitalize">{t.category?.replace(/_/g, " ")}</div>
                </div>
                <span className={`font-semibold text-sm ${t.type === "credit" ? "text-green-600" : ""}`}>
                  {t.type === "credit" ? "+" : "-"}{money(t.amount, t.currency)}
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="send"><SendMoneyTab onSent={load} /></TabsContent>
        <TabsContent value="receive"><ReceiveTab /></TabsContent>
        <TabsContent value="cards"><CardsTab /></TabsContent>
        <TabsContent value="exchange"><ExchangeTab /></TabsContent>
        <TabsContent value="bills"><BillsTab onPaid={load} /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
        <TabsContent value="beneficiaries"><BeneficiariesTab /></TabsContent>
      </Tabs>
    </div>
  );
}