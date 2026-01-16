import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "warning" | "success" | "primary";
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: MetricCardProps) {
  const variantStyles = {
    default: "bg-card border-border",
    warning: "bg-warning/10 border-warning/30",
    success: "bg-success/10 border-success/30",
    primary: "bg-primary/10 border-primary/30",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    warning: "bg-warning/20 text-warning",
    success: "bg-success/20 text-success",
    primary: "bg-primary/20 text-primary",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-6 shadow-sm transition-all duration-200 hover:shadow-md animate-fade-in",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-3", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
