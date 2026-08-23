import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { xedruo } from "@/api/xedruoClient";
import CompanyGrid from "@/components/CompanyGrid";
import { Bell, Search, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Ecosystem() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    xedruo.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center font-display font-bold text-primary-foreground">X</div>
            <span className="font-display font-bold text-lg tracking-tight hidden sm:block">XEDRUO</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 ml-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            One identity · Many services
          </div>
          <div className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Xedruo services…"
                className="pl-9 h-10 bg-secondary/60 border-border"
              />
            </div>
          </div>
          <button className="relative p-2 rounded-lg hover:bg-secondary transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>
          {user && (
            <Link to="/dashboard" className="flex items-center gap-2 pl-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-semibold text-primary-foreground">
                {user.full_name?.[0]?.toUpperCase() || "U"}
              </div>
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome */}
        <div className="mb-8 sm:mb-10">
          <div className="text-sm text-muted-foreground mb-1">
            {user ? `Welcome back, ${user.full_name?.split(" ")[0] || ""}` : "Welcome to Xedruo"}
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tight">
            One Xedruo. <span className="text-primary">Many possibilities.</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm sm:text-base">
            Access a growing ecosystem of services through one secure Xedruo identity.
          </p>
          {user?.xedruo_id && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary/60 border border-border px-3 py-1.5 text-xs">
              <span className="text-muted-foreground">Xedruo ID / Bank Account Number</span>
              <span className="font-mono font-semibold text-primary">{user.xedruo_id}</span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["Send", "Receive", "Book", "Buy", "Invest", "Apply", "Track", "Upload"].map((a) => (
            <span key={a} className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/70 border border-border text-muted-foreground">
              {a}
            </span>
          ))}
        </div>

        <CompanyGrid query={query} />

        <div className="mt-10 text-center">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}