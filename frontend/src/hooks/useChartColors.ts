"use client";

import { useMemo } from "react";

function getCSSVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export interface ChartColors {
  barColors: string[];
  successStroke: string;
  grid: string;
  axis: string;
  axisLine: string;
  tooltipBg: string;
  tooltipBorder: string;
  dotStroke: string;
}

export function useChartColors(isDark: boolean): ChartColors {
  return useMemo(() => {
    return {
      barColors: [
        getCSSVar("--chart-error-1") || "#dc2626",
        getCSSVar("--chart-error-2") || "#ef4444",
        getCSSVar("--chart-error-3") || "#f87171",
        getCSSVar("--chart-error-4") || "#fca5a5",
        getCSSVar("--chart-error-5") || "#fecaca",
      ],
      successStroke: getCSSVar("--chart-success-stroke") || "#16a34a",
      grid: getCSSVar("--chart-grid") || "#f3f4f6",
      axis: getCSSVar("--chart-axis") || "#9ca3af",
      axisLine: getCSSVar("--chart-axis-line") || "#e5e7eb",
      tooltipBg: getCSSVar("--chart-tooltip-bg") || "#ffffff",
      tooltipBorder: getCSSVar("--chart-tooltip-border") || "#e5e7eb",
      dotStroke: getCSSVar("--chart-dot-stroke") || "#ffffff",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);
}
