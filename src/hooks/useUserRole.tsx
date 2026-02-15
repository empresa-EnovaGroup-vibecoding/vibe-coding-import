import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "staff";

interface UseUserRoleReturn {
  role: AppRole | null;
  isAdmin: boolean;
  isStaff: boolean;
  hasRole: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useUserRole(): UseUserRoleReturn {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setRole(null);
      } else {
        setRole(data?.role as AppRole | null);
      }
    } catch {
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return {
    role,
    isAdmin: role === "admin",
    isStaff: role === "staff",
    hasRole: role !== null,
    loading,
    refetch: fetchRole,
  };
}
