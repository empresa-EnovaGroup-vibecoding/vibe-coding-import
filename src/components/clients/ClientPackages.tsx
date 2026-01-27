import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, Plus, MinusCircle } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { AssignPackageDialog } from "./AssignPackageDialog";

interface ClientPackagesProps {
  clientId: string;
}

interface ClientPackageData {
  id: string;
  sessions_total: number;
  sessions_used: number;
  purchased_at: string;
  expires_at: string | null;
  notes: string | null;
  packages: {
    name: string;
    services: { name: string } | null;
  };
}

export function ClientPackages({ clientId }: ClientPackagesProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: clientPackages, isLoading } = useQuery({
    queryKey: ["clientPackages", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_packages")
        .select(`
          *,
          packages (
            name,
            services (name)
          )
        `)
        .eq("client_id", clientId)
        .order("purchased_at", { ascending: false });

      if (error) throw error;
      return data as ClientPackageData[];
    },
  });

  const useSessionMutation = useMutation({
    mutationFn: async (clientPackageId: string) => {
      const { error } = await supabase.rpc("use_package_session", {
        p_client_package_id: clientPackageId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientPackages", clientId] });
      toast.success("Sesión descontada del paquete");
    },
    onError: (error: Error) => {
      if (error.message.includes("expired")) {
        toast.error("El paquete ha expirado");
      } else if (error.message.includes("No sessions")) {
        toast.error("No quedan sesiones disponibles");
      } else {
        toast.error("Error al descontar la sesión");
      }
    },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "d MMM yyyy", { locale: es }) : null;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5" />
          Paquetes del Cliente
        </h3>
        <Button size="sm" onClick={() => setIsAssignOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" />
          Asignar Paquete
        </Button>
      </div>

      {!clientPackages || clientPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-lg">
          <Package className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No tiene paquetes asignados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clientPackages.map((cp) => {
            const sessionsRemaining = cp.sessions_total - cp.sessions_used;
            const progressPercent = (cp.sessions_used / cp.sessions_total) * 100;
            const expired = isExpired(cp.expires_at);

            return (
              <div
                key={cp.id}
                className={`rounded-lg border p-4 ${
                  expired ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">{cp.packages.name}</p>
                    {cp.packages.services?.name && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {cp.packages.services.name}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {expired ? (
                      <Badge variant="destructive">Expirado</Badge>
                    ) : sessionsRemaining === 0 ? (
                      <Badge variant="secondary">Agotado</Badge>
                    ) : (
                      <Badge variant="default">
                        {sessionsRemaining} restantes
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span>
                      {cp.sessions_used} / {cp.sessions_total} usadas
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Comprado: {formatDate(cp.purchased_at)}</p>
                    {cp.expires_at && (
                      <p>Expira: {formatDate(cp.expires_at)}</p>
                    )}
                  </div>
                  {!expired && sessionsRemaining > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => useSessionMutation.mutate(cp.id)}
                      disabled={useSessionMutation.isPending}
                      className="gap-1"
                    >
                      <MinusCircle className="h-4 w-4" />
                      Usar Sesión
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssignPackageDialog
        open={isAssignOpen}
        onOpenChange={() => setIsAssignOpen(false)}
        clientId={clientId}
      />
    </div>
  );
}
