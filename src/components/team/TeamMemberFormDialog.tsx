import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import type { Tables } from "@/integrations/supabase/types";

const teamMemberSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  role: z.string().max(100).optional(),
  email: z.string().email("Email inválido").max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  is_active: z.boolean(),
});

type TeamMemberFormValues = z.infer<typeof teamMemberSchema>;

interface TeamMemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Tables<"team_members"> | null;
}

export function TeamMemberFormDialog({ open, onOpenChange, member }: TeamMemberFormDialogProps) {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();
  const isEditing = !!member;

  const form = useForm<TeamMemberFormValues>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      name: "",
      role: "",
      email: "",
      phone: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        role: member.role || "",
        email: member.email || "",
        phone: member.phone || "",
        is_active: member.is_active,
      });
    } else {
      form.reset({
        name: "",
        role: "",
        email: "",
        phone: "",
        is_active: true,
      });
    }
  }, [member, form]);

  const mutation = useMutation({
    mutationFn: async (values: TeamMemberFormValues) => {
      const payload = {
        name: values.name,
        role: values.role || null,
        email: values.email || null,
        phone: values.phone || null,
        is_active: values.is_active,
        tenant_id: tenantId,
      };

      if (isEditing && member) {
        const { error } = await supabase
          .from("team_members")
          .update(payload)
          .eq("id", member.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("team_members")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      toast.success(isEditing ? "Miembro actualizado" : "Miembro agregado");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error saving team member:", error);
      toast.error("Error al guardar el miembro del equipo");
    },
  });

  const onSubmit = (values: TeamMemberFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Miembro" : "Agregar Miembro"}
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
                    <Input placeholder="Nombre completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol / Especialidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Masajista, Esteticista" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+52 555 123 4567" {...field} />
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
                    <FormLabel>Activo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Miembros inactivos no aparecen en la agenda
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
