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

  let bannerStyle: string;
  let textStyle: string;
  let buttonStyle: string;

  if (days >= 3) {
    bannerStyle = "bg-stone-900/80 dark:bg-stone-950/80 backdrop-blur-xl border-b border-amber-600/20";
    textStyle = "text-amber-100/90";
    buttonStyle = "bg-amber-600 text-white hover:bg-amber-500 border-0";
  } else if (days >= 1) {
    bannerStyle = "bg-amber-900/80 dark:bg-amber-950/80 backdrop-blur-xl border-b border-amber-500/30";
    textStyle = "text-amber-100";
    buttonStyle = "bg-amber-500 text-stone-900 hover:bg-amber-400 border-0 font-bold";
  } else {
    bannerStyle = "bg-red-900/80 dark:bg-red-950/80 backdrop-blur-xl border-b border-red-500/30 animate-pulse";
    textStyle = "text-red-100";
    buttonStyle = "bg-red-500 text-white hover:bg-red-400 border-0 font-bold";
  }

  return (
    <div className={`sticky top-0 z-50 ${bannerStyle} px-4 py-2 flex items-center justify-center gap-4 text-sm font-medium shadow-sm`}>
      <span className={textStyle}>
        Tienes <strong>{days} {days === 1 ? "dia" : "dias"}</strong> y <strong>{hours} {hours === 1 ? "hora" : "horas"}</strong> restantes de tu prueba gratuita
      </span>
      <Button
        size="sm"
        className={`${buttonStyle} gap-1.5 h-7 text-xs rounded-lg shadow-sm`}
        onClick={() => navigate("/membership")}
      >
        <Crown className="h-3 w-3" />
        Actualizar Plan
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
        aria-label="Cerrar banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
