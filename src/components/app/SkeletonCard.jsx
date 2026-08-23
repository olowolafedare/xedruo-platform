import React from "react";

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-2.5 bg-muted rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-8 bg-muted rounded-lg mt-4" />
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="rounded-2xl border border-border bg-card divide-y divide-border animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="w-11 h-11 rounded-lg bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-2.5 bg-muted rounded w-1/4" />
          </div>
          <div className="h-5 w-16 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-2.5 bg-muted rounded w-20" />
        <div className="w-8 h-8 rounded-lg bg-muted" />
      </div>
      <div className="h-7 bg-muted rounded w-24 mb-1" />
      <div className="h-2.5 bg-muted rounded w-16" />
    </div>
  );
}