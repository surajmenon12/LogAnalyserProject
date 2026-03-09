"use client";

interface HealthGradeCardProps {
  score: number;
  grade: string;
  children?: React.ReactNode;
}

const gradeConfig: Record<string, { color: string; bg: string; descriptor: string }> = {
  A: { color: "text-green-500", bg: "stroke-green-500", descriptor: "Excellent" },
  B: { color: "text-blue-500", bg: "stroke-blue-500", descriptor: "Good" },
  C: { color: "text-yellow-500", bg: "stroke-yellow-500", descriptor: "Fair" },
  D: { color: "text-orange-500", bg: "stroke-orange-500", descriptor: "Poor" },
  F: { color: "text-red-500", bg: "stroke-red-500", descriptor: "Critical" },
};

export default function HealthGradeCard({ score, grade, children }: HealthGradeCardProps) {
  const config = gradeConfig[grade] || gradeConfig.C;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="card p-6 overflow-hidden">
      <div className="flex items-center gap-6 min-w-0">
        {/* Circular Progress Ring */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              className="stroke-card-border"
              strokeWidth="6"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              className={config.bg}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${config.color}`}>{grade}</span>
          </div>
        </div>

        {/* Score Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-1">Health Grade</h3>
          <p className={`text-lg font-bold ${config.color}`}>{config.descriptor}</p>
          <p className="text-xs text-text-muted mt-1">Score: {score}/100</p>
          <div className="mt-2 w-full bg-muted-bg rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-1000 ease-out`}
              style={{
                width: `${score}%`,
                backgroundColor: `var(--${grade === "A" ? "success" : grade === "B" ? "info" : grade === "C" ? "warning" : "danger"})`,
              }}
            />
          </div>
        </div>

        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}
