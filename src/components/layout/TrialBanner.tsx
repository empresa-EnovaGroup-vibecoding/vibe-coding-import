import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

export function TrialBanner() {
  const { subscriptionStatus, daysLeftInTrial, tenant } = useTenant();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  // Tick every minute to update countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Only show during trial
  if (subscriptionStatus !== "trial" || !tenant || daysLeftInTrial === null) return null;

  // Calculate hours remaining
  const trialEnd = new Date(tenant.trial_ends_at);
  const diffMs = trialEnd.getTime() - now.getTime();
  if (diffMs <= 0) return null;

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  let bg: string;
  if (days >= 3) {
    bg = "bg-blue-600";
  } else if (days >= 1) {
    bg = "bg-orange-500";
  } else {
    bg = "bg-red-600 animate-pulse";
  }

  return (
    <div className={`sticky top-0 z-50 ${bg} text-white px-4 py-2.5 flex items-center justify-center gap-4 text-sm font-medium shadow-md`}>
      <span>
        Tienes <strong>{days} {days === 1 ? "dia" : "dias"}</strong> y <strong>{hours} {hours === 1 ? "hora" : "horas"}</strong> restantes de tu prueba gratuita
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="bg-white text-foreground hover:bg-white/90 font-semibold gap-1.5 h-7 text-xs"
        onClick={() => navigate("/membership")}
      >
        <Crown className="h-3 w-3" />
        Actualizar Plan
      </Button>
    </div>
  );
}
