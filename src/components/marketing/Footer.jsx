import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "./Logo";

const groups = [
  { title: "Products", items: ["Distribution", "Promotion", "Producer Suite", "Creator Payments", "Instant Pay", "Invest"] },
  { title: "Company", items: ["About", "Blog", "Contact", "Support"] },
  { title: "Legal", items: ["Privacy", "Terms", "Cookies"] },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground max-w-xs">One platform. Every tool every creator needs — distribution, promotion, payments and more.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); setSent(true); setEmail(""); }}
              className="flex gap-2 max-w-sm"
            >
              <Input type="email" required placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit">{sent ? "Subscribed" : "Subscribe"}</Button>
            </form>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h4 className="font-semibold text-sm mb-3">{g.title}</h4>
              <ul className="space-y-2">
                {g.items.map((i) => (
                  <li key={i}><span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">{i}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Xedruo. All rights reserved.</span>
          <span>Made for creators, worldwide.</span>
        </div>
      </div>
    </footer>
  );
}