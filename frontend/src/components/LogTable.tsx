"use client";

import { useState, useMemo } from "react";
import { downloadCSV, downloadJSON } from "@/lib/download";
import type { DrilldownFilter } from "@/lib/types";

interface LogTableProps {
  logs: Record<string, unknown>[];
  logType: string;
  drilldownFilter?: DrilldownFilter | null;
  onClearDrilldown?: () => void;
}

const PAGE_SIZE = 20;

export default function LogTable({ logs, logType, drilldownFilter, onClearDrilldown }: LogTableProps) {
  const [search, setSearch] = useState("");
  const [carrier, setCarrier] = useState("");
  const [region, setRegion] = useState("");
  const [extraFilter, setExtraFilter] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const extraFilterField = logType === "voice" ? "hangup_cause" : logType === "zentrunk" ? "status" : "status";
  const extraFilterField2 = logType === "sms" ? "error_code" : logType === "zentrunk" ? "error_code" : null;

  // Get unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    const carriers = new Set<string>();
    const regions = new Set<string>();
    const extras = new Set<string>();
    for (const log of logs) {
      if (log.carrier) carriers.add(String(log.carrier));
      if (log.region) regions.add(String(log.region));
      if (log[extraFilterField]) extras.add(String(log[extraFilterField]));
    }
    return {
      carriers: Array.from(carriers).sort(),
      regions: Array.from(regions).sort(),
      extras: Array.from(extras).sort(),
    };
  }, [logs, extraFilterField]);

  // Filter & search
  const filtered = useMemo(() => {
    let result = [...logs];

    // Drilldown filter
    if (drilldownFilter) {
      if (drilldownFilter.type === "error") {
        result = result.filter((log) => {
          const errorStr = logType === "voice"
            ? `${log.hangup_cause_code} - ${log.hangup_cause}`
            : `${log.error_code} - ${log.error_message}`;
          return errorStr === drilldownFilter.value;
        });
      } else if (drilldownFilter.type === "date") {
        result = result.filter((log) => {
          const dateField = logType === "voice" || logType === "zentrunk" ? "initiation_time" : "sent_time";
          const logDate = String(log[dateField] || "").slice(0, 10);
          return logDate === drilldownFilter.value;
        });
      }
    }

    if (carrier) result = result.filter((log) => String(log.carrier) === carrier);
    if (region) result = result.filter((log) => String(log.region) === region);
    if (extraFilter) result = result.filter((log) => String(log[extraFilterField]) === extraFilter);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((log) =>
        Object.values(log).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    return result;
  }, [logs, search, carrier, region, extraFilter, drilldownFilter, logType, extraFilterField]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = String(a[sortKey] ?? "");
      const vb = String(b[sortKey] ?? "");
      const cmp = va.localeCompare(vb, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const columns = logs.length > 0 ? Object.keys(logs[0]) : [];

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filename = `${logType}_logs_${new Date().toISOString().slice(0, 10)}`;

  const selectClasses = "rounded-[var(--radius-md)] border border-card-border bg-input-bg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <div className="card p-6 space-y-4 overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">Log Records</h3>
          <span className="text-[11px] text-text-muted bg-hover-bg px-2 py-0.5 rounded-full">
            {filtered.length} of {logs.length} records
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadCSV(filtered as Record<string, unknown>[], `${filename}_filtered.csv`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-input-bg border border-card-border rounded-[var(--radius-md)] shadow-sm hover:bg-hover-bg hover:shadow-hover transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV
          </button>
          <button
            onClick={() => downloadJSON(filtered as unknown[], `${filename}_filtered.json`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-input-bg border border-card-border rounded-[var(--radius-md)] shadow-sm hover:bg-hover-bg hover:shadow-hover transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            JSON
          </button>
        </div>
      </div>

      {/* Drilldown filter bar */}
      {drilldownFilter && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary-light border border-primary/20 rounded-[var(--radius-md)] text-xs">
          <span className="text-primary font-medium">
            Filtered by {drilldownFilter.type}: {drilldownFilter.value}
          </span>
          {onClearDrilldown && (
            <button
              onClick={onClearDrilldown}
              className="ml-auto text-primary hover:text-primary-hover font-medium"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search all fields..."
          className={`flex-1 min-w-[200px] ${selectClasses}`}
        />
        <select value={carrier} onChange={(e) => { setCarrier(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">All Carriers</option>
          {uniqueValues.carriers.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={region} onChange={(e) => { setRegion(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">All Regions</option>
          {uniqueValues.regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={extraFilter} onChange={(e) => { setExtraFilter(e.target.value); setPage(0); }} className={selectClasses}>
          <option value="">All {extraFilterField === "hangup_cause" ? "Hangup Causes" : logType === "zentrunk" ? "Statuses" : "Statuses"}</option>
          {uniqueValues.extras.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-card-border">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-3 py-2.5 text-left font-semibold text-text-secondary cursor-pointer hover:text-foreground transition-colors whitespace-nowrap select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {col}
                    {sortKey === col && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        {sortDir === "asc" ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i} className="border-b border-card-border/50 hover:bg-hover-bg transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-foreground whitespace-nowrap max-w-[200px] truncate">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-text-muted">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-[11px] text-text-muted">
          Page {page + 1} of {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-input-bg border border-card-border rounded-[var(--radius-md)] disabled:opacity-40 hover:bg-hover-bg transition-all"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-input-bg border border-card-border rounded-[var(--radius-md)] disabled:opacity-40 hover:bg-hover-bg transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
