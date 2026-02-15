import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Package, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { PackageFormDialog } from "./PackageFormDialog";

interface PackageData {
  id: string;
  name: string;
  description: string | null;
  total_sessions: number;
  price: number;
  validity_days: number | null;
  is_active: boolean;
  service_id: string | null;
  services?: { name: string } | null;
}

export function PackageList() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackageData | null>(null);
  const queryClient = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select(`*, services(name)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PackageData[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Paquete eliminado");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Error al eliminar el paquete");
      setDeleteTarget(null);
    },
  });

  const handleEdit = (pkg: PackageData) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPackage(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Paquetes</h2>
          <p className="text-muted-foreground">Gestiona los paquetes de sesiones</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Paquete
        </Button>
      </div>

      {!packages || packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl">
          <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No hay paquetes creados</p>
          <Button variant="link" onClick={() => setIsFormOpen(true)}>
            Crear el primer paquete
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <Badge variant={pkg.is_active ? "default" : "secondary"}>
                    {pkg.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sesiones</span>
                  <span className="font-semibold">{pkg.total_sessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Precio</span>
                  <span className="font-semibold text-primary">Q{Number(pkg.price).toFixed(2)}</span>
                </div>
                {pkg.services?.name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Servicio</span>
                    <Badge variant="outline">{pkg.services.name}</Badge>
                  </div>
                )}
                {pkg.validity_days && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Validez</span>
                    <span className="text-sm">{pkg.validity_days} dias</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(pkg)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(pkg)}
                    disabled={deleteMutation.isPending}
                    aria-label="Eliminar paquete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PackageFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        editingPackage={editingPackage}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar paquete</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de que quieres eliminar el paquete "{deleteTarget?.name}"? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
