import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlatformPricing {
  monthlyPrice: number;
  annualPrice: number;
  trialDays: number;
  platformName: string;
}

const DEFAULTS: PlatformPricing = {
  monthlyPrice: 49,
  annualPrice: 399,
  trialDays: 7,
  platformName: "Agenda PRO",
};

export function usePlatformSettings(): PlatformPricing & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["platform_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value");
      if (error) return null;
      const map: Record<string, string> = {};
      (data as { key: string; value: string }[])?.forEach((s) => {
        map[s.key] = s.value;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min
  });

  return {
    monthlyPrice: data?.monthly_price ? Number(data.monthly_price) : DEFAULTS.monthlyPrice,
    annualPrice: data?.annual_price ? Number(data.annual_price) : DEFAULTS.annualPrice,
    trialDays: data?.trial_duration_days ? Number(data.trial_duration_days) : DEFAULTS.trialDays,
    platformName: data?.platform_name || DEFAULTS.platformName,
    isLoading,
  };
}
