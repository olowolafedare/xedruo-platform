import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { xedruo } from "@/api/xedruoClient";
import { Music2, Upload, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Wraps any page/feature that requires the user to have at least
 * one release OR one beat uploaded. Promotion and AI are excluded
 * from this gate and should NOT be wrapped.
 */
export default function CreatorGate({ children }) {
  const [status, setStatus] = useState("loading"); // loading | allowed | blocked

  useEffect(() => {
    Promise.all([
      xedruo.entities.Release.list("-created_date", 1).catch(() => []),
      xedruo.entities.Beat.list("-created_date", 1).catch(() => []),
    ]).then(([releases, beats]) => {
      setStatus(releases.length > 0 || beats.length > 0 ? "allowed" : "blocked");
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        {/* Lock badge */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Lock className="w-9 h-9 text-primary" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Creator Access Required</h2>
        <p className="text-muted-foreground max-w-md mb-2">
          This feature is available to <span className="text-foreground font-medium">artists and producers</span> on Xedruo.
          You need at least <span className="text-foreground font-medium">one song or one beat</span> on the platform to unlock it.
        </p>
        <p className="text-sm text-muted-foreground max-w-sm mb-8">
          Don't have music yet? Use <strong>Promotion</strong> or <strong>Xedruo AI</strong> to help you get your first release ready.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/distribution">
            <Button className="gap-2">
              <Upload className="w-4 h-4" /> Upload a Song
            </Button>
          </Link>
          <Link to="/producer-suite">
            <Button variant="outline" className="gap-2">
              <Music2 className="w-4 h-4" /> Upload a Beat
            </Button>
          </Link>
          <Link to="/promotion">
            <Button variant="ghost" className="gap-2 text-muted-foreground">
              Try Promotion First
            </Button>
          </Link>
          <Link to="/ai-assistant">
            <Button variant="ghost" className="gap-2 text-muted-foreground">
              Ask Xedruo AI
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}