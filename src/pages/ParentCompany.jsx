import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { xedruo } from "@/api/xedruoClient";
import {
  ChevronLeft, Shield, Crown, DollarSign, Cpu, Headphones, Activity,
  Building2, Lock, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import GovernorArea from "@/components/parent/GovernorArea";
import CEOArea from "@/components/parent/CEOArea";
import CFOArea from "@/components/parent/CFOArea";
import DeveloperArea from "@/components/parent/DeveloperArea";
import CustomerServiceArea from "@/components/parent/CustomerServiceArea";
import OperationsArea from "@/components/parent/OperationsArea";

// The six Parent Company work areas.
const AREAS = [
  { key: "governor", label: "Governor", icon: Shield, desc: "Oversee the Xedruo group." },
  { key: "ceo", label: "CEO", icon: Crown, desc: "Company management oversight." },
  { key: "cfo", label: "CFO", icon: DollarSign, desc: "Access company financial records." },
  { key: "developer", label: "Developer", icon: Cpu, desc: "Work on a company's application." },
  { key: "customer_service", label: "Customer Service", icon: Headphones, desc: "Serve a selected company's customers." },
  { key: "operations", label: "Operations", icon: Activity, desc: "Manage company operations." },
];

const AREA_COMPONENT = {
  governor: GovernorArea,
  ceo: CEOArea,
  cfo: CFOArea,
  developer: DeveloperArea,
  customer_service: CustomerServiceArea,
  operations: OperationsArea,
};

const ROLE_LABEL = {
  governor: "Governor",
  ceo: "CEO",
  cfo: "CFO",
  developer: "Developer",
  customer_service: "Customer Service",
  operations: "Operations",
};

export default function ParentCompany() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [activeArea, setActiveArea] = useState(null);

  useEffect(() => {
    xedruo.auth
      .me()
      .then((me) => {
        setUser(me);
        const stored = localStorage.getItem("xedruo_staff_role");
        const r = me?.staff_role || stored;
        setRole(r);
        if (me && !me.staff_role && r && AREA_COMPONENT[r]) {
          xedruo.auth.updateMe({ staff_role: r }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Internal-only: customers (no staff role) can never access the Parent Company.
  if (!role || !AREA_COMPONENT[role]) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="font-display font-bold text-xl mb-2">Internal area — access restricted</h1>
          <p className="text-sm text-muted-foreground mb-5">
            The Parent Company is an internal management area for Xedruo staff only. Customer accounts cannot access it.
          </p>
          <Button asChild variant="outline">
            <Link to="/ecosystem">Back to Xedruo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isGovernor = role === "governor";
  // Governor can open any of the six areas; every other role lands directly in its own area.
  const currentArea = isGovernor ? activeArea : role;
  const AreaComp = currentArea ? AREA_COMPONENT[currentArea] : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/management" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" /> Management
          </Link>
          <div className="w-px h-5 bg-border" />
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-display font-bold leading-none">Xedruo Parent Company</div>
            <div className="text-[11px] text-muted-foreground">Internal management — staff only</div>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full bg-secondary/60 border border-border pl-2 pr-3 py-1">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">{ROLE_LABEL[role]}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isGovernor && !currentArea && (
          <div className="space-y-5">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-primary/10 to-card border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-display font-bold">Governor — Group Oversight</div>
                  <div className="text-xs text-muted-foreground">
                    Full access to all six management work areas.
                  </div>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AREAS.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.key}
                    onClick={() => setActiveArea(a.key)}
                    className="text-left rounded-2xl p-5 border bg-card border-border hover:border-primary/40 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{a.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
                    <div className="mt-3 text-xs text-primary font-medium inline-flex items-center gap-1">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {AreaComp && (
          <div className="space-y-4">
            {isGovernor && (
              <button
                onClick={() => setActiveArea(null)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" /> All work areas
              </button>
            )}
            <AreaComp />
          </div>
        )}
      </main>
    </div>
  );
}