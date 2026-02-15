import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface MonthlyRevenueItem {
  month: string;
  fullMonth: string;
  ventas: number;
  servicios: number;
  total: number;
  gastos: number;
  ganancia: number;
}

interface MonthlyRevenueChartProps {
  data: MonthlyRevenueItem[] | undefined;
  isLoading: boolean;
}

export const MonthlyRevenueChart = memo(function MonthlyRevenueChart({ data, isLoading }: MonthlyRevenueChartProps) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Ingresos Mensuales (Ultimos 6 meses)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-80 bg-muted animate-pulse rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
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
              <Line type="monotone" dataKey="ventas" name="Ventas POS" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ fill: "hsl(221, 83%, 53%)" }} />
              <Line type="monotone" dataKey="servicios" name="Servicios" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ fill: "hsl(142, 71%, 45%)" }} />
              <Line type="monotone" dataKey="total" name="Total Ingresos" stroke="hsl(38, 92%, 50%)" strokeWidth={3} dot={{ fill: "hsl(38, 92%, 50%)" }} />
              <Line type="monotone" dataKey="gastos" name="Gastos" stroke="hsl(0, 84%, 60%)" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "hsl(0, 84%, 60%)" }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});
