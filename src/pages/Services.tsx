import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Scissors, Clock, Pencil, Trash2, FileUp, Search } from "lucide-react";
import ServicesImportModal from "@/components/services/ServicesImportModal";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration: number;
  price: number;
}

export default function Services() {
  const { tenantId, isOwner } = useTenant();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    duration: "30",
    price: "",
  });
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("category", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!tenantId,
  });

  // Get unique categories for filter
  const categories = useMemo(() => {
    if (!services) return [];
    const cats = [...new Set(services.map((s) => s.category).filter(Boolean))] as string[];
    return cats.sort();
  }, [services]);

  // Strip accents for search comparison
  const normalize = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Filter services
  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter((s) => {
      const q = normalize(searchQuery.trim());
      const matchesSearch = !q ||
        normalize(s.name).includes(q) ||
        normalize(s.description || "").includes(q) ||
        normalize(s.category || "").includes(q) ||
        s.duration.toString().includes(q) ||
        s.price.toString().includes(q) ||
        `Q${Number(s.price).toFixed(2)}`.includes(q);
      const matchesCategory = filterCategory === "all" ||
        (filterCategory === "none" ? !s.category : s.category === filterCategory);
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, filterCategory]);

  // Group by category
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    for (const service of filteredServices) {
      const key = service.category || "Sin categoria";
      if (!groups[key]) groups[key] = [];
      groups[key].push(service);
    }
    return groups;
  }, [filteredServices]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { error } = await supabase.from("services").insert([{
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        duration: parseInt(data.duration),
        price: parseFloat(data.price) || 0,
        tenant_id: tenantId,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", tenantId] });
      closeDialog();
      toast.success("Servicio creado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(`Error al crear el servicio: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { error } = await supabase
        .from("services")
        .update({
          name: data.name,
          description: data.description || null,
          category: data.category || null,
          duration: parseInt(data.duration),
          price: parseFloat(data.price) || 0,
        })
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", tenantId] });
      closeDialog();
      toast.success("Servicio actualizado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar el servicio: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services", tenantId] });
      toast.success("Servicio eliminado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar el servicio: ${error.message}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { error } = await supabase
        .from("services")
        .delete()
        .in("id", ids)
        .eq("tenant_id", tenantId);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["services", tenantId] });
      setSelectedIds(new Set());
      setShowBulkDeleteDialog(false);
      toast.success(`${count} servicios eliminados`);
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredServices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredServices.map((s) => s.id)));
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    setFormData({ name: "", description: "", category: "", duration: "30", price: "" });
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category || "",
      duration: service.duration.toString(),
      price: service.price.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Servicios</h1>
          <p className="text-muted-foreground mt-1">
            Catalogo de servicios disponibles
            {services && services.length > 0 && (
              <span className="ml-1">({services.length} servicios)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsImportModalOpen(true)}
          >
            <FileUp className="h-4 w-4" />
            Importar Servicios
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Servicio" : "Crear Nuevo Servicio"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Servicio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Corte de cabello"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripcion / Detalle</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Limpieza profunda con productos premium"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category || "_none_"}
                  onValueChange={(value) => setFormData({ ...formData, category: value === "_none_" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">Sin categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duracion (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="30"
                    min="5"
                    step="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio (Q)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>

        <ServicesImportModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          onImportComplete={() => queryClient.invalidateQueries({ queryKey: ["services", tenantId] })}
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {categories.length > 0 && (
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              <SelectItem value="none">Sin categoria</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium">
            {selectedIds.size} servicio{selectedIds.size > 1 ? "s" : ""} seleccionado{selectedIds.size > 1 ? "s" : ""}
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => setShowBulkDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar seleccionados
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Deseleccionar todo
          </Button>
        </div>
      )}

      {/* Bulk delete confirmation */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {selectedIds.size} servicios</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminaran permanentemente los servicios seleccionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Services grouped by category */}
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Cargando servicios...</div>
      ) : !services || services.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Scissors className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No hay servicios registrados</p>
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              Crear primer servicio
            </Button>
          </div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-sm p-8 text-center text-muted-foreground">
          No se encontraron servicios con ese filtro
        </div>
      ) : (
        Object.entries(groupedServices).map(([category, categoryServices]) => (
          <div key={category} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {category}
              </h2>
              <p className="text-xs text-muted-foreground">{categoryServices.length} servicios</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredServices.length > 0 && selectedIds.size === filteredServices.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Duracion</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryServices.map((service) => (
                  <TableRow key={service.id} className={selectedIds.has(service.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(service.id)}
                        onCheckedChange={() => toggleSelect(service.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Scissors className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium text-foreground">{service.name}</span>
                          {service.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.duration} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        Q{Number(service.price).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("¿Eliminar este servicio?")) {
                                deleteMutation.mutate(service.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))
      )}
    </div>
  );
}
