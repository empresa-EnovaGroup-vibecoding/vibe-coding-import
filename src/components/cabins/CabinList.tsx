import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, DoorOpen } from "lucide-react";
import { CabinFormDialog } from "./CabinFormDialog";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import type { Tables } from "@/integrations/supabase/types";
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

export function CabinList() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState<Tables<"cabins"> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cabinToDelete, setCabinToDelete] = useState<Tables<"cabins"> | null>(null);
  const queryClient = useQueryClient();
  const { isOwner, tenantId } = useTenant();

  const { data: cabins, isLoading } = useQuery({
    queryKey: ["cabins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cabins")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cabins")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabins"] });
      toast.success("Cabina eliminada");
      setDeleteDialogOpen(false);
      setCabinToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting cabin:", error);
      toast.error("Error al eliminar la cabina");
    },
  });

  const handleEdit = (cabin: Tables<"cabins">) => {
    setSelectedCabin(cabin);
    setFormOpen(true);
  };

  const handleDelete = (cabin: Tables<"cabins">) => {
    setCabinToDelete(cabin);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (cabinToDelete) {
      deleteMutation.mutate(cabinToDelete.id);
    }
  };

  const handleAdd = () => {
    setSelectedCabin(null);
    setFormOpen(true);
  };

  const activeCount = cabins?.filter(c => c.is_active).length || 0;
  const totalCount = cabins?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cabinas</h1>
          <p className="text-muted-foreground">
            Gestiona los espacios de servicio disponibles
          </p>
        </div>
        {isOwner && (
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Cabina
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cabinas</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Badge variant="default" className="h-6">Disponibles</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
            <Badge variant="secondary" className="h-6">No disponibles</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{totalCount - activeCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Cargando cabinas...
            </div>
          ) : cabins && cabins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  {isOwner && <TableHead className="w-[70px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cabins.map((cabin) => (
                  <TableRow key={cabin.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                        {cabin.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {cabin.description ? (
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {cabin.description}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cabin.is_active ? "default" : "secondary"}>
                        {cabin.is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    {isOwner && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleEdit(cabin)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(cabin)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No hay cabinas registradas.
            </div>
          )}
        </CardContent>
      </Card>

      <CabinFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        cabin={selectedCabin}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cabina?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente{" "}
              <strong>{cabinToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
