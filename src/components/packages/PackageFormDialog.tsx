import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

const packageSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional(),
  total_sessions: z.coerce.number().min(1, "Debe tener al menos 1 sesión"),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  validity_days: z.coerce.number().min(1).optional(),
  service_id: z.string().optional(),
  is_active: z.boolean(),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: () => void;
  editingPackage?: {
    id: string;
    name: string;
    description: string | null;
    total_sessions: number;
    price: number;
    validity_days: number | null;
    is_active: boolean;
    service_id: string | null;
  } | null;
}

export function PackageFormDialog({
  open,
  onOpenChange,
  editingPackage,
}: PackageFormDialogProps) {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      description: "",
      total_sessions: 5,
      price: 0,
      validity_days: 365,
      service_id: undefined,
      is_active: true,
    },
  });

  useEffect(() => {
    if (editingPackage) {
      form.reset({
        name: editingPackage.name,
        description: editingPackage.description || "",
        total_sessions: editingPackage.total_sessions,
        price: editingPackage.price,
        validity_days: editingPackage.validity_days || 365,
        service_id: editingPackage.service_id || undefined,
        is_active: editingPackage.is_active,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        total_sessions: 5,
        price: 0,
        validity_days: 365,
        service_id: undefined,
        is_active: true,
      });
    }
  }, [editingPackage, form]);

  const mutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        total_sessions: data.total_sessions,
        price: data.price,
        validity_days: data.validity_days || null,
        service_id: data.service_id === "none" ? null : data.service_id || null,
        is_active: data.is_active,
        tenant_id: tenantId,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from("packages")
          .update(payload)
          .eq("id", editingPackage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("packages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success(editingPackage ? "Paquete actualizado" : "Paquete creado");
      onOpenChange();
    },
    onError: () => {
      toast.error("Error al guardar el paquete");
    },
  });

  const onSubmit = (data: PackageFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingPackage ? "Editar Paquete" : "Nuevo Paquete"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Paquete 5 sesiones" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción opcional del paquete..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_sessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sesiones</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (Q)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="validity_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validez (días)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servicio (opcional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Cualquier servicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Cualquier servicio</SelectItem>
                        {services?.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                  <FormLabel className="text-sm font-normal">
                    Paquete activo
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onOpenChange}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={mutation.isPending}
              >
                {editingPackage ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
