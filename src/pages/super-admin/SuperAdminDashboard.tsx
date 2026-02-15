import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Building2, CheckCircle2, Clock, DollarSign, Loader2, AlertTriangle, Users } from "lucide-react";

type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "expired";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  owner_email: string | null;
  subscription_status: SubscriptionStatus;
  plan_type: string;
  trial_ends_at: string;
  current_period_end: string | null;
  created_at: string;
}

export function SuperAdminDashboard() {
  const navigate = useNavigate();

  // Query: All tenants with owner email (single efficient query)
  const { data: allTenants, isLoading: loadingTenants } = useQuery({
    queryKey: ["super-admin", "all-tenants-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tenants_with_owner_email");
      if (error) throw error;
      return (data as Tenant[]) ?? [];
    },
  });

  // Query: Total clients across all tenants
  const { data: totalClients, isLoading: loadingClients } = useQuery({
    queryKey: ["super-admin", "total-clients"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Derived metrics
  const totalTenants = allTenants?.length ?? 0;
  const activeTenants = allTenants?.filter((t) => t.subscription_status === "active").length ?? 0;
  const trialTenants = allTenants?.filter((t) => t.subscription_status === "trial").length ?? 0;
  const mrr = activeTenants * 49;

  // Trials expiring in next 7 days
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiringTrials = allTenants?.filter((t) => {
    if (t.subscription_status !== "trial" || !t.trial_ends_at) return false;
    const trialEnd = new Date(t.trial_ends_at);
    return trialEnd <= sevenDaysFromNow && trialEnd >= now;
  }) ?? [];

  // Recent tenants (last 10)
  const recentTenants = allTenants?.slice(0, 10) ?? [];

  const isLoading = loadingTenants;

  // Helper: Badge color por estado
  const getStatusBadge = (status: SubscriptionStatus) => {
    const variants = {
      active: { className: "bg-green-500 hover:bg-green-600" },
      trial: { className: "bg-blue-500 hover:bg-blue-600" },
      expired: { className: "bg-red-500 hover:bg-red-600" },
      past_due: { className: "bg-yellow-500 hover:bg-yellow-600" },
      cancelled: { className: "bg-gray-500 hover:bg-gray-600" },
    };
    const config = variants[status];
    return (
      <Badge className={config.className}>
        {status}
      </Badge>
    );
  };

  // Helper: days until trial expires
  const daysUntilExpiry = (dateStr: string): number => {
    const diff = new Date(dateStr).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Link to="/super-admin/tenants" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Negocios</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalTenants}</div>
                  <p className="text-xs text-muted-foreground">Registrados en total</p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link to="/super-admin/tenants?status=active" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{activeTenants}</div>
                  <p className="text-xs text-muted-foreground">Suscripcion activa</p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link to="/super-admin/tenants?status=trial" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Trial</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{trialTenants}</div>
                  <p className="text-xs text-muted-foreground">Periodo de prueba</p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loadingClients ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalClients}</div>
                <p className="text-xs text-muted-foreground">En toda la plataforma</p>
              </>
            )}
          </CardContent>
        </Card>

        <Link to="/super-admin/revenue" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">${mrr} USD</div>
                  <p className="text-xs text-muted-foreground">Ingresos mensuales</p>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Trials Expiring Soon */}
      {expiringTrials.length > 0 && (
        <Card className="border-yellow-300 dark:border-yellow-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Trials por Vencer ({expiringTrials.length})
            </CardTitle>
            <CardDescription>Negocios cuyo trial expira en los proximos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringTrials.map((tenant) => {
                const days = daysUntilExpiry(tenant.trial_ends_at);
                return (
                  <Link
                    key={tenant.id}
                    to={`/super-admin/tenants/${tenant.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenant.owner_email ?? "Sin email"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        days <= 2
                          ? "border-red-500 text-red-600"
                          : "border-yellow-500 text-yellow-600"
                      }
                    >
                      {days <= 0 ? "Vence hoy" : `${days} dia${days > 1 ? "s" : ""}`}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ultimos Negocios Registrados</CardTitle>
          <CardDescription>Los 10 negocios mas recientes en la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTenants ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Creado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTenants.length > 0 ? (
                    recentTenants.map((tenant) => (
                      <TableRow
                        key={tenant.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/super-admin/tenants/${tenant.id}`)}
                      >
                        <TableCell>
                          <span className="font-medium text-primary">
                            {tenant.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tenant.owner_email ?? "Sin email"}
                        </TableCell>
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

              {recentTenants.length > 0 && (
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
