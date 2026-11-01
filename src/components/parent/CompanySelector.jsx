import React from "react";
import { companies } from "@/data/companies";

const RETIRED = new Set(["agruo", "education", "capital", "energy"]);

export default function CompanySelector({ onSelect, selected }) {
  const availableCompanies = companies.filter((company) => !RETIRED.has(company.slug));

  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground">Operating company</span>
      <select
        value={selected?.slug || ""}
        onChange={(event) => {
          const company = availableCompanies.find((item) => item.slug === event.target.value);
          if (company) onSelect(company);
        }}
        className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-3 text-sm text-foreground"
      >
        <option value="" disabled>Select a company</option>
        {availableCompanies.map((company) => (
          <option key={company.slug} value={company.slug}>{company.name}</option>
        ))}
      </select>
    </label>
  );
}
