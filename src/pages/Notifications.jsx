import React, { useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { xedruo } from "@/api/xedruoClient";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const categoryColor = { distribution: "bg-blue-500/15 text-blue-600", promotion: "bg-purple-500/15 text-purple-600", royalty: "bg-green-500/15 text-green-600", payment: "bg-amber-500/15 text-amber-600", investment: "bg-primary/15 text-primary", system: "bg-muted text-muted-foreground", support: "bg-red-500/15 text-red-600" };
const typeIcon = { success: "✅", warning: "⚠️", error: "❌", info: "ℹ️" };

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");

  const load = () => xedruo.entities.Notification.list("-created_date", 60).then(setNotifications);
  useEffect(() => {
    load();
    const unsub = xedruo.entities.Notification.subscribe(() => load());
    return unsub;
  }, []);

  const markRead = async (id) => { await xedruo.entities.Notification.update(id, { read: true }); load(); };
  const markAllRead = async () => { for (const n of notifications.filter(n => !n.read)) await xedruo.entities.Notification.update(n.id, { read: true }); load(); };
  const remove = async (id) => { await xedruo.entities.Notification.delete(id); load(); };

  const filtered = filter === "all" ? notifications : notifications.filter(n => filter === "unread" ? !n.read : n.category === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <PageHeader title="Notification Center" subtitle="Stay updated on all activity across the platform." action={
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <Badge className="bg-primary text-primary-foreground">{unreadCount} unread</Badge>}
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}><CheckCheck className="w-4 h-4 mr-1" />Mark all read</Button>
        </div>
      } />

      <div className="flex flex-wrap gap-2 mb-5">
        {["all", "unread", "distribution", "promotion", "royalty", "payment", "investment", "support", "system"].map(cat => (
          <Button key={cat} variant={filter === cat ? "default" : "outline"} size="sm" onClick={() => setFilter(cat)} className="capitalize">{cat}</Button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground"><Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />No notifications.</div>}
        {filtered.map((n) => (
          <div key={n.id} className={`p-4 flex items-start gap-3 transition-colors ${!n.read ? "bg-primary/3" : ""}`}>
            <span className="text-xl mt-0.5 shrink-0">{typeIcon[n.type] || "ℹ️"}</span>
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-sm ${!n.read ? "" : "text-muted-foreground"}`}>{n.title}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{n.message}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge className={`border-0 text-xs capitalize ${categoryColor[n.category] || ""}`}>{n.category}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(n.created_date).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              {!n.read && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead(n.id)}><CheckCheck className="w-3.5 h-3.5" /></Button>}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(n.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}