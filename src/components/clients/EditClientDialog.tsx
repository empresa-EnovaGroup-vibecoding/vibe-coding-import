import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface EditClientDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone || "");
  const [email, setEmail] = useState(client.email || "");
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  // Reset form when client changes or dialog opens
  useEffect(() => {
    if (open) {
      setName(client.name);
      setPhone(client.phone || "");
      setEmail(client.email || "");
    }
  }, [open, client]);

  const updateClientMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string | null; email: string | null }) => {
      const { error } = await supabase
        .from("clients")
        .update({
          name: data.name,
          phone: data.phone || null,
          email: data.email || null,
        })
        .eq("id", client.id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente actualizado");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Error al actualizar el cliente");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    updateClientMutation.mutate({
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del cliente"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+52 555 123 4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@ejemplo.com"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateClientMutation.isPending}>
              {updateClientMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
