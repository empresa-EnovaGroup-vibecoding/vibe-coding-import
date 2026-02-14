import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Crown, X } from "lucide-react";

export function TrialBanner() {
  const { subscriptionStatus, daysLeftInTrial, tenant } = useTenant();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [dismissed, setDismissed] = useState(false);

  // Tick every minute to update countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Only show during trial
  if (dismissed) return null;
  if (subscriptionStatus !== "trial" || !tenant || daysLeftInTrial === null) return null;

  // Calculate hours remaining
  const trialEnd = new Date(tenant.trial_ends_at);
  const diffMs = trialEnd.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  // Smart message: only show hours on last day
  let message: string;
  let bannerStyle: string;
  let textStyle: string;
  let buttonLabel: string;
  let buttonStyle: string;

  if (days >= 3) {
    message = `${days} dias restantes`;
    bannerStyle = "bg-white/90 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-black/[0.06]";
    textStyle = "text-neutral-600 dark:text-neutral-300";
    buttonLabel = "Activar Premium";
    buttonStyle = "bg-primary text-white hover:bg-primary/90 border-0";
  } else if (days >= 1) {
    message = days === 1 ? "Ultimo dia" : `${days} dias restantes`;
    bannerStyle = "bg-amber-900/80 dark:bg-amber-950/80 backdrop-blur-xl border-b border-amber-500/30";
    textStyle = "text-amber-100";
    buttonLabel = "Activar Ahora";
    buttonStyle = "bg-amber-500 text-slate-900 hover:bg-amber-400 border-0 font-bold";
  } else {
    message = `${hours}h restantes`;
    bannerStyle = "bg-red-900/80 dark:bg-red-950/80 backdrop-blur-xl border-b border-red-500/30 animate-pulse";
    textStyle = "text-red-100";
    buttonLabel = "Activar Ahora";
    buttonStyle = "bg-red-500 text-white hover:bg-red-400 border-0 font-bold";
  }

  return (
    <div className={`sticky top-0 z-50 ${bannerStyle} px-4 py-1.5 flex items-center justify-center gap-3 text-xs font-medium shadow-sm`}>
      <span className={textStyle}>{message}</span>
      <Button
        size="sm"
        className={`${buttonStyle} gap-1 h-6 text-[11px] rounded-md shadow-sm px-2.5`}
        onClick={() => navigate("/membership")}
      >
        <Crown className="h-3 w-3" />
        {buttonLabel}
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:text-white/30 dark:hover:text-white/70 transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
