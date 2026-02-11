import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export function TrialBanner() {
  const { user } = useAuth();
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("subscription_status, trial_ends_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setStatus(data.subscription_status);
        setTrialEndsAt(new Date(data.trial_ends_at));
      }
    };

    fetch();

    const channel = supabase
      .channel("trial-banner")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Tick every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (status !== "trial" || !trialEndsAt) return null;

  const diffMs = trialEndsAt.getTime() - now.getTime();
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
        Tienes <strong>{days} {days === 1 ? "día" : "días"}</strong> y <strong>{hours} {hours === 1 ? "hora" : "horas"}</strong> restantes de tu prueba gratuita
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="bg-white text-foreground hover:bg-white/90 font-semibold gap-1.5 h-7 text-xs"
        asChild
      >
        <a href="https://www.skool.com/gestorq-8720" target="_blank" rel="noopener noreferrer">
          Pagar ahora <ExternalLink className="h-3 w-3" />
        </a>
      </Button>
    </div>
  );
}
