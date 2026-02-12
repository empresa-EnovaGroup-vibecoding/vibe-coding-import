import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, Clock, DollarSign, Loader2 } from "lucide-react";

type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "expired";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_status: SubscriptionStatus;
  plan_type: string;
  created_at: string;
}

/**
 * Dashboard principal del Super Admin.
 *
 * Muestra:
 * - 4 métricas clave (total negocios, activos, en trial, MRR)
 * - Tabla con últimos 10 negocios registrados
 * - Badge coloreado por estado de suscripción
 */
export function SuperAdminDashboard() {
  const navigate = useNavigate();

  // Query: Total de negocios
  const { data: totalTenants, isLoading: loadingTotal } = useQuery({
    queryKey: ["super-admin", "total-tenants"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Query: Negocios activos
  const { data: activeTenants, isLoading: loadingActive } = useQuery({
    queryKey: ["super-admin", "active-tenants"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true })
        .eq("subscription_status", "active");

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Query: Negocios en trial
  const { data: trialTenants, isLoading: loadingTrial } = useQuery({
    queryKey: ["super-admin", "trial-tenants"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tenants")
        .select("*", { count: "exact", head: true })
        .eq("subscription_status", "trial");

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Query: Últimos negocios registrados
  const { data: recentTenants, isLoading: loadingRecent } = useQuery({
    queryKey: ["super-admin", "recent-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug, subscription_status, plan_type, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Tenant[];
    },
  });

  // Calcular MRR (Monthly Recurring Revenue)
  const mrr = (activeTenants ?? 0) * 49;

  // Helper: Badge color por estado
  const getStatusBadge = (status: SubscriptionStatus) => {
    const variants = {
      active: { variant: "default" as const, className: "bg-green-500 hover:bg-green-600" },
      trial: { variant: "default" as const, className: "bg-blue-500 hover:bg-blue-600" },
      expired: { variant: "default" as const, className: "bg-red-500 hover:bg-red-600" },
      past_due: { variant: "default" as const, className: "bg-yellow-500 hover:bg-yellow-600" },
      cancelled: { variant: "default" as const, className: "bg-gray-500 hover:bg-gray-600" },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const isLoadingMetrics = loadingTotal || loadingActive || loadingTrial;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Vista general de la plataforma Agenda PRO
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Negocios */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Negocios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalTenants}</div>
                <p className="text-xs text-muted-foreground">Registrados en total</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Negocios Activos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negocios Activos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeTenants}</div>
                <p className="text-xs text-muted-foreground">Con suscripción activa</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* En Trial */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Trial</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{trialTenants}</div>
                <p className="text-xs text-muted-foreground">Periodo de prueba</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* MRR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${mrr} USD</div>
                <p className="text-xs text-muted-foreground">Ingresos mensuales recurrentes</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Negocios Registrados</CardTitle>
          <CardDescription>Los 10 negocios más recientes en la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTenants && recentTenants.length > 0 ? (
                    recentTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <button
                            className="font-medium text-left hover:underline hover:text-primary transition-colors"
                            onClick={() => navigate(`/super-admin/tenants/${tenant.id}`)}
                          >
                            {tenant.name}
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                        <TableCell>{getStatusBadge(tenant.subscription_status)}</TableCell>
                        <TableCell>{tenant.plan_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(tenant.created_at).toLocaleDateString("es-ES")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No hay negocios registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {recentTenants && recentTenants.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/super-admin/tenants")}
                  >
                    Ver todos los negocios
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
