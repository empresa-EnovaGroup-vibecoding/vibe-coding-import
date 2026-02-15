import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { TablePagination, PAGE_SIZE } from "@/components/shared/TablePagination";
import { logAudit } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, User, Phone, Mail, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const formatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return "Fecha no disponible";
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  return isValid(date) ? format(date, formatStr, { locale: es }) : "Fecha inválida";
};
import { ClientDetail } from "@/components/clients/ClientDetail";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

export default function Clients() {
  const { tenantId } = useTenant();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["clients", tenantId, page, searchQuery],
    queryFn: async () => {
      if (!tenantId) return { clients: [] as Client[], count: 0 };
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("clients")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId);

      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
        );
      }

      const { data: rows, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { clients: rows as Client[], count: count ?? 0 };
    },
    enabled: !!tenantId,
    placeholderData: keepPreviousData,
  });

  const clients = data?.clients;
  const totalCount = data?.count ?? 0;

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { data: created, error } = await supabase.from("clients").insert([{
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        tenant_id: tenantId,
      }]).select("id").single();
      if (error) throw error;
      await logAudit({ tenantId, action: "create", entityType: "client", entityId: created.id, details: { name: data.name } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["totalClients", tenantId] });
      setIsDialogOpen(false);
      setFormData({ name: "", phone: "", email: "", notes: "" });
      toast.success("Cliente creado exitosamente");
    },
    onError: () => {
      toast.error("Error al crear el cliente");
    },
  });

  // Reset page when search changes
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    createMutation.mutate(formData);
  };

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
      />
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu base de clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando clientes...</div>
        ) : !clients || clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No hay clientes registrados</p>
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              Crear primer cliente
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Contacto</TableHead>
                  <TableHead className="hidden md:table-cell">Registrado</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedClient(client)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground sm:hidden">
                            {client.phone || client.email || "Sin contacto"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="space-y-1">
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {formatDate(client.created_at, "d MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            <TablePagination
              page={page}
              totalCount={totalCount}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
