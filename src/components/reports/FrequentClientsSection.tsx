import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ClientData {
  name: string;
  appointments: number;
  purchases: number;
  totalSpent: number;
}

interface FrequentClientsSectionProps {
  data: ClientData[] | undefined;
  isLoading: boolean;
}

export function FrequentClientsSection({ data, isLoading }: FrequentClientsSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No hay datos de clientes
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.slice(0, 5)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="appointments" name="Citas" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="purchases" name="Compras" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 10 Table */}
      <Card className="lg:col-span-3">
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
                {data.map((client, index) => (
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
    </>
  );
}
