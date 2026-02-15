import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, TrendingUp, Loader2 } from "lucide-react";

interface UsageStats {
  clients: number;
  appointments: number;
  services: number;
  inventory: number;
  sales: number;
}

interface TenantHealthCardProps {
  stats: UsageStats | undefined;
  isLoading: boolean;
}

function getHealthScore(s: UsageStats) {
  const totalActivity = s.clients + s.appointments + s.services + s.inventory;
  if (totalActivity === 0) return { label: "Sin actividad", color: "text-red-500", icon: AlertTriangle };
  if (totalActivity < 5) return { label: "Actividad baja", color: "text-yellow-500", icon: Clock };
  return { label: "Activo", color: "text-green-500", icon: TrendingUp };
}

export function TenantHealthCard({ stats, isLoading }: TenantHealthCardProps) {
  const health = stats ? getHealthScore(stats) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salud del Negocio</CardTitle>
        <CardDescription>Basado en el uso de la plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : health && stats ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <health.icon className={`h-8 w-8 ${health.color}`} />
              <div>
                <p className={`text-xl font-bold ${health.color}`}>{health.label}</p>
                <p className="text-sm text-muted-foreground">
                  {stats.clients + stats.appointments + stats.services + stats.inventory} acciones totales
                </p>
              </div>
            </div>
            <Separator />
            <div className="text-sm space-y-2">
              {stats.clients === 0 && stats.appointments === 0 ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span>No ha creado clientes ni citas - riesgo de abandono</span>
                </div>
              ) : stats.appointments === 0 ? (
                <div className="flex items-center gap-2 text-yellow-500">
                  <Clock className="h-4 w-4" />
                  <span>Tiene clientes pero no ha agendado citas</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-500">
                  <TrendingUp className="h-4 w-4" />
                  <span>Negocio activo con clientes y citas</span>
                </div>
              )}
              {stats.inventory === 0 && (
                <p className="text-muted-foreground">No ha cargado inventario todavia</p>
              )}
              {stats.sales > 0 && (
                <p className="text-green-600 font-medium">
                  Ya esta generando ventas ({stats.sales} registradas)
                </p>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
