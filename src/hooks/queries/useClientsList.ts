import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";

export interface ClientListItem {
  id: string;
  name: string;
  phone: string | null;
}

export function useClientsList() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["clients", tenantId],
    queryFn: async (): Promise<ClientListItem[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as ClientListItem[];
    },
    enabled: !!tenantId,
  });
}
