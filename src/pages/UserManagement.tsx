import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Users, UserCog, Trash2, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { InviteDialog } from "@/components/users/InviteDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type TenantRole = "owner" | "admin" | "member";

interface TenantMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: TenantRole;
  created_at: string;
}

export default function UserManagement() {
  const { isOwner, tenantId, loading: roleLoading } = useTenant();
  const navigate = useNavigate();
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [invites, setInvites] = useState<Array<{ id: string; token: string; status: string; expires_at: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isOwner) {
      toast.error("No tienes permiso para acceder a esta página");
      navigate("/");
    }
  }, [isOwner, roleLoading, navigate]);

  const fetchMembers = useCallback(async () => {
    try {
      if (!tenantId) return;

      const { data, error } = await supabase
        .rpc("get_tenant_members", { _tenant_id: tenantId });

      if (error) throw error;

      const formattedMembers: TenantMember[] = (data || []).map((m: Record<string, unknown>) => ({
        id: m.id as string,
        user_id: m.user_id as string,
        email: m.email as string,
        full_name: (m.full_name as string) || null,
        role: m.role as TenantRole,
        created_at: m.created_at as string,
      }));

      setMembers(formattedMembers);
    } catch {
      toast.error("Error al cargar miembros");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const fetchInvites = useCallback(async () => {
    try {
      if (!tenantId) return;
      const { data, error } = await supabase
        .from("tenant_invites")
        .select("id, token, status, expires_at, created_at")
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setInvites(data || []);
    } catch {
      toast.error("Error al cargar invitaciones");
    }
  }, [tenantId]);

  useEffect(() => {
    if (isOwner && tenantId) {
      fetchMembers();
      fetchInvites();
    }
  }, [isOwner, tenantId, fetchMembers, fetchInvites]);

  const cancelInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from("tenant_invites")
      .delete()
      .eq("id", inviteId);
    if (error) {
      toast.error("Error al cancelar invitacion");
    } else {
      toast.success("Invitacion cancelada");
      fetchInvites();
    }
  };

  const assignRole = async (memberId: string, role: TenantRole) => {
    setUpdating(memberId);
    try {
      if (!tenantId) throw new Error("No tenant ID");

      const { error } = await supabase
        .from("tenant_members")
        .update({ role })
        .eq("id", memberId)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      const roleLabel = role === "owner" ? "Propietario" : role === "admin" ? "Administrador" : "Miembro";
      toast.success(`Rol actualizado a ${roleLabel}`);
      fetchMembers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al asignar rol";
      toast.error(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  const removeMember = async (memberId: string) => {
    setUpdating(memberId);
    try {
      if (!tenantId) throw new Error("No tenant ID");

      const { error } = await supabase
        .from("tenant_members")
        .delete()
        .eq("id", memberId)
        .eq("tenant_id", tenantId);

      if (error) throw error;

      toast.success("Miembro eliminado");
      fetchMembers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar miembro";
      toast.error(errorMessage);
    } finally {
      setUpdating(null);
    }
  };

  const getRoleBadge = (role: TenantRole) => {
    if (role === "owner") {
      return (
        <Badge className="bg-purple-600 text-white">
          <Shield className="mr-1 h-3 w-3" />
          Propietario
        </Badge>
      );
    }
    if (role === "admin") {
      return (
        <Badge className="bg-primary text-primary-foreground">
          <Shield className="mr-1 h-3 w-3" />
          Administrador
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Users className="mr-1 h-3 w-3" />
        Miembro
      </Badge>
    );
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  const ownersCount = members.filter((m) => m.role === "owner").length;
  const adminsCount = members.filter((m) => m.role === "admin").length;
  const membersCount = members.filter((m) => m.role === "member").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <UserCog className="h-8 w-8" />
            Gestion de Usuarios
          </h1>
          <p className="text-muted-foreground mt-1">
            Administra los roles y permisos de los usuarios del sistema
          </p>
        </div>
        <InviteDialog onInviteCreated={fetchInvites} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propietarios</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membersCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            Asigna roles a los usuarios para controlar su acceso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay miembros en este tenant aún
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol Actual</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {member.full_name || "Sin nombre"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {member.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => {
                            assignRole(member.id, value as TenantRole);
                          }}
                          disabled={updating === member.id}
                        >
                          <SelectTrigger className="w-[140px]">
                            {updating === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue placeholder="Cambiar rol" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Propietario
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Administrador
                              </div>
                            </SelectItem>
                            <SelectItem value="member">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Miembro
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              disabled={updating === member.id || member.role === "owner"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Eliminar miembro del tenant?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                El miembro perderá todo acceso a este tenant.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeMember(member.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar miembro
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Invitaciones Pendientes
            </CardTitle>
            <CardDescription>
              Links activos esperando ser aceptados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map((invite) => {
                const isExpired = new Date(invite.expires_at) < new Date();
                const link = `${window.location.origin}/invite/${invite.token}`;
                return (
                  <div key={invite.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-mono truncate text-muted-foreground">{link}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isExpired ? (
                          <span className="text-destructive">Expirado</span>
                        ) : (
                          <>Expira: {new Date(invite.expires_at).toLocaleDateString("es-ES")}</>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive ml-2"
                      onClick={() => cancelInvite(invite.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos por Rol</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Propietario</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>✓ Acceso total al tenant</li>
                <li>✓ Gestión de miembros</li>
                <li>✓ Configuración del tenant</li>
                <li>✓ Ver precios de costo</li>
                <li>✓ Todos los reportes</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold">Administrador</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>✓ CRUD completo</li>
                <li>✓ Gestión de inventario</li>
                <li>✓ Reportes completos</li>
                <li>○ Sin gestión de miembros</li>
                <li>○ Sin precios de costo</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Miembro</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>✓ Gestión de citas</li>
                <li>✓ Registro de ventas</li>
                <li>○ Solo lectura en inventario</li>
                <li>✗ Sin eliminación</li>
                <li>✗ Sin reportes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
