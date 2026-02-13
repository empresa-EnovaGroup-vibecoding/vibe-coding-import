import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "warning" | "success" | "primary";
  href?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  href,
}: MetricCardProps) {
  const navigate = useNavigate();

  const variantStyles = {
    default: "bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10",
    warning: "bg-amber-500/10 dark:bg-amber-500/5 border-amber-300/30 dark:border-amber-400/20",
    success: "bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-300/30 dark:border-emerald-400/20",
    primary: "bg-amber-500/10 dark:bg-amber-500/5 border-amber-300/30 dark:border-amber-400/20",
  };

  const iconStyles = {
    default: "bg-white/40 dark:bg-white/10 text-muted-foreground",
    warning: "bg-amber-500/15 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    success: "bg-emerald-500/15 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    primary: "bg-amber-500/15 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <div
      onClick={href ? () => navigate(href) : undefined}
      role={href ? "link" : undefined}
      className={cn(
        "rounded-xl border p-6 shadow-sm backdrop-blur-xl transition-all duration-200 hover:shadow-md animate-fade-in",
        variantStyles[variant],
        href && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
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
        <div className={cn("rounded-xl p-3", iconStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
