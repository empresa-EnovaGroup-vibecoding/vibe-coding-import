import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablePagination, PAGE_SIZE } from "@/components/shared/TablePagination";
import { logAudit } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InventoryBulkDeleteDialog } from "@/components/inventory/InventoryBulkDeleteDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Package, Search, Pencil, Trash2, FileUp } from "lucide-react";
import InventoryImportModal from "@/components/inventory/InventoryImportModal";
import { InventoryFormDialog } from "@/components/inventory/InventoryFormDialog";
import { toast } from "sonner";
import { cn, toTitleCase } from "@/lib/utils";
import { useTenant } from "@/hooks/useTenant";

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  stock_level: number;
  cost_price: number | null;
  sale_price: number;
  supplier: string | null;
}

export default function Inventory() {
  const { isOwner, tenantId } = useTenant();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    stock_level: "0",
    cost_price: "",
    sale_price: "",
    supplier: "",
  });
  const queryClient = useQueryClient();

  // Use secure view that conditionally shows cost_price based on role
  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ["inventory", tenantId, page, searchQuery],
    queryFn: async () => {
      if (!tenantId) return { items: [] as InventoryItem[], count: 0 };
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("inventory_staff_view")
        .select("*", { count: "exact" })
        .eq("tenant_id", tenantId);

      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,supplier.ilike.%${searchQuery}%`
        );
      }

      const { data, error, count } = await query
        .order("name", { ascending: true })
        .range(from, to);

      if (error) throw error;
      return { items: data as InventoryItem[], count: count ?? 0 };
    },
    enabled: !!tenantId,
    placeholderData: keepPreviousData,
  });

  const inventory = inventoryData?.items;
  const totalCount = inventoryData?.count ?? 0;

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { data: created, error } = await supabase.from("inventory").insert([{
        name: data.name,
        sku: data.sku || null,
        stock_level: parseInt(data.stock_level) || 0,
        cost_price: parseFloat(data.cost_price) || 0,
        sale_price: parseFloat(data.sale_price) || 0,
        supplier: data.supplier || null,
        tenant_id: tenantId,
      }]).select("id").single();
      if (error) throw error;
      await logAudit({ tenantId, action: "create", entityType: "inventory", entityId: created.id, details: { name: data.name } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["lowStockCount", tenantId] });
      closeDialog();
      toast.success("Producto creado exitosamente");
    },
    onError: () => {
      toast.error("Error al crear el producto");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { error } = await supabase
        .from("inventory")
        .update({
          name: data.name,
          sku: data.sku || null,
          stock_level: parseInt(data.stock_level) || 0,
          cost_price: parseFloat(data.cost_price) || 0,
          sale_price: parseFloat(data.sale_price) || 0,
          supplier: data.supplier || null,
        })
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
      await logAudit({ tenantId, action: "update", entityType: "inventory", entityId: id, details: { name: data.name } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["lowStockCount", tenantId] });
      closeDialog();
      toast.success("Producto actualizado exitosamente");
    },
    onError: () => {
      toast.error("Error al actualizar el producto");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant ID");
      // Check if product has associated sales
      const { count } = await supabase
        .from("sale_items")
        .select("*", { count: "exact", head: true })
        .eq("product_id", id)
        .eq("tenant_id", tenantId);
      if (count && count > 0) {
        throw new Error(`Este producto tiene ${count} ventas registradas. No se puede eliminar.`);
      }
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
      await logAudit({ tenantId, action: "delete", entityType: "inventory", entityId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["lowStockCount", tenantId] });
      toast.success("Producto eliminado exitosamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar el producto");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { error } = await supabase
        .from("inventory")
        .delete()
        .in("id", ids)
        .eq("tenant_id", tenantId);
      if (error) throw error;
      for (const id of ids) {
        await logAudit({ tenantId, action: "delete", entityType: "inventory", entityId: id, details: { bulk: true } });
      }
    },
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["lowStockCount", tenantId] });
      setSelectedIds(new Set());
      setShowBulkDeleteDialog(false);
      toast.success(`${ids.length} producto(s) eliminado(s)`);
    },
    onError: () => {
      toast.error("Error al eliminar los productos");
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
    if (!inventory) return;
    if (selectedIds.size === inventory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(inventory.map((item) => item.id)));
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      sku: "",
      stock_level: "0",
      cost_price: "",
      sale_price: "",
      supplier: "",
    });
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku || "",
      stock_level: item.stock_level.toString(),
      cost_price: item.cost_price?.toString() || "",
      sale_price: item.sale_price.toString(),
      supplier: item.supplier || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (isNaN(parseFloat(formData.sale_price)) || parseFloat(formData.sale_price) < 0) {
      toast.error("El precio de venta debe ser un numero valido");
      return;
    }
    if (isNaN(parseInt(formData.stock_level)) || parseInt(formData.stock_level) < 0) {
      toast.error("El stock debe ser un numero valido");
      return;
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Reset page and selection when search changes
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
    setSelectedIds(new Set());
  };

  const isLowStock = (stockLevel: number) => stockLevel < 5;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventario</h1>
          <p className="text-muted-foreground mt-1">Gestión de productos y stock</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsImportModalOpen(true)}
          >
            <FileUp className="h-4 w-4" />
            Importar Inventario
          </Button>
          <InventoryFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            isPending={createMutation.isPending || updateMutation.isPending}
            editingItem={editingItem}
            isOwner={isOwner}
            onClose={closeDialog}
            triggerButton={
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nuevo Producto
                </Button>
              </DialogTrigger>
            }
          />
        </div>

        <InventoryImportModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          onImportComplete={() => queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] })}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, SKU o proveedor..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bulk actions bar */}
      {isOwner && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size} producto(s) seleccionado(s)
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
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
            Deseleccionar
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>
        ) : !inventory || inventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No hay productos registrados</p>
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              Crear primer producto
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {isOwner && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={inventory.length > 0 && selectedIds.size === inventory.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Seleccionar todos"
                      />
                    </TableHead>
                  )}
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  {isOwner && <TableHead className="hidden sm:table-cell">Costo</TableHead>}
                  <TableHead>Precio</TableHead>
                  <TableHead className="hidden md:table-cell">Proveedor</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-primary/5" : ""}>
                    {isOwner && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                          aria-label={`Seleccionar ${item.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 border border-primary/15">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{toTitleCase(item.name)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {item.sku || ""}
                    </TableCell>
                    <TableCell>
                      {isLowStock(item.stock_level) ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {item.stock_level}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{item.stock_level}</span>
                      )}
                    </TableCell>
                    {isOwner && (
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        Q{Number(item.cost_price || 0).toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell className="font-semibold text-foreground">
                      Q{Number(item.sale_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground/60 text-xs italic">
                      {item.supplier || "Sin asignar"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("¿Eliminar este producto?")) {
                                deleteMutation.mutate(item.id);
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
        )}
        <TablePagination
          page={page}
          totalCount={totalCount}
          onPageChange={(p) => { setPage(p); setSelectedIds(new Set()); }}
        />
      </div>

      <InventoryBulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        count={selectedIds.size}
        isPending={bulkDeleteMutation.isPending}
        onConfirm={() => bulkDeleteMutation.mutate([...selectedIds])}
      />
    </div>
  );
}
