"use client";

interface SessionTimeoutModalProps {
  onConfirm: () => void;
}

export default function SessionTimeoutModal({ onConfirm }: SessionTimeoutModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card-bg rounded-[var(--radius-xl)] shadow-elevated p-8 max-w-[420px] mx-4 text-center space-y-5">
        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-warning-light border border-warning/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Session Expired</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Your session has expired due to 15 minutes of inactivity. All analysis data has been cleared for security.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-card-border" />

        {/* Action */}
        <button
          onClick={onConfirm}
          className="w-full bg-primary text-white rounded-[var(--radius-md)] py-3 px-4 text-sm font-semibold hover:bg-primary-hover transition-all shadow-sm hover:shadow-hover"
        >
          Start New Session
        </button>

        {/* Footer */}
        <p className="text-[11px] text-text-muted">Your data has been securely cleared</p>
      </div>
    </div>
  );
}
