"use client";

import { useState } from "react";
import type { TrendInfo } from "@/lib/types";

interface TrendIndicatorProps {
  trend: TrendInfo;
}

const directionConfig: Record<string, { color: string; label: string }> = {
  increasing: { color: "text-danger", label: "Worsening" },
  decreasing: { color: "text-success", label: "Improving" },
  stable: { color: "text-text-muted", label: "Stable" },
};

const confidenceColors: Record<string, string> = {
  high: "bg-success-light text-success",
  medium: "bg-warning-light text-warning",
  low: "bg-muted-bg text-text-muted",
};

export default function TrendIndicator({ trend }: TrendIndicatorProps) {
  const [expanded, setExpanded] = useState(false);
  const config = directionConfig[trend.direction] || directionConfig.stable;

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1 text-xs font-medium ${config.color} hover:opacity-80 transition-opacity`}
      >
        {/* Arrow Icon */}
        {trend.direction === "increasing" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        )}
        {trend.direction === "decreasing" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="7" x2="17" y2="17" />
            <polyline points="17 7 17 17 7 17" />
          </svg>
        )}
        {trend.direction === "stable" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        )}
        {config.label}
      </button>

      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${confidenceColors[trend.confidence]}`}>
        {trend.confidence}
      </span>

      {expanded && (
        <div className="absolute top-full left-0 mt-1 z-20 w-64 p-3 rounded-[var(--radius-md)] bg-card-bg border border-card-border shadow-elevated text-xs text-text-secondary leading-relaxed">
          {trend.description}
        </div>
      )}
    </div>
  );
}
