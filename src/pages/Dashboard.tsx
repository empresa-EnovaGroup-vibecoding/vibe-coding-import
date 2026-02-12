import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TodayAppointments } from "@/components/dashboard/TodayAppointments";
import { Calendar, Users, Package, AlertTriangle, DollarSign, CheckCircle2, ShoppingCart } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";

export default function Dashboard() {
  const { tenantId } = useTenant();

  // Date helpers
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Today's appointments count
  const { data: todayAppointmentsCount } = useQuery({
    queryKey: ["todayAppointmentsCount", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const { count, error } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("start_time", startOfToday)
        .lte("start_time", endOfToday);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!tenantId,
  });

  // Today's completed appointments
  const { data: completedToday } = useQuery({
    queryKey: ["completedToday", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const { count, error } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("start_time", startOfToday)
        .lte("start_time", endOfToday);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!tenantId,
  });

  // Total clients
  const { data: totalClients } = useQuery({
    queryKey: ["totalClients", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const { count, error } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!tenantId,
  });

  // Low stock count
  const { data: lowStockCount } = useQuery({
    queryKey: ["lowStockCount", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const { count, error } = await supabase
        .from("inventory")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .lt("stock_level", 5);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!tenantId,
  });

  // Today's revenue
  const { data: todayRevenue } = useQuery({
    queryKey: ["todayRevenue", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const { data, error } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("tenant_id", tenantId)
        .gte("created_at", startOfToday)
        .lte("created_at", endOfToday);
      if (error) throw error;
      return data?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;
    },
    enabled: !!tenantId,
  });

  // Monthly revenue
  const { data: monthlyRevenue } = useQuery({
    queryKey: ["monthlyRevenue", tenantId, startOfMonth],
    queryFn: async () => {
      if (!tenantId) return 0;
      const { data, error } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("tenant_id", tenantId)
        .gte("created_at", startOfMonth);
      if (error) throw error;
      return data?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;
    },
    enabled: !!tenantId,
  });

  return (
    <div className="space-y-8 pt-12 lg:pt-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen general de tu negocio
        </p>
      </div>

      {/* Metrics Grid - 2 rows */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Citas de Hoy"
          value={todayAppointmentsCount ?? 0}
          icon={Calendar}
          description="Citas programadas"
          variant="primary"
        />
        <MetricCard
          title="Completadas Hoy"
          value={`${completedToday ?? 0} / ${todayAppointmentsCount ?? 0}`}
          icon={CheckCircle2}
          description="Citas terminadas"
          variant="success"
        />
        <MetricCard
          title="Ingresos Hoy"
          value={`Q${(todayRevenue ?? 0).toFixed(2)}`}
          icon={DollarSign}
          description="Ventas del dia"
          variant="primary"
        />
        <MetricCard
          title="Ingresos del Mes"
          value={`Q${(monthlyRevenue ?? 0).toFixed(2)}`}
          icon={ShoppingCart}
          description={new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          variant="success"
        />
        <MetricCard
          title="Total Clientes"
          value={totalClients ?? 0}
          icon={Users}
          description="Clientes registrados"
          variant="default"
        />
        <MetricCard
          title="Stock Bajo"
          value={lowStockCount ?? 0}
          icon={lowStockCount && lowStockCount > 0 ? AlertTriangle : Package}
          description="Productos con menos de 5 unidades"
          variant={lowStockCount && lowStockCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Today's Appointments + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayAppointments />
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Acciones Rapidas</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="/appointments"
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary group"
            >
              <Calendar className="h-5 w-5 group-hover:text-primary-foreground" />
              <span className="font-medium">Nueva Cita</span>
            </a>
            <a
              href="/clients"
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary group"
            >
              <Users className="h-5 w-5 group-hover:text-primary-foreground" />
              <span className="font-medium">Nuevo Cliente</span>
            </a>
            <a
              href="/pos"
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary group"
            >
              <ShoppingCart className="h-5 w-5 group-hover:text-primary-foreground" />
              <span className="font-medium">Nueva Venta</span>
            </a>
            <a
              href="/inventory"
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary group"
            >
              <Package className="h-5 w-5 group-hover:text-primary-foreground" />
              <span className="font-medium">Inventario</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
