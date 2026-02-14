import { useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Receipt } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { useTenant } from "@/hooks/useTenant";
import { cn } from "@/lib/utils";

import { SummaryStatsCards } from "@/components/reports/SummaryStatsCards";
import { MonthlyRevenueChart } from "@/components/reports/MonthlyRevenueChart";
import { PopularServicesChart } from "@/components/reports/PopularServicesChart";
import { PaymentMethodChart } from "@/components/reports/PaymentMethodChart";
import { FrequentClientsSection } from "@/components/reports/FrequentClientsSection";

const Expenses = lazy(() => import("./Expenses"));

interface MonthlyRevenueItem {
  month: string;
  fullMonth: string;
  ventas: number;
  servicios: number;
  total: number;
  gastos: number;
  ganancia: number;
}

export default function Reports() {
  const { tenantId } = useTenant();
  const [activeTab, setActiveTab] = useState<"reportes" | "gastos">("reportes");

  const { data: monthlyRevenue, isLoading: loadingRevenue } = useQuery({
    queryKey: ["monthlyRevenue", tenantId],
    queryFn: async (): Promise<MonthlyRevenueItem[]> => {
      if (!tenantId) return [];
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString();
      const now = endOfMonth(new Date()).toISOString();

      const [salesRes, appointmentsRes, expensesRes] = await Promise.all([
        supabase.from("sales").select("total_amount, created_at").eq("tenant_id", tenantId).gte("created_at", sixMonthsAgo).lte("created_at", now),
        supabase.from("appointments").select("total_price, start_time").eq("tenant_id", tenantId).eq("status", "completed").gte("start_time", sixMonthsAgo).lte("start_time", now),
        supabase.from("expenses").select("amount, expense_date").eq("tenant_id", tenantId).gte("expense_date", sixMonthsAgo.split("T")[0]).lte("expense_date", now.split("T")[0]),
      ]);

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const mStart = startOfMonth(date);
        const mEnd = endOfMonth(date);

        const salesTotal = salesRes.data
          ?.filter(s => { const d = new Date(s.created_at); return d >= mStart && d <= mEnd; })
          .reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

        const appointmentsTotal = appointmentsRes.data
          ?.filter(a => { const d = new Date(a.start_time); return d >= mStart && d <= mEnd; })
          .reduce((sum, a) => sum + Number(a.total_price), 0) || 0;

        const expensesTotal = expensesRes.data
          ?.filter(e => { const d = new Date(e.expense_date); return d >= mStart && d <= mEnd; })
          .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        months.push({
          month: format(date, "MMM", { locale: es }),
          fullMonth: format(date, "MMMM yyyy", { locale: es }),
          ventas: salesTotal,
          servicios: appointmentsTotal,
          total: salesTotal + appointmentsTotal,
          gastos: expensesTotal,
          ganancia: salesTotal + appointmentsTotal - expensesTotal,
        });
      }
      return months;
    },
    enabled: !!tenantId,
  });

  const { data: popularServices, isLoading: loadingServices } = useQuery({
    queryKey: ["popularServices", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("appointment_services")
        .select(`service_id, tenant_id, services (name)`)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      const serviceCounts: Record<string, { name: string; count: number }> = {};
      data?.forEach((item: Record<string, unknown>) => {
        const services = item.services as { name?: string } | null;
        const name = services?.name || "Desconocido";
        if (!serviceCounts[name]) serviceCounts[name] = { name, count: 0 };
        serviceCounts[name].count++;
      });

      return Object.values(serviceCounts).sort((a, b) => b.count - a.count).slice(0, 6);
    },
    enabled: !!tenantId,
  });

  const { data: frequentClients, isLoading: loadingClients } = useQuery({
    queryKey: ["frequentClients", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const [{ data: appointments }, { data: sales }] = await Promise.all([
        supabase.from("appointments").select(`client_id, clients (name)`).eq("tenant_id", tenantId),
        supabase.from("sales").select(`client_id, total_amount, clients (name)`).eq("tenant_id", tenantId).not("client_id", "is", null),
      ]);

      const clientStats: Record<string, { name: string; appointments: number; purchases: number; totalSpent: number }> = {};

      appointments?.forEach((apt: Record<string, unknown>) => {
        const clients = apt.clients as { name?: string } | null;
        const name = clients?.name || "Desconocido";
        const id = apt.client_id as string;
        if (!clientStats[id]) clientStats[id] = { name, appointments: 0, purchases: 0, totalSpent: 0 };
        clientStats[id].appointments++;
      });

      sales?.forEach((sale: Record<string, unknown>) => {
        const id = sale.client_id as string | null;
        if (id && clientStats[id]) {
          clientStats[id].purchases++;
          clientStats[id].totalSpent += Number(sale.total_amount);
        } else if (id) {
          const clients = sale.clients as { name?: string } | null;
          clientStats[id] = { name: clients?.name || "Desconocido", appointments: 0, purchases: 1, totalSpent: Number(sale.total_amount) };
        }
      });

      return Object.values(clientStats).sort((a, b) => (b.appointments + b.purchases) - (a.appointments + a.purchases)).slice(0, 10);
    },
    enabled: !!tenantId,
  });

  const { data: summaryStats } = useQuery({
    queryKey: ["summaryStats", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const thisMonth = startOfMonth(new Date()).toISOString();
      const lastMonth = startOfMonth(subMonths(new Date(), 1)).toISOString();
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1)).toISOString();

      const [thisMonthSalesRes, thisMonthApptsRes, lastMonthSalesRes, lastMonthApptsRes, clientsCountRes, apptsCountRes, expensesRes, salesWithDetailsRes] = await Promise.all([
        supabase.from("sales").select("total_amount").eq("tenant_id", tenantId).gte("created_at", thisMonth),
        supabase.from("appointments").select("total_price").eq("tenant_id", tenantId).eq("status", "completed").gte("start_time", thisMonth),
        supabase.from("sales").select("total_amount").eq("tenant_id", tenantId).gte("created_at", lastMonth).lte("created_at", lastMonthEnd),
        supabase.from("appointments").select("total_price").eq("tenant_id", tenantId).eq("status", "completed").gte("start_time", lastMonth).lte("start_time", lastMonthEnd),
        supabase.from("clients").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
        supabase.from("appointments").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).gte("start_time", thisMonth),
        supabase.from("expenses").select("amount").eq("tenant_id", tenantId).gte("expense_date", thisMonth.split("T")[0]),
        supabase.from("sales").select("total_amount, discount_amount, payment_method").eq("tenant_id", tenantId).gte("created_at", thisMonth),
      ]);

      const thisMonthTotal = (thisMonthSalesRes.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0) + (thisMonthApptsRes.data?.reduce((sum, a) => sum + Number(a.total_price), 0) || 0);
      const lastMonthTotal = (lastMonthSalesRes.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0) + (lastMonthApptsRes.data?.reduce((sum, a) => sum + Number(a.total_price), 0) || 0);
      const percentChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
      const totalExpenses = expensesRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalDiscounts = salesWithDetailsRes.data?.filter(d => Number(d.discount_amount) > 0).reduce((sum, d) => sum + Number(d.discount_amount), 0) || 0;

      const methodBreakdown: Record<string, number> = { cash: 0, card: 0, transfer: 0 };
      salesWithDetailsRes.data?.forEach((s) => {
        const method = s.payment_method || "cash";
        methodBreakdown[method] = (methodBreakdown[method] || 0) + Number(s.total_amount);
      });

      return { thisMonthTotal, lastMonthTotal, percentChange, totalClients: clientsCountRes.count || 0, appointmentsThisMonth: apptsCountRes.count || 0, totalExpenses, totalDiscounts, methodBreakdown };
    },
    enabled: !!tenantId,
  });

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Finanzas</h1>
        <p className="text-muted-foreground mt-1">Estadisticas, reportes y gastos de tu negocio</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-neutral-100 dark:bg-white/5 p-1 w-fit">
        <button
          onClick={() => setActiveTab("reportes")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === "reportes" ? "bg-white dark:bg-neutral-800 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Reportes
        </button>
        <button
          onClick={() => setActiveTab("gastos")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === "gastos" ? "bg-white dark:bg-neutral-800 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Receipt className="h-4 w-4" />
          Gastos
        </button>
      </div>

      {activeTab === "gastos" ? (
        <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-xl" />}>
          <Expenses />
        </Suspense>
      ) : (
        <>
          <SummaryStatsCards summaryStats={summaryStats} />

          <div className="grid gap-6 lg:grid-cols-3">
            <MonthlyRevenueChart data={monthlyRevenue} isLoading={loadingRevenue} />
            <PopularServicesChart data={popularServices} isLoading={loadingServices} />
            <PaymentMethodChart methodBreakdown={summaryStats?.methodBreakdown} />
            <FrequentClientsSection data={frequentClients} isLoading={loadingClients} />
          </div>
        </>
      )}
    </div>
  );
}
