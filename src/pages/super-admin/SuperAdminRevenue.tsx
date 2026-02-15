import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, Users, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ActiveTenant {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  current_period_end: string | null;
}

interface TrialTenant {
  id: string;
  name: string;
  slug: string;
  trial_ends_at: string;
}

/**
 * Página de ingresos (revenue) del Super Admin.
 *
 * Muestra:
 * - MRR (Monthly Recurring Revenue)
 * - ARR (Annual Recurring Revenue)
 * - Negocios en trial que convierten pronto (próximos 3 días)
 * - Tabla de negocios activos con fecha de último pago
 */
export function SuperAdminRevenue() {
  // Query: Negocios activos
  const { data: activeTenants, isLoading: loadingActive } = useQuery({
    queryKey: ["super-admin", "revenue-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug, subscription_status, current_period_end")
        .eq("subscription_status", "active")
        .order("name");

      if (error) throw error;
      return data as ActiveTenant[];
    },
  });

  // Query: Negocios en trial que expiran pronto (próximos 3 días)
  const { data: upcomingConversions, isLoading: loadingConversions } = useQuery({
    queryKey: ["super-admin", "upcoming-conversions"],
    queryFn: async () => {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug, trial_ends_at")
        .eq("subscription_status", "trial")
        .gte("trial_ends_at", now.toISOString())
        .lte("trial_ends_at", threeDaysFromNow.toISOString())
        .order("trial_ends_at");

      if (error) throw error;
      return data as TrialTenant[];
    },
  });

  // Query: All tenants for growth chart
  const { data: allTenants } = useQuery({
    queryKey: ["super-admin", "revenue-all-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, created_at, subscription_status")
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Calcular MRR y ARR
  const activeTenantCount = activeTenants?.length ?? 0;
  const mrr = activeTenantCount * 49; // $49 USD por tenant activo
  const arr = mrr * 12;
  const totalTrials = allTenants?.filter((t) => t.subscription_status === "trial").length ?? 0;

  // Build monthly growth data (last 6 months)
  const getMonthlyGrowth = () => {
    if (!allTenants) return [];
    const months: { month: string; registros: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
      const count = allTenants.filter((t) => {
        const created = new Date(t.created_at);
        return created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth();
      }).length;
      months.push({ month: label, registros: count });
    }
    return months;
  };
  const monthlyData = getMonthlyGrowth();

  // Helper: Calcular días restantes de trial
  const getDaysUntilEnd = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ingresos</h1>
        <p className="text-muted-foreground">
          Métricas de ingresos y conversiones de la plataforma
        </p>
      </div>

      {/* Revenue Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* MRR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loadingActive ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${mrr} USD</div>
                <p className="text-xs text-muted-foreground">
                  {activeTenantCount} negocios activos × $49/mes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* ARR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loadingActive ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${arr} USD</div>
                <p className="text-xs text-muted-foreground">
                  Ingresos anuales recurrentes (MRR × 12)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Conversiones Próximas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversiones Próximas</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {loadingConversions ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{upcomingConversions?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Trials expiran en los próximos 3 días
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Trials */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Trial</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loadingActive ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalTrials}</div>
                <p className="text-xs text-muted-foreground">
                  Potencial: ${totalTrials * 49} USD/mes
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Crecimiento Mensual</CardTitle>
          <CardDescription>Negocios registrados por mes (ultimos 6 meses)</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip />
                <Bar dataKey="registros" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin datos de registros
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Conversions Table */}
      {upcomingConversions && upcomingConversions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Próximas Conversiones</CardTitle>
            <CardDescription>
              Negocios en trial que deben decidir en los próximos 3 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Trial Expira</TableHead>
                  <TableHead>Días Restantes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingConversions.map((tenant) => {
                  const daysLeft = getDaysUntilEnd(tenant.trial_ends_at);
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(tenant.trial_ends_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className={
                            daysLeft <= 1
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-orange-500 hover:bg-orange-600"
                          }
                        >
                          {daysLeft} {daysLeft === 1 ? "día" : "días"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Active Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Negocios Activos</CardTitle>
          <CardDescription>
            Negocios con suscripción activa y fecha de último pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingActive ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Periodo Termina</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTenants && activeTenants.length > 0 ? (
                  activeTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell className="text-muted-foreground">{tenant.slug}</TableCell>
                      <TableCell className="text-sm">
                        {tenant.current_period_end
                          ? new Date(tenant.current_period_end).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No hay negocios activos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
