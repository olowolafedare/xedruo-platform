import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, LayoutGrid, LogOut, Bell, Shield, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { xedruo } from "@/api/xedruoClient";

const publicLinks = [
  { label: "Pricing", to: "/pricing" },
  { label: "Support", to: "/support" },
];

const userMenuItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutGrid },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "KYC & Security", to: "/kyc", icon: Shield },
  { label: "Help Center", to: "/support", icon: LifeBuoy },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropRef = useRef(null);

  useEffect(() => {
    xedruo.auth.isAuthenticated().then((yes) => {
      if (yes) xedruo.auth.me().then(setUser).catch(() => {});
    });
  }, []);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const logout = () => { xedruo.auth.logout("/"); };

  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const initials = firstName[0]?.toUpperCase() || "U";

  return (
    <header className="top-0 z-50" style={{ background: "transparent" }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {publicLinks.map((l) => (
            <Link key={l.to} to={l.to} className="px-3 py-2 text-sm text-gray-300 hover:text-white rounded-md transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
                  {initials}
                </div>
                <span className="text-sm font-medium">👋 {firstName}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              {dropOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-popover shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-sm font-semibold">{user?.full_name || firstName}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  </div>
                  {userMenuItems.map((item) => (
                    <Link key={item.to} to={item.to} onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                      <item.icon className="w-4 h-4 text-muted-foreground" />{item.label}
                    </Link>
                  ))}
                  <button onClick={logout}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 border-t border-border transition-colors">
                    <LogOut className="w-4 h-4" />Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" className="text-gray-300 hover:text-white">Login</Button></Link>
              <Link to="/register"><Button style={{ background: "#3b82f6", color: "#fff", border: "none" }}>Get Started</Button></Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex lg:hidden items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border px-4 py-4 space-y-1 bg-background">
          {publicLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm rounded-md hover:bg-accent">
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <div className="border-t border-border pt-3 mt-3">
                <div className="px-3 py-2 text-sm font-semibold">👋 {firstName}</div>
                {userMenuItems.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent">
                    <item.icon className="w-4 h-4 text-muted-foreground" />{item.label}
                  </Link>
                ))}
                <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive rounded-md hover:bg-destructive/10 mt-1">
                  <LogOut className="w-4 h-4" />Log out
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2 pt-3 border-t border-border mt-2">
              <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">Login</Button></Link>
              <Link to="/register" className="flex-1"><Button className="w-full">Get Started</Button></Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}