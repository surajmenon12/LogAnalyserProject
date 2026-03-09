"use client";

import type { AnalysisResult } from "@/lib/types";

interface PdfReportContentProps {
  result: AnalysisResult;
}

export default function PdfReportContent({ result }: PdfReportContentProps) {
  const gradeColorMap: Record<string, string> = {
    A: "#16a34a",
    B: "#3b82f6",
    C: "#d97706",
    D: "#f97316",
    F: "#dc2626",
  };
  const gradeColor = gradeColorMap[result.health_grade] || "#6b7280";
  const gradeDescriptor: Record<string, string> = {
    A: "Excellent",
    B: "Good",
    C: "Fair",
    D: "Poor",
    F: "Critical",
  };

  return (
    <div
      style={{
        width: "794px",
        padding: "40px",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#111827",
        backgroundColor: "#ffffff",
        lineHeight: 1.6,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "2px solid #43B02A", paddingBottom: "16px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#111827" }}>
            Plivo Log Analysis Report
          </h1>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0" }}>
            {result.log_type.toUpperCase()} Logs | {result.date_range} | {new Date().toLocaleDateString()}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>Total Records</span>
          <p style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#111827" }}>
            {result.total_records.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Health Grade */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "28px" }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", flex: "0 0 160px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>Health Grade</div>
          <div style={{ fontSize: "40px", fontWeight: 700, color: gradeColor }}>{result.health_grade}</div>
          <div style={{ fontSize: "12px", color: gradeColor, fontWeight: 600 }}>
            {gradeDescriptor[result.health_grade] || "N/A"}
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
            Score: {result.health_score}/100
          </div>
        </div>
        <div style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#111827", marginBottom: "6px" }}>Executive Summary</div>
          <p style={{ fontSize: "12px", color: "#4b5563", margin: 0 }}>{result.summary}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "28px" }}>
        <div style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Success Rate</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#16a34a" }}>{result.success_rate}%</div>
        </div>
        <div style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Issues Found</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#dc2626" }}>{result.issues.length}</div>
        </div>
        <div style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: "8px", padding: "14px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Error Types</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#d97706" }}>{result.chart_data.error_distribution.length}</div>
        </div>
      </div>

      {/* Issues Table */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "#111827" }}>Issues</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: 600, color: "#6b7280" }}>Severity</th>
              <th style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #e5e7eb", fontWeight: 600, color: "#6b7280" }}>Issue</th>
              <th style={{ padding: "8px 10px", textAlign: "right", borderBottom: "1px solid #e5e7eb", fontWeight: 600, color: "#6b7280" }}>Affected</th>
            </tr>
          </thead>
          <tbody>
            {result.issues.map((issue, i) => {
              const severityColor = issue.severity === "critical" ? "#dc2626" : issue.severity === "warning" ? "#d97706" : "#3b82f6";
              return (
                <tr key={i}>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ color: severityColor, fontWeight: 600, textTransform: "uppercase", fontSize: "10px" }}>
                      {issue.severity}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #f3f4f6", color: "#374151" }}>
                    <div style={{ fontWeight: 600 }}>{issue.title}</div>
                    <div style={{ color: "#6b7280", marginTop: "2px" }}>{issue.description}</div>
                  </td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #f3f4f6", textAlign: "right", color: "#374151", fontWeight: 600 }}>
                    {issue.affected_records.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recommendations */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "#111827" }}>Recommendations</h2>
        {result.issues.map((issue, i) => (
          <div key={i} style={{ marginBottom: "8px", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "11px" }}>
            <span style={{ fontWeight: 600, color: "#374151" }}>{issue.title}:</span>{" "}
            <span style={{ color: "#6b7280" }}>{issue.recommendation}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "32px", paddingTop: "12px", borderTop: "1px solid #e5e7eb", fontSize: "10px", color: "#9ca3af", textAlign: "center" }}>
        Generated by Plivo Log Analysis Dashboard | {new Date().toLocaleString()}
      </div>
    </div>
  );
}
