"use client";

import { downloadCSV, downloadJSON } from "@/lib/download";

interface RawLogsDownloadProps {
  logs: Record<string, unknown>[];
  logType: string;
}

export default function RawLogsDownload({ logs, logType }: RawLogsDownloadProps) {
  const filename = `${logType}_logs_${new Date().toISOString().slice(0, 10)}`;

  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[var(--radius-md)] bg-gray-50 border border-card-border flex items-center justify-center text-text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Raw Logs</h3>
          <p className="text-[11px] text-text-muted">{logs.length.toLocaleString()} records available</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => downloadCSV(logs, `${filename}.csv`)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary bg-white border border-card-border rounded-[var(--radius-md)] shadow-sm hover:bg-gray-50 hover:shadow-hover transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          CSV
        </button>
        <button
          onClick={() => downloadJSON(logs, `${filename}.json`)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary bg-white border border-card-border rounded-[var(--radius-md)] shadow-sm hover:bg-gray-50 hover:shadow-hover transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          JSON
        </button>
      </div>
    </div>
  );
}
