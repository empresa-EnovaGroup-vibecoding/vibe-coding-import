import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecentAppointment {
  id: string;
  client_name: string;
  start_time: string;
  status: string;
}

interface TenantRecentActivityProps {
  appointments: RecentAppointment[] | undefined;
}

export function TenantRecentActivity({ appointments }: TenantRecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Ultimas 5 citas registradas</CardDescription>
      </CardHeader>
      <CardContent>
        {appointments && appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{apt.client_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(apt.start_time).toLocaleString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {apt.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay citas registradas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
