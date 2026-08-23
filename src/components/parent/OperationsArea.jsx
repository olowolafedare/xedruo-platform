import React, { useEffect, useState } from "react";
import { xedruo } from "@/api/xedruoClient";
import CompanySelector from "./CompanySelector";
import Stat from "./Stat";
import { Activity } from "lucide-react";

export default function OperationsArea() {
  const [company, setCompany] = useState(null);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [e, b, t] = await Promise.all([
          xedruo.entities.Event.list("-created_date", 50),
          xedruo.entities.ArtistBooking.list("-created_date", 50),
          xedruo.entities.SupportTicket.list("-created_date", 50),
        ]);
        setEvents(e);
        setBookings(b);
        setTickets(t);
      } catch {}
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Operations — Company Operations
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Select a company to manage its operations.</p>
      </div>

      <CompanySelector onSelect={setCompany} selected={company} />

      {company && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Events" value={events.length} />
            <Stat label="Bookings" value={bookings.length} />
            <Stat label="Tickets" value={tickets.length} />
          </div>

          <div className="rounded-2xl bg-card border border-border p-5">
            <h3 className="font-display font-semibold mb-3">Recent events</h3>
            <div className="space-y-2">
              {events.slice(0, 6).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between text-sm border-b border-border/50 pb-2"
                >
                  <span className="truncate">{ev.title}</span>
                  <span className="text-muted-foreground shrink-0 ml-3">{ev.status}</span>
                </div>
              ))}
              {events.length === 0 && <p className="text-xs text-muted-foreground">No events.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}