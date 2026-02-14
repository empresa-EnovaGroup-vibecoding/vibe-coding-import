import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";

export interface ServiceListItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export function useServicesList() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["services", tenantId],
    queryFn: async (): Promise<ServiceListItem[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as ServiceListItem[];
    },
    enabled: !!tenantId,
  });
}
