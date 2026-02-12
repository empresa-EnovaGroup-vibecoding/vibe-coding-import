import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { TrendingUp, Users, Scissors, DollarSign, Calendar } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { useTenant } from "@/hooks/useTenant";

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
];

export default function Reports() {
  const { tenantId } = useTenant();

  // Get monthly revenue for last 6 months
  const { data: monthlyRevenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ["monthlyRevenue", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();

        // Get sales revenue
        const { data: sales } = await supabase
          .from("sales")
          .select("total_amount")
          .eq("tenant_id", tenantId)
          .gte("created_at", start)
          .lte("created_at", end);

        // Get appointments revenue
        const { data: appointments } = await supabase
          .from("appointments")
          .select("total_price")
          .eq("tenant_id", tenantId)
          .eq("status", "completed")
          .gte("start_time", start)
          .lte("start_time", end);

        const salesTotal = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
        const appointmentsTotal = appointments?.reduce((sum, a) => sum + Number(a.total_price), 0) || 0;

        months.push({
          month: format(date, "MMM", { locale: es }),
          fullMonth: format(date, "MMMM yyyy", { locale: es }),
          ventas: salesTotal,
          servicios: appointmentsTotal,
          total: salesTotal + appointmentsTotal,
        });
      }
      return months;
    },
    enabled: !!tenantId,
  });

  // Get popular services
  const { data: popularServices, isLoading: loadingServices } = useQuery({
    queryKey: ["popularServices", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("appointment_services")
        .select(`
          service_id,
          tenant_id,
          services (name)
        `)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      // Count services
      const serviceCounts: Record<string, { name: string; count: number }> = {};
      data?.forEach((item: any) => {
        const name = item.services?.name || "Desconocido";
        if (!serviceCounts[name]) {
          serviceCounts[name] = { name, count: 0 };
        }
        serviceCounts[name].count++;
      });

      return Object.values(serviceCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    },
    enabled: !!tenantId,
  });

  // Get frequent clients
  const { data: frequentClients, isLoading: loadingClients } = useQuery({
    queryKey: ["frequentClients", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      // Get appointment counts per client
      const { data: appointments } = await supabase
        .from("appointments")
        .select(`
          client_id,
          clients (name)
        `)
        .eq("tenant_id", tenantId);

      // Get sales counts per client
      const { data: sales } = await supabase
        .from("sales")
        .select(`
          client_id,
          total_amount,
          clients (name)
        `)
        .eq("tenant_id", tenantId)
        .not("client_id", "is", null);

      const clientStats: Record<string, { 
        name: string; 
        appointments: number; 
        purchases: number;
        totalSpent: number;
      }> = {};

      appointments?.forEach((apt: any) => {
        const name = apt.clients?.name || "Desconocido";
        const id = apt.client_id;
        if (!clientStats[id]) {
          clientStats[id] = { name, appointments: 0, purchases: 0, totalSpent: 0 };
        }
        clientStats[id].appointments++;
      });

      sales?.forEach((sale: any) => {
        const id = sale.client_id;
        if (id && clientStats[id]) {
          clientStats[id].purchases++;
          clientStats[id].totalSpent += Number(sale.total_amount);
        } else if (id) {
          const name = sale.clients?.name || "Desconocido";
          clientStats[id] = { 
            name, 
            appointments: 0, 
            purchases: 1, 
            totalSpent: Number(sale.total_amount) 
          };
        }
      });

      return Object.values(clientStats)
        .sort((a, b) => (b.appointments + b.purchases) - (a.appointments + a.purchases))
        .slice(0, 10);
    },
    enabled: !!tenantId,
  });

  // Get summary stats
  const { data: summaryStats } = useQuery({
    queryKey: ["summaryStats", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const thisMonth = startOfMonth(new Date()).toISOString();
      const lastMonth = startOfMonth(subMonths(new Date(), 1)).toISOString();
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1)).toISOString();

      // This month sales
      const { data: thisMonthSales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("tenant_id", tenantId)
        .gte("created_at", thisMonth);

      const { data: thisMonthAppointments } = await supabase
        .from("appointments")
        .select("total_price")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("start_time", thisMonth);

      // Last month for comparison
      const { data: lastMonthSales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("tenant_id", tenantId)
        .gte("created_at", lastMonth)
        .lte("created_at", lastMonthEnd);

      const { data: lastMonthAppointments } = await supabase
        .from("appointments")
        .select("total_price")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .gte("start_time", lastMonth)
        .lte("start_time", lastMonthEnd);

      const thisMonthTotal = 
        (thisMonthSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0) +
        (thisMonthAppointments?.reduce((sum, a) => sum + Number(a.total_price), 0) || 0);

      const lastMonthTotal = 
        (lastMonthSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0) +
        (lastMonthAppointments?.reduce((sum, a) => sum + Number(a.total_price), 0) || 0);

      const percentChange = lastMonthTotal > 0 
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
        : 0;

      // Total clients
      const { count: totalClients } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      // Total appointments this month
      const { count: appointmentsThisMonth } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("start_time", thisMonth);

      return {
        thisMonthTotal,
        lastMonthTotal,
        percentChange,
        totalClients: totalClients || 0,
        appointmentsThisMonth: appointmentsThisMonth || 0,
      };
    },
    enabled: !!tenantId,
  });

  const totalRevenue = monthlyRevenue?.reduce((sum, m) => sum + m.total, 0) || 0;

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reportes</h1>
        <p className="text-muted-foreground mt-1">Estadísticas y análisis de tu negocio</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q{summaryStats?.thisMonthTotal.toFixed(2) || "0.00"}</div>
            <p className={`text-xs ${summaryStats?.percentChange && summaryStats.percentChange >= 0 ? "text-success" : "text-destructive"}`}>
              {summaryStats?.percentChange !== undefined && (
                <>
                  {summaryStats.percentChange >= 0 ? "+" : ""}
                  {summaryStats.percentChange.toFixed(1)}% vs mes anterior
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total 6 Meses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Q{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Ingresos acumulados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">Clientes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas del Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats?.appointmentsThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Citas programadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Revenue Chart */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ingresos Mensuales (Últimos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <div className="h-80 bg-muted animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `Q${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`Q${value.toFixed(2)}`, ""]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullMonth || label}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ventas"
                    name="Ventas POS"
                    stroke="hsl(221, 83%, 53%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(221, 83%, 53%)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="servicios"
                    name="Servicios"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(142, 71%, 45%)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total"
                    stroke="hsl(38, 92%, 50%)"
                    strokeWidth={3}
                    dot={{ fill: "hsl(38, 92%, 50%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Servicios Más Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingServices ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : !popularServices || popularServices.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No hay datos de servicios
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={popularServices}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {popularServices.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} veces`, "Realizados"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Frequent Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Clientes Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingClients ? (
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            ) : !frequentClients || frequentClients.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No hay datos de clientes
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={frequentClients.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="appointments" 
                    name="Citas" 
                    fill="hsl(221, 83%, 53%)" 
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey="purchases" 
                    name="Compras" 
                    fill="hsl(142, 71%, 45%)" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      {frequentClients && frequentClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clientes por Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Citas</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Compras</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Gastado</th>
                  </tr>
                </thead>
                <tbody>
                  {frequentClients.map((client, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{client.name}</td>
                      <td className="py-3 px-4 text-center">{client.appointments}</td>
                      <td className="py-3 px-4 text-center">{client.purchases}</td>
                      <td className="py-3 px-4 text-right font-medium text-primary">
                        Q{client.totalSpent.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
