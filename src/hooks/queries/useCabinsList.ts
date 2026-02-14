import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";

export interface CabinListItem {
  id: string;
  name: string;
}

export function useCabinsList() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["cabins", tenantId],
    queryFn: async (): Promise<CabinListItem[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("cabins")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as CabinListItem[];
    },
    enabled: !!tenantId,
  });
}
