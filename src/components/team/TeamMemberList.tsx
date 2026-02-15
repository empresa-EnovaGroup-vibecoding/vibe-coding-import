import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Mail, Phone } from "lucide-react";
import { TeamMemberFormDialog } from "./TeamMemberFormDialog";
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

export function TeamMemberList() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Tables<"team_members"> | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Tables<"team_members"> | null>(null);
  const queryClient = useQueryClient();
  const { isOwner, tenantId } = useTenant();

  const { data: members, isLoading } = useQuery({
    queryKey: ["teamMembers", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", tenantId] });
      toast.success("Miembro eliminado");
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting team member:", error);
      toast.error("Error al eliminar el miembro");
    },
  });

  const handleEdit = (member: Tables<"team_members">) => {
    setSelectedMember(member);
    setFormOpen(true);
  };

  const handleDelete = (member: Tables<"team_members">) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      deleteMutation.mutate(memberToDelete.id);
    }
  };

  const handleAdd = () => {
    setSelectedMember(null);
    setFormOpen(true);
  };

  const activeCount = members?.filter(m => m.is_active).length || 0;
  const totalCount = members?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Equipo</h1>
          <p className="text-muted-foreground">
            Gestiona los especialistas y miembros del equipo
          </p>
        </div>
        {isOwner && (
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Miembro
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Miembros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Badge variant="default" className="h-6">Disponibles</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
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
              Cargando equipo...
            </div>
          ) : members && members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol / Especialidad</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  {isOwner && <TableHead className="w-[70px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      {member.role ? (
                        <Badge variant="outline">{member.role}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin especificar</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-1">
                        {member.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                        )}
                        {member.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </div>
                        )}
                        {!member.email && !member.phone && (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? "Activo" : "Inactivo"}
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
                            <DropdownMenuItem onClick={() => handleEdit(member)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(member)}
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
              No hay miembros del equipo registrados.
            </div>
          )}
        </CardContent>
      </Card>

      <TeamMemberFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={selectedMember}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente a{" "}
              <strong>{memberToDelete?.name}</strong> del equipo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
