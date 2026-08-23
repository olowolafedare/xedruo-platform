import React, { useState, useEffect } from "react";
import { xedruo } from "@/api/xedruoClient";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, RefreshCw, Lock } from "lucide-react";
import PageHeader from "@/components/app/PageHeader";

// Simple CSV-to-Excel (TSV) export — opens in Excel natively
function exportToExcel(filename, headers, rows) {
  const BOM = "\uFEFF";
  const tsv = [
    headers.join("\t"),
    ...rows.map(r => r.map(cell => (cell === null || cell === undefined ? "" : String(cell).replace(/\t/g, " "))).join("\t")),
  ].join("\n");
  const blob = new Blob([BOM + tsv], { type: "text/tab-separated-values;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function filterThisWeek(items, dateField = "created_date") {
  const { monday, sunday } = getWeekRange();
  return items.filter(item => {
    const d = new Date(item[dateField]);
    return d >= monday && d <= sunday;
  });
}

function weekLabel() {
  const { monday, sunday } = getWeekRange();
  const fmt = d => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

const REPORTS = [
  {
    id: "royalties",
    label: "Royalty Statements",
    color: "bg-purple-500/10 text-purple-600",
    entity: "RoyaltyStatement",
    headers: ["ID", "Period", "Type", "Amount", "Currency", "Status", "Streams", "Songs", "Artist Share", "Producer Share", "Xedruo Share", "Created Date"],
    rowFn: r => [r.id, r.period, r.type, r.amount, r.currency, r.status, r.streams, r.songs, r.artist_share, r.producer_share, r.xedruo_share, r.created_date],
  },
  {
    id: "wallet",
    label: "Wallet Transactions",
    color: "bg-green-500/10 text-green-600",
    entity: "WalletTransaction",
    headers: ["ID", "Description", "Type", "Amount", "Currency", "Category", "Status", "Artist Share", "Producer Share", "Xedruo Share", "Linked Release", "Linked Event", "Created Date"],
    rowFn: r => [r.id, r.description, r.type, r.amount, r.currency, r.category, r.status, r.artist_share, r.producer_share, r.xedruo_share, r.linked_release_id, r.linked_event_id, r.created_date],
  },
  {
    id: "tickets",
    label: "Ticket Sales",
    color: "bg-blue-500/10 text-blue-600",
    entity: "TicketPurchase",
    headers: ["ID", "Event ID", "Event Title", "Event Date", "Venue", "Ticket Type", "Quantity", "Amount Paid", "Currency", "Buyer Name", "Buyer Email", "Buyer Phone", "Payment Status", "Ticket Number", "Artist Share", "Producer Share", "Xedruo Share", "Created Date"],
    rowFn: r => [r.id, r.event_id, r.event_title, r.event_date, r.venue, r.ticket_type, r.quantity, r.amount_paid, r.currency, r.buyer_name, r.buyer_email, r.buyer_phone, r.payment_status, r.ticket_number, r.artist_share, r.producer_share, r.xedruo_share, r.created_date],
  },
  {
    id: "orders",
    label: "Store Orders",
    color: "bg-amber-500/10 text-amber-600",
    entity: "Order",
    headers: ["ID", "Product ID", "Product Name", "Product Type", "Amount", "Currency", "Status", "Buyer Name", "Buyer Email", "Payment Method", "Created Date"],
    rowFn: r => [r.id, r.product_id, r.product_name, r.product_type, r.amount, r.currency, r.status, r.buyer_name, r.buyer_email, r.payment_method, r.created_date],
  },
  {
    id: "beats",
    label: "Beat Sales",
    color: "bg-pink-500/10 text-pink-600",
    entity: "Beat",
    headers: ["ID", "Title", "Producer", "Genre", "Mood", "BPM", "Key", "License", "Price", "Exclusive Price", "Sales", "Created Date"],
    rowFn: r => [r.id, r.title, r.producer, r.genre, r.mood, r.bpm, r.key, r.license, r.price, r.exclusive_price, r.sales, r.created_date],
  },
];

export default function AdminReports() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    xedruo.auth.me().then(u => setUser(u)).catch(() => setUser(null));
  }, []);

  const load = async () => {
    setLoading(true);
    const results = await Promise.all(
      REPORTS.map(r => xedruo.entities[r.entity].list("-created_date", 500).catch(() => []))
    );
    const map = {};
    REPORTS.forEach((r, i) => { map[r.id] = results[i]; });
    setData(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDownload = (report) => {
    setDownloading(report.id);
    const allRows = data[report.id] || [];
    const weekRows = filterThisWeek(allRows);
    const week = weekLabel().replace(/\s–\s/, "_to_").replace(/\s/g, "_");
    exportToExcel(
      `Xedruo_${report.label.replace(/\s/g, "_")}_Week_${week}.xls`,
      report.headers,
      weekRows.map(report.rowFn)
    );
    setTimeout(() => setDownloading(null), 800);
  };

  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Lock className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-muted-foreground">This area is for administrators only.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="📊 Admin Reports"
        subtitle={`Weekly revenue exports for accountants — Week: ${weekLabel()}`}
        action={
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(report => {
          const allRows = data[report.id] || [];
          const weekRows = filterThisWeek(allRows);
          return (
            <div key={report.id} className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${report.color.split(" ")[0]} grid place-items-center shrink-0`}>
                  <FileSpreadsheet className={`w-5 h-5 ${report.color.split(" ")[1]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{report.label}</h3>
                  <p className="text-xs text-muted-foreground">This week: {loading ? "…" : weekRows.length} records</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <div>
                  <div className="text-xs text-muted-foreground">Total records (all time)</div>
                  <div className="font-bold text-lg">{loading ? "—" : allRows.length}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">This week</div>
                  <div className="font-bold text-lg text-primary">{loading ? "—" : weekRows.length}</div>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                disabled={loading || downloading === report.id || weekRows.length === 0}
                onClick={() => handleDownload(report)}
              >
                <Download className="w-4 h-4" />
                {downloading === report.id ? "Downloading…" : weekRows.length === 0 ? "No data this week" : "Download Excel (.xls)"}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Files download as .xls (tab-separated) — opens directly in Microsoft Excel, Google Sheets, and LibreOffice.
      </p>
    </div>
  );
}