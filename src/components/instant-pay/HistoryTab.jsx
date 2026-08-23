import React, { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Download, Search } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/format";

export default function HistoryTab() {
  const [txns, setTxns] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { xedruo.entities.WalletTransaction.list("-created_date", 100).then(setTxns); }, []);

  const filtered = txns.filter(t => {
    if (filter !== "all" && t.type !== filter) return false;
    if (search && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusColor = { completed: "bg-green-500/15 text-green-600", pending: "bg-amber-500/15 text-amber-600", failed: "bg-red-500/15 text-red-600" };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="credit">Money In</SelectItem>
            <SelectItem value="debit">Money Out</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="sm:ml-auto"><Download className="w-4 h-4 mr-1" />Export CSV</Button>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No transactions found.</div>}
        {filtered.map((t) => (
          <div key={t.id} className="p-4 flex items-center gap-3">
            <span className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 ${t.type === "credit" ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-600"}`}>
              {t.type === "credit" ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate text-sm">{t.description || t.category}</div>
              <div className="text-xs text-muted-foreground capitalize">{t.category?.replace(/_/g, " ")} · {new Date(t.created_date).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-2">
              {t.status && <Badge className={`border-0 text-xs capitalize ${statusColor[t.status]}`}>{t.status}</Badge>}
              <span className={`font-semibold text-sm ${t.type === "credit" ? "text-green-600" : ""}`}>
                {t.type === "credit" ? "+" : "-"}{money(t.amount, t.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}