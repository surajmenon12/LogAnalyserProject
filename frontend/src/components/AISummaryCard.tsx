"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";

interface AISummaryCardProps {
  result: AnalysisResult;
}

const severityConfig: Record<string, { card: string; badge: string; text: string; icon: string }> = {
  critical: {
    card: "bg-danger-light border-danger/20",
    badge: "bg-danger text-white",
    text: "text-red-700",
    icon: "text-danger",
  },
  warning: {
    card: "bg-warning-light border-warning/20",
    badge: "bg-warning text-white",
    text: "text-amber-800",
    icon: "text-warning",
  },
  info: {
    card: "bg-info-light border-blue-200",
    badge: "bg-info text-white",
    text: "text-blue-700",
    icon: "text-info",
  },
};

export default function AISummaryCard({ result }: AISummaryCardProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-foreground">Analysis Summary</h2>
          <span className="badge-gradient text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide">
            AI-Powered
          </span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="bg-gray-50 border border-card-border text-text-secondary px-2.5 py-1 rounded-full font-medium">
            {result.total_records.toLocaleString()} records
          </span>
          <span className="bg-success-light border border-success/20 text-success px-2.5 py-1 rounded-full font-medium">
            {result.success_rate}% success
          </span>
        </div>
      </div>

      {/* Summary Text */}
      <p className="text-sm text-text-secondary leading-relaxed">{result.summary}</p>

      {/* Issues */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Issues Found
          </h3>
          <span className="text-xs text-text-muted font-medium">{result.issues.length} issues</span>
        </div>

        {result.issues.map((issue, idx) => {
          const config = severityConfig[issue.severity] || severityConfig.info;
          const isExpanded = expandedIdx === idx;

          return (
            <div
              key={idx}
              className={`border rounded-[var(--radius-md)] overflow-hidden transition-all ${config.card}`}
            >
              <button
                className="flex items-center justify-between w-full text-left p-3.5"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${config.badge}`}>
                    {issue.severity}
                  </span>
                  <span className={`text-sm font-medium ${config.text}`}>
                    {issue.title}
                  </span>
                  {issue.affected_records > 0 && result.total_records > 0 && (
                    <span className="text-[11px] text-text-muted bg-white/60 px-1.5 py-0.5 rounded font-medium">
                      {((issue.affected_records / result.total_records) * 100).toFixed(1)}% affected
                    </span>
                  )}
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`${config.text} transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div className={`px-3.5 pb-3.5 space-y-2 text-sm ${config.text} border-t ${config.card}`}>
                  <div className="pt-3">
                    <p className="leading-relaxed">{issue.description}</p>
                  </div>
                  <div className="flex gap-4 text-[12px]">
                    <span><span className="font-semibold">Affected:</span> {issue.affected_records.toLocaleString()} records</span>
                  </div>
                  <div className="bg-white/40 rounded-[var(--radius-sm)] p-2.5">
                    <p className="text-[12px]"><span className="font-semibold">Recommendation:</span> {issue.recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
