"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import type { ChartData } from "@/lib/types";
import type { ChartColors } from "@/hooks/useChartColors";

interface ErrorDistributionChartProps {
  data: ChartData["error_distribution"];
  chartColors: ChartColors;
  onBarClick?: (error: string) => void;
  activeError?: string | null;
}

export default function ErrorDistributionChart({ data, chartColors, onBarClick, activeError }: ErrorDistributionChartProps) {
  if (data.length === 0) return null;

  const formatted = data.map((d) => ({
    ...d,
    label: d.error.length > 30 ? d.error.slice(0, 30) + "..." : d.error,
  }));

  return (
    <div className="card p-6 overflow-hidden min-w-0">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground">Error Distribution</h3>
        <span className="text-[11px] text-text-muted bg-hover-bg px-2 py-0.5 rounded-full">{data.length} types</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formatted} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid stroke={chartColors.grid} horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" tickLine={false} axisLine={{ stroke: chartColors.axisLine }} tick={{ fontSize: 11, fill: chartColors.axis }} />
          <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 11, fill: chartColors.axis }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${chartColors.tooltipBorder}`,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 12,
              padding: "8px 12px",
              backgroundColor: chartColors.tooltipBg,
              color: "var(--foreground)",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [value, "Count"]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            labelFormatter={(label: any) => {
              const labelStr = String(label);
              const item = data.find(
                (d) =>
                  d.error === labelStr ||
                  (d.error.length > 30 && d.error.slice(0, 30) + "..." === labelStr)
              );
              return item?.error || labelStr;
            }}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
            onClick={(_: unknown, index: number) => {
              if (onBarClick && formatted[index]) {
                onBarClick(formatted[index].error);
              }
            }}
            style={{ cursor: onBarClick ? "pointer" : "default" }}
          >
            {formatted.map((entry, index) => {
              const isActive = !activeError || entry.error === activeError;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors.barColors[index % chartColors.barColors.length]}
                  opacity={isActive ? 1 : 0.3}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
