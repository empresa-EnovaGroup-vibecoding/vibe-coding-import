import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const cabinSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional(),
  is_active: z.boolean(),
});

type CabinFormValues = z.infer<typeof cabinSchema>;

interface CabinFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabin?: Tables<"cabins"> | null;
}

export function CabinFormDialog({ open, onOpenChange, cabin }: CabinFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!cabin;

  const form = useForm<CabinFormValues>({
    resolver: zodResolver(cabinSchema),
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (cabin) {
      form.reset({
        name: cabin.name,
        description: cabin.description || "",
        is_active: cabin.is_active,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        is_active: true,
      });
    }
  }, [cabin, form]);

  const mutation = useMutation({
    mutationFn: async (values: CabinFormValues) => {
      const payload = {
        name: values.name,
        description: values.description || null,
        is_active: values.is_active,
      };

      if (isEditing && cabin) {
        const { error } = await supabase
          .from("cabins")
          .update(payload)
          .eq("id", cabin.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cabins")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabins"] });
      toast.success(isEditing ? "Cabina actualizada" : "Cabina agregada");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error saving cabin:", error);
      toast.error("Error al guardar la cabina");
    },
  });

  const onSubmit = (values: CabinFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cabina" : "Agregar Cabina"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Cabina 1, Sala VIP" {...field} />
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
                      placeholder="Descripción opcional de la cabina..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Activa</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Cabinas inactivas no aparecen en la agenda
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : isEditing ? "Actualizar" : "Agregar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
