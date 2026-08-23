import React, { useState } from "react";
import { Link } from "react-router-dom";
import CompanySelector from "./CompanySelector";
import { Cpu, ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeveloperArea() {
  const [company, setCompany] = useState(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-semibold flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" /> Developer — Company Application
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Select a Xedruo company to work on its application.
        </p>
      </div>

      <CompanySelector onSelect={setCompany} selected={company} />

      {company && (
        <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
          <div className="font-medium">{company.icon} {company.name}</div>
          <p className="text-xs text-muted-foreground">{company.desc}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={company.route}>
                Open {company.name} application <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/developer-workstation">
                <Terminal className="w-3.5 h-3.5 mr-1" /> Developer Workstation
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}