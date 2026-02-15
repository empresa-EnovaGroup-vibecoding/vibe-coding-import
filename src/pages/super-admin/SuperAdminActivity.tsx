import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityEntry {
  id: string;
  tenant_id: string;
  tenant_name: string;
  user_id: string;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function SuperAdminActivity() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ["platform-activity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_platform_activity", {
        _limit: 100,
      });

      if (error) throw error;
      return data as ActivityEntry[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const filteredActivities = activities?.filter((activity) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      activity.tenant_name.toLowerCase().includes(searchLower) ||
      activity.action.toLowerCase().includes(searchLower) ||
      activity.entity_type.toLowerCase().includes(searchLower) ||
      activity.user_email?.toLowerCase().includes(searchLower)
    );
  });

  const getActionBadgeVariant = (action: string): "default" | "destructive" | "outline" => {
    switch (action.toLowerCase()) {
      case "create":
      case "created":
        return "default"; // Green
      case "update":
      case "updated":
        return "outline"; // Blue
      case "delete":
      case "deleted":
        return "destructive"; // Red
      default:
        return "outline";
    }
  };

  const formatDetails = (details: Record<string, unknown> | null): string => {
    if (!details) return "-";

    const keys = Object.keys(details);
    if (keys.length === 0) return "-";

    // Show first 2 keys
    const summary = keys.slice(0, 2).map(key => {
      const value = details[key];
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      return `${key}: ${stringValue.substring(0, 20)}`;
    }).join(", ");

    return keys.length > 2 ? `${summary}...` : summary;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Actividad de la Plataforma</h1>
          <p className="text-muted-foreground">
            Registro de acciones recientes en todos los negocios
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Actividad</CardTitle>
          <CardDescription>
            Ultimas 100 acciones realizadas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por negocio, accion, tipo o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Error al cargar la actividad
            </div>
          ) : !filteredActivities || filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron registros de actividad
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Accion</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {activity.tenant_name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {activity.user_email || "Sistema"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(activity.action)}>
                          {activity.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {activity.entity_type}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {formatDetails(activity.details)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredActivities && filteredActivities.length > 0 && (
            <div className="text-sm text-muted-foreground text-right">
              Mostrando {filteredActivities.length} de {activities?.length || 0} registros
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
