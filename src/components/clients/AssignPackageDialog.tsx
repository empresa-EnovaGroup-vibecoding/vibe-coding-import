import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays } from "date-fns";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

const assignSchema = z.object({
  package_id: z.string().min(1, "Selecciona un paquete"),
  notes: z.string().max(500).optional(),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface AssignPackageDialogProps {
  open: boolean;
  onOpenChange: () => void;
  clientId: string;
}

export function AssignPackageDialog({
  open,
  onOpenChange,
  clientId,
}: AssignPackageDialogProps) {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  const { data: packages } = useQuery({
    queryKey: ["packages", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("id, name, total_sessions, price, validity_days, services(name)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<AssignFormData>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      package_id: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AssignFormData) => {
      const selectedPackage = packages?.find((p) => p.id === data.package_id);
      if (!selectedPackage) throw new Error("Paquete no encontrado");

      const expiresAt = selectedPackage.validity_days
        ? addDays(new Date(), selectedPackage.validity_days).toISOString()
        : null;

      const { error } = await supabase.from("client_packages").insert({
        client_id: clientId,
        package_id: data.package_id,
        sessions_total: selectedPackage.total_sessions,
        sessions_used: 0,
        expires_at: expiresAt,
        notes: data.notes || null,
        tenant_id: tenantId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientPackages", clientId] });
      toast.success("Paquete asignado correctamente");
      form.reset();
      onOpenChange();
    },
    onError: () => {
      toast.error("Error al asignar el paquete");
    },
  });

  const onSubmit = (data: AssignFormData) => {
    mutation.mutate(data);
  };

  const selectedPackage = packages?.find(
    (p) => p.id === form.watch("package_id")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar Paquete al Cliente</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="package_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paquete</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un paquete" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {packages?.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.total_sessions} sesiones - Q
                          {Number(pkg.price).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPackage && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p>
                  <strong>Sesiones:</strong> {selectedPackage.total_sessions}
                </p>
                <p>
                  <strong>Precio:</strong> Q{Number(selectedPackage.price).toFixed(2)}
                </p>
                {(selectedPackage.services as any)?.name && (
                  <p>
                    <strong>Servicio:</strong> {(selectedPackage.services as any).name}
                  </p>
                )}
                {selectedPackage.validity_days && (
                  <p>
                    <strong>Validez:</strong> {selectedPackage.validity_days} días
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones sobre la compra..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
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
                Asignar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
