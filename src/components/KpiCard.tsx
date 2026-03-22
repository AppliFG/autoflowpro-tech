import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  variant?: "default" | "success" | "warning" | "destructive" | "violet" | "accent";
  progressPercent?: number;
}

const dotColors: Record<string, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-accent",
  destructive: "bg-destructive",
  violet: "bg-violet",
  accent: "bg-accent",
};

const barColors: Record<string, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-accent",
  destructive: "bg-destructive",
  violet: "bg-violet",
  accent: "bg-accent",
};

const iconVariantStyles: Record<string, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-accent/15 text-accent",
  destructive: "bg-destructive/15 text-destructive",
  violet: "bg-violet/15 text-violet",
  accent: "bg-accent/15 text-accent",
};

export default function KpiCard({ title, value, subtitle, icon, trend, variant = "default", progressPercent = 60 }: KpiCardProps) {
  return (
    <div className="group relative rounded-lg border border-border/50 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 overflow-hidden">
      {/* Color dot */}
      <div className={`absolute top-4 right-4 h-2 w-2 rounded-full ${dotColors[variant]}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[1px] leading-tight">{title}</p>
          <p className="text-[30px] font-semibold text-card-foreground tracking-tight leading-none">{value}</p>
          <div className="flex items-center gap-2">
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                trend.positive
                  ? "text-success bg-success/10"
                  : "text-destructive bg-destructive/10"
              }`}>
                {trend.positive ? "↑" : "↓"}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconVariantStyles[variant]}`}>
          {icon}
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-border/30">
        <div className={`h-full ${barColors[variant]} rounded-full transition-all duration-500`} style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}
