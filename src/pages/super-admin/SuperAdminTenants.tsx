import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "expired";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  owner_email: string | null;
  subscription_status: SubscriptionStatus;
  plan_type: string;
  trial_ends_at: string;
  current_period_end: string | null;
  created_at: string;
}

type StatusFilter = "all" | SubscriptionStatus;

/**
 * Página completa de gestión de negocios (tenants).
 *
 * Características:
 * - Búsqueda por nombre o slug
 * - Filtro por estado de suscripción (tabs)
 * - Tabla con acciones: Activar, Suspender, Impersonar
 * - Badge coloreado por estado
 */
export function SuperAdminTenants() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Query: Obtener todos los tenants
  const { data: tenants, isLoading } = useQuery({
    queryKey: ["super-admin", "all-tenants"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tenants_with_owner_email");

      if (error) throw error;
      return (data as Tenant[]) ?? [];
    },
  });

  // Mutation: Actualizar estado de suscripción
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SubscriptionStatus }) => {
      const { error } = await supabase
        .from("tenants")
        .update({ subscription_status: status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["super-admin", "all-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "total-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "active-tenants"] });
      toast.success(
        variables.status === "active"
          ? "Negocio activado correctamente"
          : "Negocio suspendido correctamente"
      );
    },
    onError: (error) => {
      toast.error("Error al actualizar el estado: " + (error as Error).message);
    },
  });

  // Filtrar tenants
  const filteredTenants = tenants?.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || tenant.subscription_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Helper: Badge color por estado
  const getStatusBadge = (status: SubscriptionStatus) => {
    const variants = {
      active: { variant: "default" as const, className: "bg-green-500 hover:bg-green-600" },
      trial: { variant: "default" as const, className: "bg-blue-500 hover:bg-blue-600" },
      expired: { variant: "default" as const, className: "bg-red-500 hover:bg-red-600" },
      past_due: { variant: "default" as const, className: "bg-yellow-500 hover:bg-yellow-600" },
      cancelled: { variant: "default" as const, className: "bg-gray-500 hover:bg-gray-600" },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  // Handler: Activar negocio
  const handleActivate = (tenantId: string) => {
    updateStatusMutation.mutate({ id: tenantId, status: "active" });
  };

  // Handler: Suspender negocio
  const handleSuspend = (tenantId: string) => {
    updateStatusMutation.mutate({ id: tenantId, status: "cancelled" });
  };

  // Handler: Impersonar (setear localStorage y navegar)
  const handleImpersonate = (tenantId: string, tenantName: string) => {
    localStorage.setItem("impersonate_tenant_id", tenantId);
    toast.success(`Impersonando a: ${tenantName}`);
    navigate("/");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Negocios</h1>
        <p className="text-muted-foreground">
          Administra todos los negocios registrados en la plataforma
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra negocios por estado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <Input
            placeholder="Buscar por nombre o slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          {/* Status Tabs */}
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="active">Activos</TabsTrigger>
              <TabsTrigger value="trial">Trial</TabsTrigger>
              <TabsTrigger value="expired">Expirados</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Negocios Registrados ({filteredTenants?.length ?? 0})
          </CardTitle>
          <CardDescription>
            Lista completa de negocios con opciones de administración
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Trial Expira</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants && filteredTenants.length > 0 ? (
                    filteredTenants.map((tenant) => (
                      <TableRow
                        key={tenant.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/super-admin/tenants/${tenant.id}`)}
                      >
                        <TableCell>
                          <span className="font-medium text-primary">
                            {tenant.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tenant.slug}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tenant.owner_email ?? "Sin email"}
                        </TableCell>
                        <TableCell>{getStatusBadge(tenant.subscription_status)}</TableCell>
                        <TableCell>{tenant.plan_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {tenant.subscription_status === "trial"
                            ? new Date(tenant.trial_ends_at).toLocaleDateString("es-ES")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(tenant.created_at).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* Activar/Suspender */}
                            {tenant.subscription_status === "expired" ||
                            tenant.subscription_status === "cancelled" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleActivate(tenant.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Activar
                              </Button>
                            ) : tenant.subscription_status === "active" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSuspend(tenant.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Suspender
                              </Button>
                            ) : null}

                            {/* Impersonar */}
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleImpersonate(tenant.id, tenant.name)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Impersonar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No se encontraron negocios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
