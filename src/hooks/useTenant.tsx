import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type TenantRole = "owner" | "staff";
type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "expired";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string;
  plan_type: string;
  current_period_end: string | null;
  business_hours: Record<string, { enabled: boolean; open: string; close: string }> | null;
}

interface TenantMembership {
  tenant_id: string;
  role: TenantRole;
  tenant: Tenant;
}

interface TenantContextType {
  // Tenant activo
  tenant: Tenant | null;
  tenantId: string | null;
  // Rol del usuario en el tenant activo
  role: TenantRole | null;
  isOwner: boolean;
  isStaff: boolean;
  // Super admin
  isSuperAdmin: boolean;
  // Impersonacion
  isImpersonating: boolean;
  stopImpersonating: () => void;
  // Suscripcion del tenant
  subscriptionStatus: SubscriptionStatus | null;
  hasPremium: boolean;
  daysLeftInTrial: number | null;
  // Lista de tenants del usuario (si pertenece a varios)
  memberships: TenantMembership[];
  // Estado
  loading: boolean;
  hasTenant: boolean;
  // Acciones
  setActiveTenant: (tenantId: string) => void;
  refetch: () => Promise<void>;
  // Premium gate
  showUpgradeModal: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  checkPremiumAccess: () => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const ACTIVE_TENANT_KEY = "active_tenant_id";
const IMPERSONATE_KEY = "impersonate_tenant_id";

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [memberships, setMemberships] = useState<TenantMembership[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_TENANT_KEY)
  );
  const [impersonatedTenant, setImpersonatedTenant] = useState<Tenant | null>(null);
  const [impersonateId, setImpersonateId] = useState<string | null>(
    () => localStorage.getItem(IMPERSONATE_KEY)
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const fetchTenantData = useCallback(async () => {
    // Esperar a que auth termine de cargar antes de decidir
    if (authLoading) return;

    if (!user) {
      setMemberships([]);
      setActiveTenantId(null);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Verificar si es super_admin
      const { data: superAdminData, error: saError } = await supabase
        .rpc("is_super_admin", { _user_id: user.id });
      if (saError) console.error("Error checking super_admin:", saError);
      setIsSuperAdmin(superAdminData === true);

      // Obtener membresías del usuario (tenants a los que pertenece)
      const { data: memberData, error } = await supabase
        .from("tenant_members")
        .select(`
          tenant_id,
          role,
          tenant:tenants (
            id, name, slug, phone, address, logo_url,
            subscription_status, trial_ends_at, plan_type, current_period_end,
            business_hours
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching tenant memberships:", error);
        setMemberships([]);
      } else if (memberData) {
        const formatted: TenantMembership[] = memberData
          .filter((m) => m.tenant !== null)
          .map((m) => ({
            tenant_id: m.tenant_id,
            role: m.role as TenantRole,
            tenant: m.tenant as unknown as Tenant,
          }));
        setMemberships(formatted);

        // Auto-seleccionar tenant si no hay uno activo
        if (!activeTenantId && formatted.length > 0) {
          const firstTenantId = formatted[0].tenant_id;
          setActiveTenantId(firstTenantId);
          localStorage.setItem(ACTIVE_TENANT_KEY, firstTenantId);
        }

        // Si el tenant activo ya no existe en las membresías, resetear
        if (activeTenantId && !formatted.some((m) => m.tenant_id === activeTenantId)) {
          if (formatted.length > 0) {
            setActiveTenantId(formatted[0].tenant_id);
            localStorage.setItem(ACTIVE_TENANT_KEY, formatted[0].tenant_id);
          } else {
            setActiveTenantId(null);
            localStorage.removeItem(ACTIVE_TENANT_KEY);
          }
        }
      }
      // Si es super admin e impersonate esta activo, cargar ese tenant directamente
      if (superAdminData === true && impersonateId) {
        const { data: impTenant, error: impError } = await supabase
          .from("tenants")
          .select("id, name, slug, phone, address, logo_url, subscription_status, trial_ends_at, plan_type, current_period_end, business_hours")
          .eq("id", impersonateId)
          .single();
        if (!impError && impTenant) {
          setImpersonatedTenant(impTenant as unknown as Tenant);
        } else {
          // Tenant no encontrado, limpiar impersonacion
          localStorage.removeItem(IMPERSONATE_KEY);
          setImpersonateId(null);
          setImpersonatedTenant(null);
        }
      } else {
        setImpersonatedTenant(null);
      }
    } catch (err) {
      console.error("Error in tenant data fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, activeTenantId, impersonateId]);

  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  // Escuchar cambios en tiempo real al tenant (ej: cuando se activa el plan)
  useEffect(() => {
    if (!activeTenantId) return;

    const channel = supabase
      .channel(`tenant-${activeTenantId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tenants",
          filter: `id=eq.${activeTenantId}`,
        },
        () => { fetchTenantData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTenantId, fetchTenantData]);

  const isImpersonating = isSuperAdmin && !!impersonatedTenant;

  const stopImpersonating = useCallback(() => {
    localStorage.removeItem(IMPERSONATE_KEY);
    setImpersonateId(null);
    setImpersonatedTenant(null);
  }, []);

  // Derivar datos del tenant activo (impersonacion tiene prioridad)
  const activeMembership = memberships.find((m) => m.tenant_id === activeTenantId);
  const tenant = isImpersonating ? impersonatedTenant : (activeMembership?.tenant ?? null);
  const role: TenantRole | null = isImpersonating ? "owner" : (activeMembership?.role ?? null);

  // Calcular estado de suscripcion
  let computedStatus: SubscriptionStatus | null = null;
  let daysLeftInTrial: number | null = null;

  if (tenant) {
    const status = tenant.subscription_status as SubscriptionStatus;
    if (status === "active") {
      computedStatus = "active";
    } else if (status === "trial") {
      const trialEnd = new Date(tenant.trial_ends_at);
      if (trialEnd > new Date()) {
        computedStatus = "trial";
        daysLeftInTrial = Math.ceil(
          (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
      } else {
        computedStatus = "expired";
      }
    } else {
      computedStatus = status;
    }
  }

  const hasPremium = isImpersonating || computedStatus === "active" || computedStatus === "trial";

  const setActiveTenant = useCallback((tenantId: string) => {
    setActiveTenantId(tenantId);
    localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
  }, []);

  const openUpgradeModal = useCallback(() => setShowUpgradeModal(true), []);
  const closeUpgradeModal = useCallback(() => setShowUpgradeModal(false), []);

  const checkPremiumAccess = useCallback((): boolean => {
    if (isSuperAdmin) return true;
    if (hasPremium) return true;
    openUpgradeModal();
    return false;
  }, [hasPremium, isSuperAdmin, openUpgradeModal]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantId: isImpersonating ? impersonatedTenant!.id : activeTenantId,
        role,
        isOwner: role === "owner",
        isStaff: role === "staff",
        isSuperAdmin,
        isImpersonating,
        stopImpersonating,
        subscriptionStatus: computedStatus,
        hasPremium,
        daysLeftInTrial,
        memberships,
        loading,
        hasTenant: memberships.length > 0,
        setActiveTenant,
        refetch: fetchTenantData,
        showUpgradeModal,
        openUpgradeModal,
        closeUpgradeModal,
        checkPremiumAccess,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
