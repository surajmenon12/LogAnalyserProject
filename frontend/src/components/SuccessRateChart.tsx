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
import type { ChartData } from "@/lib/types";

interface SuccessRateChartProps {
  data: ChartData["success_rate_over_time"];
}

export default function SuccessRateChart({ data }: SuccessRateChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground">Success Rate Over Time</h3>
        <span className="text-[11px] text-text-muted bg-gray-50 px-2 py-0.5 rounded-full">{data.length} days</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f3f4f6" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} unit="%" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 12,
              padding: "8px 12px",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value}%`, "Success Rate"]}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#16a34a"
            strokeWidth={2.5}
            fill="url(#successGradient)"
            dot={{ r: 3, fill: "#16a34a", strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
