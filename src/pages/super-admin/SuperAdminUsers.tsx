import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Loader2, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportToCSV } from "@/lib/csv";

interface PlatformUser {
  member_id: string;
  user_id: string;
  user_email: string;
  full_name: string | null;
  role: string;
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  joined_at: string;
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "owner":
      return "default"; // purple
    case "staff":
      return "secondary"; // blue
    case "super_admin":
      return "destructive"; // red
    default:
      return "outline";
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default"; // green
    case "trial":
      return "secondary"; // blue
    case "expired":
      return "destructive"; // red
    case "cancelled":
      return "outline"; // gray
    default:
      return "outline";
  }
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    owner: "Propietario",
    staff: "Staff",
    super_admin: "Super Admin",
  };
  return labels[role] || role;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: "Activo",
    trial: "Prueba",
    expired: "Expirado",
    cancelled: "Cancelado",
  };
  return labels[status] || status;
};

export function SuperAdminUsers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users, isLoading } = useQuery({
    queryKey: ["platform-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_platform_users");
      if (error) throw error;
      return data as PlatformUser[];
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole =
      roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Usuarios de la Plataforma</h1>
            <p className="text-muted-foreground">
              Todos los usuarios registrados en el sistema
            </p>
          </div>
        </div>
        {filteredUsers && filteredUsers.length > 0 && (
          <Button
            variant="outline"
            onClick={() => exportToCSV(filteredUsers, [
              { header: "Email", accessor: (u) => u.user_email },
              { header: "Nombre", accessor: (u) => u.full_name ?? "" },
              { header: "Rol", accessor: (u) => getRoleLabel(u.role) },
              { header: "Negocio", accessor: (u) => u.tenant_name },
              { header: "Estado Negocio", accessor: (u) => getStatusLabel(u.tenant_status) },
              { header: "Fecha Ingreso", accessor: (u) => new Date(u.joined_at).toLocaleDateString("es-ES") },
            ], "usuarios")}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Buscar y filtrar usuarios por criterios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por email o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          <Tabs value={roleFilter} onValueChange={setRoleFilter}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="owner">Propietarios</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Usuarios{" "}
            {filteredUsers && (
              <span className="text-muted-foreground">
                ({filteredUsers.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Estado del Negocio</TableHead>
                    <TableHead>Fecha de Ingreso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers?.map((user) => (
                      <TableRow
                        key={user.member_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          navigate(`/super-admin/tenants/${user.tenant_id}`)
                        }
                      >
                        <TableCell className="font-medium">
                          {user.user_email}
                        </TableCell>
                        <TableCell>{user.full_name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.tenant_name}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(user.tenant_status)}>
                            {getStatusLabel(user.tenant_status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.joined_at).toLocaleDateString("es-ES")}
                        </TableCell>
                      </TableRow>
                    ))
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
