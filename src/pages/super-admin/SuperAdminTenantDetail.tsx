import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TenantActionButtons } from "@/components/super-admin/TenantActionButtons";
import { TenantEditDialog } from "@/components/super-admin/TenantEditDialog";
import { TenantNotes } from "@/components/super-admin/TenantNotes";
import { TenantHealthCard } from "@/components/super-admin/TenantHealthCard";
import { TenantRecentActivity } from "@/components/super-admin/TenantRecentActivity";
import {
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  Scissors,
  Package,
  ShoppingCart,
  Warehouse,
  UserCheck,
  DoorOpen,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "expired";

interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  phone: string | null;
  address: string | null;
  subscription_status: SubscriptionStatus;
  plan_type: string;
  trial_ends_at: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

interface UsageStats {
  clients: number;
  appointments: number;
  services: number;
  inventory: number;
  team_members: number;
  cabins: number;
  packages: number;
  sales: number;
}

const statusConfig: Record<SubscriptionStatus, { label: string; className: string }> = {
  active: { label: "Activo", className: "bg-green-500 hover:bg-green-600" },
  trial: { label: "Trial", className: "bg-blue-500 hover:bg-blue-600" },
  expired: { label: "Expirado", className: "bg-red-500 hover:bg-red-600" },
  past_due: { label: "Pago Pendiente", className: "bg-yellow-500 hover:bg-yellow-600" },
  cancelled: { label: "Cancelado", className: "bg-gray-500 hover:bg-gray-600" },
};

export function SuperAdminTenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Tenant info
  const { data: tenant, isLoading: loadingTenant } = useQuery({
    queryKey: ["super-admin", "tenant-detail", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId!)
        .single();
      if (error) throw error;
      return data as TenantDetail;
    },
    enabled: !!tenantId,
  });

  // Owner email
  const { data: ownerEmail } = useQuery({
    queryKey: ["super-admin", "tenant-owner-email", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_tenant_owner_email", { _tenant_id: tenantId! });
      if (error) return "Error al obtener email";
      return data as string;
    },
    enabled: !!tenantId,
  });

  // Usage stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["super-admin", "tenant-stats", tenantId],
    queryFn: async () => {
      const [clients, appointments, services, inventory, team, cabins, packages, sales] =
        await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!),
          supabase.from("appointments").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!),
          supabase.from("services").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!),
          supabase.from("inventory").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!),
          supabase.from("team_members").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!),
          supabase.from("cabins").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!),
          supabase.from("packages").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!),
          supabase.from("sales").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId!),
        ]);

      return {
        clients: clients.count ?? 0,
        appointments: appointments.count ?? 0,
        services: services.count ?? 0,
        inventory: inventory.count ?? 0,
        team_members: team.count ?? 0,
        cabins: cabins.count ?? 0,
        packages: packages.count ?? 0,
        sales: sales.count ?? 0,
      } as UsageStats;
    },
    enabled: !!tenantId,
  });

  // Recent activity
  const { data: recentAppointments } = useQuery({
    queryKey: ["super-admin", "tenant-recent-appointments", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, client_name, start_time, status")
        .eq("tenant_id", tenantId!)
        .order("start_time", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Mutation: activate plan
  const activatePlanMutation = useMutation({
    mutationFn: async ({ planType }: { planType: string }) => {
      const months = planType === "annual" ? 12 : 1;
      const { error } = await supabase.rpc("activate_tenant_plan", {
        _tenant_id: tenantId!,
        _plan_type: planType,
        _months: months,
      });
      if (error) throw error;
    },
    onSuccess: (_, { planType }) => {
      logAudit({ tenantId: tenantId!, action: "activate", entityType: "tenant", entityId: tenantId!, details: { planType } });
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
      toast.success("Plan activado exitosamente");
    },
    onError: (error) => {
      toast.error("Error: " + (error as Error).message);
    },
  });

  // Mutation: suspend
  const suspendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tenants")
        .update({ subscription_status: "cancelled" } as Record<string, unknown>)
        .eq("id", tenantId!);
      if (error) throw error;
    },
    onSuccess: () => {
      logAudit({ tenantId: tenantId!, action: "suspend", entityType: "tenant", entityId: tenantId! });
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
      toast.success("Negocio suspendido");
    },
    onError: (error) => {
      toast.error("Error: " + (error as Error).message);
    },
  });

  // Mutation: delete tenant
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete all related data first, then the tenant
      const tables = [
        "audit_log", "tenant_notes", "appointments", "sales", "sale_items", "clients", "services",
        "inventory", "team_members", "cabins", "packages", "package_services",
        "tenant_members", "tenant_invites",
      ];
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("tenant_id", tenantId!);
        if (error) console.warn(`Error deleting from ${table}:`, error.message);
      }
      // Finally delete the tenant
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenantId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Negocio eliminado permanentemente");
      navigate("/super-admin/tenants");
    },
    onError: (error) => {
      toast.error("Error: " + (error as Error).message);
    },
  });

  // Mutation: extend trial
  const extendTrialMutation = useMutation({
    mutationFn: async ({ days }: { days: number }) => {
      const { error } = await supabase.rpc("extend_tenant_trial", {
        _tenant_id: tenantId!,
        _days: days,
      });
      if (error) throw error;
    },
    onSuccess: (_, { days }) => {
      logAudit({ tenantId: tenantId!, action: "extend_trial", entityType: "tenant", entityId: tenantId!, details: { days } });
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
      toast.success("Trial extendido");
    },
    onError: (error) => {
      toast.error("Error: " + (error as Error).message);
    },
  });

  // Mutation: edit tenant info
  const editTenantMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string; address: string }) => {
      const { error } = await supabase
        .from("tenants")
        .update({
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
        } as Record<string, unknown>)
        .eq("id", tenantId!);
      if (error) throw error;
    },
    onSuccess: (_, data) => {
      logAudit({ tenantId: tenantId!, action: "edit", entityType: "tenant", entityId: tenantId!, details: data });
      queryClient.invalidateQueries({ queryKey: ["super-admin"] });
      toast.success("Informacion actualizada");
    },
    onError: (error) => {
      toast.error("Error: " + (error as Error).message);
    },
  });

  const handleImpersonate = () => {
    if (!tenant) return;
    logAudit({ tenantId: tenant.id, action: "impersonate", entityType: "tenant", entityId: tenant.id });
    localStorage.setItem("impersonate_tenant_id", tenant.id);
    toast.success(`Impersonando: ${tenant.name}`);
    navigate("/");
  };

  if (loadingTenant) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Negocio no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/super-admin/tenants")}>
          Volver a Negocios
        </Button>
      </div>
    );
  }

  const statusCfg = statusConfig[tenant.subscription_status];

  const statCards = [
    { label: "Clientes", value: stats?.clients ?? 0, icon: Users, color: "text-blue-500" },
    { label: "Citas", value: stats?.appointments ?? 0, icon: Calendar, color: "text-green-500" },
    { label: "Servicios", value: stats?.services ?? 0, icon: Scissors, color: "text-purple-500" },
    { label: "Productos", value: stats?.inventory ?? 0, icon: Warehouse, color: "text-orange-500" },
    { label: "Ventas", value: stats?.sales ?? 0, icon: ShoppingCart, color: "text-emerald-500" },
    { label: "Equipo", value: stats?.team_members ?? 0, icon: UserCheck, color: "text-indigo-500" },
    { label: "Cabinas", value: stats?.cabins ?? 0, icon: DoorOpen, color: "text-pink-500" },
    { label: "Paquetes", value: stats?.packages ?? 0, icon: Package, color: "text-cyan-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/super-admin/tenants")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
            <Badge variant="default" className={statusCfg.className}>
              {statusCfg.label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">/{tenant.slug}</p>
        </div>
        <TenantActionButtons
          tenant={tenant}
          ownerEmail={ownerEmail}
          onActivatePlan={(planType) => activatePlanMutation.mutate({ planType })}
          isActivating={activatePlanMutation.isPending}
          onExtendTrial={(days) => extendTrialMutation.mutate({ days })}
          isExtending={extendTrialMutation.isPending}
          onSuspend={() => suspendMutation.mutate()}
          isSuspending={suspendMutation.isPending}
          onDelete={() => deleteMutation.mutate()}
          isDeleting={deleteMutation.isPending}
          onImpersonate={handleImpersonate}
        />
      </div>

      {/* Info + Health */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Informacion del Negocio</CardTitle>
            <TenantEditDialog
              tenant={tenant}
              onSave={(data) => editTenantMutation.mutate(data)}
              isSaving={editTenantMutation.isPending}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-muted-foreground">Owner</span>
              <span>{ownerEmail || "Cargando..."}</span>

              <span className="text-muted-foreground">Telefono</span>
              <span>{tenant.phone || "No registrado"}</span>

              <span className="text-muted-foreground">Direccion</span>
              <span>{tenant.address || "No registrada"}</span>

              <span className="text-muted-foreground">Plan</span>
              <span className="capitalize">{tenant.plan_type}</span>

              <span className="text-muted-foreground">Registrado</span>
              <span>
                {new Date(tenant.created_at).toLocaleDateString("es-ES")}
                {" "}
                <span className="text-muted-foreground">
                  ({formatDistanceToNow(new Date(tenant.created_at), { locale: es, addSuffix: true })})
                </span>
              </span>

              {tenant.subscription_status === "trial" && (
                <>
                  <span className="text-muted-foreground">Trial expira</span>
                  <span>
                    {new Date(tenant.trial_ends_at).toLocaleDateString("es-ES")}
                    {" "}
                    <span className="text-muted-foreground">
                      ({formatDistanceToNow(new Date(tenant.trial_ends_at), { locale: es, addSuffix: true })})
                    </span>
                  </span>
                </>
              )}

              {tenant.current_period_end && (
                <>
                  <span className="text-muted-foreground">Periodo termina</span>
                  <span>
                    {new Date(tenant.current_period_end).toLocaleDateString("es-ES")}
                    {" "}
                    <span className="text-muted-foreground">
                      ({formatDistanceToNow(new Date(tenant.current_period_end), { locale: es, addSuffix: true })})
                    </span>
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <TenantHealthCard stats={stats} isLoading={loadingStats} />
      </div>

      {/* Usage Stats Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Uso de la Plataforma</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <TenantRecentActivity appointments={recentAppointments} />
      {/* Support Notes */}
      <TenantNotes tenantId={tenant.id} />
    </div>
  );
}

export default SuperAdminTenantDetail;
