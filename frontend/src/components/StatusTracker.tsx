"use client";

interface StatusTrackerProps {
  status: string;
  progressPct: number;
  message: string;
}

const STEPS = [
  { key: "queued", label: "Queued", icon: "clock" },
  { key: "fetching_logs", label: "Fetching Logs", icon: "download" },
  { key: "analyzing", label: "Analyzing", icon: "cpu" },
  { key: "completed", label: "Complete", icon: "check" },
];

function getStepIndex(status: string): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function StepIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "currentColor" : "currentColor";
  switch (type) {
    case "clock":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "download":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case "cpu":
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
          <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
  }
}

export default function StatusTracker({ status, progressPct, message }: StatusTrackerProps) {
  const currentIdx = getStepIndex(status);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card p-8 space-y-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Analysis Progress</h2>
          <p className="text-sm text-text-secondary mt-1">Please wait while we process your request</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-start justify-between relative">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isPending = idx > currentIdx;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10" style={{ flex: 1 }}>
                {/* Connecting line */}
                {idx < STEPS.length - 1 && (
                  <div
                    className="absolute top-[18px] left-[calc(50%+18px)] h-[2px] right-[calc(-50%+18px)]"
                    style={{
                      background: isCompleted ? 'var(--success)' : isCurrent ? 'linear-gradient(90deg, var(--primary), var(--card-border))' : 'var(--card-border)',
                    }}
                  />
                )}

                {/* Step circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all relative ${
                    isCompleted
                      ? "bg-success text-white"
                      : isCurrent
                      ? "bg-primary text-white animate-glow"
                      : "bg-gray-100 text-text-muted border-2 border-card-border"
                  }`}
                >
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <StepIcon type={step.icon} active={isCurrent} />
                  )}
                </div>

                {/* Label */}
                <span className={`text-[11px] mt-2 font-medium text-center ${
                  isCompleted ? "text-success" : isCurrent ? "text-foreground" : "text-text-muted"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary font-medium">Progress</span>
            <span className="text-xs font-semibold text-foreground">{progressPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="progress-bar-animated h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-sm text-text-secondary animate-pulse-subtle">{message}</p>
        </div>
      </div>
    </div>
  );
}
