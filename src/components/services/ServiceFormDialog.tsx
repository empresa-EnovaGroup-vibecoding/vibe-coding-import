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

interface ServiceFormData {
  name: string;
  description: string;
  category: string;
  duration: string;
  price: string;
}

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  editingService: { id: string } | null;
  categories: string[];
  onClose: () => void;
  triggerButton: React.ReactNode;
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isPending,
  editingService,
  categories,
  onClose,
  triggerButton,
}: ServiceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingService ? "Editar Servicio" : "Crear Nuevo Servicio"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
