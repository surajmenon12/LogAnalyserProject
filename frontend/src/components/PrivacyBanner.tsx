"use client";

import { useState } from "react";

export default function PrivacyBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-info-light border-l-4 border-info rounded-[var(--radius-md)] p-3.5 flex items-start gap-3">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-info shrink-0 mt-0.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <p className="text-xs text-text-secondary leading-relaxed flex-1">
        This tool does not persist customer data. All analysis data is stored in your browser
        session and cleared when you close this tab or after 15 minutes of inactivity.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-text-muted hover:text-text-secondary transition-colors shrink-0 p-0.5"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
