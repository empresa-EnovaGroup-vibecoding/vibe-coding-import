import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Loader2 } from "lucide-react";

interface TenantEditDialogProps {
  tenant: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
  };
  onSave: (data: { name: string; phone: string; address: string }) => void;
  isSaving: boolean;
}

export function TenantEditDialog({ tenant, onSave, isSaving }: TenantEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tenant.name);
  const [phone, setPhone] = useState(tenant.phone ?? "");
  const [address, setAddress] = useState(tenant.address ?? "");

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setName(tenant.name);
      setPhone(tenant.phone ?? "");
      setAddress(tenant.address ?? "");
    }
  };

  const handleSave = () => {
    onSave({ name: name.trim(), phone: phone.trim(), address: address.trim() });
    setOpen(false);
  };

  const hasChanges =
    name.trim() !== tenant.name ||
    phone.trim() !== (tenant.phone ?? "") ||
    address.trim() !== (tenant.address ?? "");

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Informacion del Negocio</DialogTitle>
          <DialogDescription>
            Corrige el nombre, telefono o direccion del negocio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre del Negocio</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del negocio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefono</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+502 1234-5678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Direccion</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ciudad, zona, referencia..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !hasChanges}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
