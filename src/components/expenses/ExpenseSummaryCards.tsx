import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface ExpenseSummaryCardsProps {
  revenue: number;
  totalExpenses: number;
  prevRev: number;
  prevExp: number;
  period: "week" | "month";
  expenseCount: number;
}

export function ExpenseSummaryCards({
  revenue,
  totalExpenses,
  prevRev,
  prevExp,
  period,
  expenseCount,
}: ExpenseSummaryCardsProps) {
  // Computed values
  const profit = revenue - totalExpenses;
  const prevProfit = prevRev - prevExp;

  const pct = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

  const compLabel = period === "week" ? "vs semana anterior" : "vs mes anterior";

  function ComparisonText({
    current,
    previous,
    invertColor,
  }: {
    current: number;
    previous: number;
    invertColor?: boolean;
  }) {
    if (previous === 0 && current === 0) return null;
    const change = pct(current, previous);
    const isPositive = invertColor ? change <= 0 : change >= 0;
    return (
      <p
        className={`text-xs flex items-center gap-1 mt-1 ${
          isPositive ? "text-green-600" : "text-red-500"
        }`}
      >
        {change >= 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {change >= 0 ? "+" : ""}
        {change.toFixed(1)}% {compLabel}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            Q{revenue.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Ventas + Servicios</p>
          <ComparisonText current={revenue} previous={prevRev} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gastos</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            Q{totalExpenses.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {expenseCount} {expenseCount === 1 ? "registro" : "registros"}
          </p>
          <ComparisonText current={totalExpenses} previous={prevExp} invertColor />
        </CardContent>
      </Card>
      <Card
        className={
          profit >= 0
            ? "border-green-200 dark:border-green-900"
            : "border-red-200 dark:border-red-900"
        }
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              profit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            Q{profit.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Ingresos - Gastos</p>
          <ComparisonText current={profit} previous={prevProfit} />
        </CardContent>
      </Card>
    </div>
  );
}
