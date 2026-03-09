"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { ChartData, TrendInfo } from "@/lib/types";
import type { ChartColors } from "@/hooks/useChartColors";
import TrendIndicator from "./TrendIndicator";

interface SuccessRateChartProps {
  data: ChartData["success_rate_over_time"];
  chartColors: ChartColors;
  trend?: TrendInfo | null;
  onDotClick?: (date: string) => void;
  activeDate?: string | null;
}

export default function SuccessRateChart({ data, chartColors, trend, onDotClick, activeDate }: SuccessRateChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="card p-6 overflow-hidden min-w-0">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Success Rate Over Time</h3>
          {trend && <TrendIndicator trend={trend} />}
        </div>
        <span className="text-[11px] text-text-muted bg-hover-bg px-2 py-0.5 rounded-full">{data.length} days</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.successStroke} stopOpacity={0.2} />
              <stop offset="95%" stopColor={chartColors.successStroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chartColors.grid} vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: chartColors.axis }} tickLine={false} axisLine={{ stroke: chartColors.axisLine }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chartColors.axis }} unit="%" tickLine={false} axisLine={false} />
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
            formatter={(value: any) => [`${value}%`, "Success Rate"]}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke={chartColors.successStroke}
            strokeWidth={2.5}
            fill="url(#successGradient)"
            dot={{ r: 3, fill: chartColors.successStroke, strokeWidth: 2, stroke: chartColors.dotStroke }}
            activeDot={{
              r: 5,
              strokeWidth: 2,
              stroke: chartColors.dotStroke,
              cursor: onDotClick ? "pointer" : "default",
              onClick: (_: unknown, payload: { payload?: { date?: string } }) => {
                if (onDotClick && payload?.payload?.date) {
                  onDotClick(payload.payload.date);
                }
              },
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
