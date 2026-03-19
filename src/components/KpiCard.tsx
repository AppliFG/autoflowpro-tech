import { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  variant?: "default" | "success" | "warning" | "destructive";
}

const variantStyles = {
  default: "border-border/50 bg-card",
  success: "border-success/20 bg-gradient-to-br from-success/5 to-success/10",
  warning: "border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10",
  destructive: "border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
};

export default function KpiCard({ title, value, subtitle, icon, trend, variant = "default" }: KpiCardProps) {
  return (
    <div className={`group relative rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest leading-tight">{title}</p>
          <p className="text-3xl font-extrabold text-card-foreground tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-semibold flex items-center gap-1 ${trend.positive ? "text-success" : "text-destructive"}`}>
              <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] ${trend.positive ? "bg-success/15" : "bg-destructive/15"}`}>
                {trend.positive ? "↑" : "↓"}
              </span>
              {Math.abs(trend.value)}% vs mois dernier
            </p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconVariantStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
