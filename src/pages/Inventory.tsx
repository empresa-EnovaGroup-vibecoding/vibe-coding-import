import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Package, Search, Pencil, Trash2, AlertTriangle, FileUp } from "lucide-react";
import InventoryImportModal from "@/components/inventory/InventoryImportModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("inventory_staff_view")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { error } = await supabase.from("inventory").insert([{
        name: data.name,
        sku: data.sku || null,
        stock_level: parseInt(data.stock_level) || 0,
        cost_price: parseFloat(data.cost_price) || 0,
        sale_price: parseFloat(data.sale_price) || 0,
        supplier: data.supplier || null,
        tenant_id: tenantId,
      }]);
      if (error) throw error;
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
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["lowStockCount", tenantId] });
      toast.success("Producto eliminado exitosamente");
    },
    onError: () => {
      toast.error("Error al eliminar el producto");
    },
  });

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
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredInventory = inventory?.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLowStock = (stockLevel: number) => stockLevel < 5;

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Producto" : "Crear Nuevo Producto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="name">Nombre del Producto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Champú profesional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="ABC-123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_level">Stock</Label>
                  <Input
                    id="stock_level"
                    type="number"
                    value={formData.stock_level}
                    onChange={(e) => setFormData({ ...formData, stock_level: e.target.value })}
                    placeholder="0"
                    min="0"
                  />
                </div>
                {isOwner && (
                  <div className="space-y-2">
                    <Label htmlFor="cost_price">Precio Costo (Q)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="sale_price">Precio Venta (Q)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="supplier">Proveedor</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Nombre del proveedor"
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
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando inventario...</div>
        ) : !filteredInventory || filteredInventory.length === 0 ? (
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
                <TableRow className="bg-muted/50">
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Stock</TableHead>
                  {isOwner && <TableHead className="hidden sm:table-cell">P. Costo</TableHead>}
                  <TableHead>P. Venta</TableHead>
                  <TableHead className="hidden md:table-cell">Proveedor</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          isLowStock(item.stock_level) ? "bg-destructive/10" : "bg-primary/10"
                        )}>
                          <Package className={cn(
                            "h-5 w-5",
                            isLowStock(item.stock_level) ? "text-destructive" : "text-primary"
                          )} />
                        </div>
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.sku || "-"}
                    </TableCell>
                    <TableCell>
                      {isLowStock(item.stock_level) ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {item.stock_level}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{item.stock_level}</Badge>
                      )}
                    </TableCell>
                    {isOwner && (
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        Q{Number(item.cost_price || 0).toFixed(2)}
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-foreground">
                      Q{Number(item.sale_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {item.supplier || "-"}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
