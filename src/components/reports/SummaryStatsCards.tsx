import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Users, DollarSign, Calendar, Tag } from "lucide-react";

interface SummaryStats {
  thisMonthTotal: number;
  percentChange: number;
  totalExpenses: number;
  totalDiscounts: number;
  totalClients: number;
  appointmentsThisMonth: number;
}

interface SummaryStatsCardsProps {
  summaryStats: SummaryStats | null | undefined;
}

export function SummaryStatsCards({ summaryStats }: SummaryStatsCardsProps) {
  const profit = (summaryStats?.thisMonthTotal ?? 0) - (summaryStats?.totalExpenses ?? 0);

  return (
    <>
      {/* Primary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Q{summaryStats?.totalExpenses.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Alquiler, insumos, nomina...</p>
          </CardContent>
        </Card>

        <Card className={profit >= 0 ? "border-green-200" : "border-red-200"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              Q{profit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Ingresos - Gastos</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descuentos Otorgados</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">Q{summaryStats?.totalDiscounts.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
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
    </>
  );
}
