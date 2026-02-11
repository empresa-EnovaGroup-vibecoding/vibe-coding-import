import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TodayAppointments } from "@/components/dashboard/TodayAppointments";
import { Calendar, Users, Package, AlertTriangle } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";

export default function Dashboard() {
  const { tenantId } = useTenant();
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { data: todayAppointmentsCount } = useQuery({
    queryKey: ["todayAppointmentsCount", tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const { count, error } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("start_time", startOfDay)
        .lte("start_time", endOfDay);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!tenantId,
  });

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

  return (
    <div className="space-y-8 pt-12 lg:pt-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen general de tu negocio
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Citas de Hoy"
          value={todayAppointmentsCount ?? 0}
          icon={Calendar}
          description="Citas programadas"
          variant="primary"
        />
        <MetricCard
          title="Total Clientes"
          value={totalClients ?? 0}
          icon={Users}
          description="Clientes registrados"
          variant="success"
        />
        <MetricCard
          title="Stock Bajo"
          value={lowStockCount ?? 0}
          icon={lowStockCount && lowStockCount > 0 ? AlertTriangle : Package}
          description="Productos con menos de 5 unidades"
          variant={lowStockCount && lowStockCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Today's Appointments */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayAppointments />
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Acciones Rápidas</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}
