import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InventoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    name: string;
    sku: string;
    stock_level: string;
    cost_price: string;
    sale_price: string;
    supplier: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    sku: string;
    stock_level: string;
    cost_price: string;
    sale_price: string;
    supplier: string;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  editingItem: { id: string } | null;
  isOwner: boolean;
  onClose: () => void;
  triggerButton: React.ReactNode;
}

export function InventoryFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isPending,
  editingItem,
  isOwner,
  onClose,
  triggerButton,
}: InventoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      {triggerButton}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Editar Producto" : "Crear Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
