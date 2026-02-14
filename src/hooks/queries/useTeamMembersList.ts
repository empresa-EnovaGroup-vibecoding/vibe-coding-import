import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";

export interface TeamMemberListItem {
  id: string;
  name: string;
  role: string | null;
}

export function useTeamMembersList() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ["teamMembers", tenantId],
    queryFn: async (): Promise<TeamMemberListItem[]> => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, role")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as TeamMemberListItem[];
    },
    enabled: !!tenantId,
  });
}
