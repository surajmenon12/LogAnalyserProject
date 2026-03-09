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

interface ErrorDistributionChartProps {
  data: ChartData["error_distribution"];
}

const BAR_COLORS = ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca"];

export default function ErrorDistributionChart({ data }: ErrorDistributionChartProps) {
  if (data.length === 0) return null;

  const formatted = data.map((d) => ({
    ...d,
    label: d.error.length > 30 ? d.error.slice(0, 30) + "..." : d.error,
  }));

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground">Error Distribution</h3>
        <span className="text-[11px] text-text-muted bg-gray-50 px-2 py-0.5 rounded-full">{data.length} types</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formatted} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid stroke="#f3f4f6" horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" tickLine={false} axisLine={{ stroke: "#e5e7eb" }} tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 12,
              padding: "8px 12px",
            }}
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
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {formatted.map((_, index) => (
              <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
