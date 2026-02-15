import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, Scissors, Trash2, FileUp, Search } from "lucide-react";
import ServicesImportModal from "@/components/services/ServicesImportModal";
import { ServiceFormDialog } from "@/components/services/ServiceFormDialog";
import { ServiceRow } from "@/components/services/ServiceRow";
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
    <div className="space-y-6">
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
          <ServiceFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isPending={createMutation.isPending || updateMutation.isPending}
            editingService={editingService}
            categories={categories}
            onClose={closeDialog}
            triggerButton={
              <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Nuevo Servicio
              </Button>
            }
          />
        </div>

        <ServicesImportModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          onImportComplete={() => queryClient.invalidateQueries({ queryKey: ["services", tenantId] })}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, categoria, precio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <button
              type="button"
              onClick={() => setFilterCategory("all")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filterCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => {
              const count = services?.filter((s) => s.category === cat).length ?? 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(filterCategory === cat ? "all" : cat)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    filterCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                  <span className="text-xs opacity-70">{count}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setFilterCategory(filterCategory === "none" ? "all" : "none")}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filterCategory === "none"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              Sin categoria
            </button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

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

      {/* Services */}
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
        <div className="space-y-1">
          {/* Select all */}
          <div className="flex items-center gap-2 px-1 pb-2">
            <Checkbox
              checked={filteredServices.length > 0 && selectedIds.size === filteredServices.length}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-xs text-muted-foreground">
              Seleccionar todo ({filteredServices.length})
            </span>
          </div>

          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category} className="mb-6">
              {/* Category divider */}
              <div className="flex items-center gap-3 mb-2 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  {category}
                </h3>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{categoryServices.length}</span>
              </div>

              {/* Service rows */}
              <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border/50">
                {categoryServices.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    isSelected={selectedIds.has(service.id)}
                    isOwner={isOwner}
                    onToggleSelect={toggleSelect}
                    onEdit={openEditDialog}
                    onDelete={(id) => {
                      if (confirm("¿Eliminar este servicio?")) {
                        deleteMutation.mutate(id);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
