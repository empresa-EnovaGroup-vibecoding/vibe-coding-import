import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { AppointmentFormDialog } from "@/components/appointments/AppointmentFormDialog";
import { AppointmentDayView } from "@/components/appointments/AppointmentDayView";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, isSameDay, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { useTenant } from "@/hooks/useTenant";
import { useClientsList } from "@/hooks/queries/useClientsList";
import { useServicesList } from "@/hooks/queries/useServicesList";
import { useTeamMembersList } from "@/hooks/queries/useTeamMembersList";
import { useCabinsList } from "@/hooks/queries/useCabinsList";

interface Appointment {
  id: string;
  client_id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  notes: string | null;
  total_price: number;
  specialist_id: string | null;
  cabin_id: string | null;
  receipt_url: string | null;
  clients: { name: string; phone: string | null } | null;
  team_members: { name: string } | null;
  cabins: { name: string } | null;
  appointment_services: {
    id: string;
    service_id: string;
    price_at_time: number;
    services: { name: string; duration: number } | null;
  }[];
}


const statusConfig = {
  pending: { label: "Pendiente", class: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  confirmed: { label: "Confirmada", class: "bg-blue-100 text-blue-800 border-blue-300" },
  in_room: { label: "En Sala", class: "bg-purple-100 text-purple-800 border-purple-300" },
  completed: { label: "Completada", class: "bg-green-100 text-green-800 border-green-300" },
  no_show: { label: "No asistió", class: "bg-red-100 text-red-800 border-red-300" },
  cancelled: { label: "Cancelada", class: "bg-gray-100 text-gray-800 border-gray-300" },
};

export default function Appointments() {
  const { tenantId, isOwner } = useTenant();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client_id: "",
    date: "",
    time: "",
    status: "pending",
    notes: "",
    selectedServices: [] as string[],
    specialist_id: "",
    cabin_id: "",
  });
  const [now, setNow] = useState(new Date());
  const alertedRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Update current time every minute for upcoming appointment alerts
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", monthStart.toISOString(), tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients (name, phone),
          team_members (name),
          cabins (name),
          appointment_services (
            id,
            service_id,
            price_at_time,
            services (name, duration)
          )
        `)
        .eq("tenant_id", tenantId)
        .gte("start_time", monthStart.toISOString())
        .lte("start_time", monthEnd.toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!tenantId,
  });

  const { data: clients } = useClientsList();
  const { data: services } = useServicesList();
  const { data: teamMembers } = useTeamMembersList();
  const { data: cabins } = useCabinsList();

  // Check for upcoming appointments and show alerts
  useEffect(() => {
    if (!appointments) return;

    const upcomingAppointments = appointments.filter((apt) => {
      if (apt.status === "cancelled" || apt.status === "completed" || apt.status === "no_show") return false;
      const aptTime = new Date(apt.start_time);
      const minutesUntil = differenceInMinutes(aptTime, now);
      return minutesUntil > 0 && minutesUntil <= 60;
    });

    upcomingAppointments.forEach((apt) => {
      const minutesUntil = differenceInMinutes(new Date(apt.start_time), now);
      if (minutesUntil === 60 || minutesUntil === 30 || minutesUntil === 15) {
        const alertKey = `${apt.id}-${minutesUntil}`;
        if (!alertedRef.current.has(alertKey)) {
          alertedRef.current.add(alertKey);
          toast.warning(`Alerta: Cita con ${apt.clients?.name} en ${minutesUntil} minutos`, {
            duration: 10000,
          });
        }
      }
    });
  }, [appointments, now]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenantId) throw new Error("No tenant ID");
      const startTime = new Date(`${data.date}T${data.time}`);

      const selectedServicesList = services?.filter(s => data.selectedServices.includes(s.id)) || [];
      const totalPrice = selectedServicesList.reduce((sum, s) => sum + Number(s.price), 0);
      const totalDuration = selectedServicesList.reduce((sum, s) => sum + s.duration, 0);
      const endTime = new Date(startTime.getTime() + totalDuration * 60000);

      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert([{
          client_id: data.client_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: data.status as "pending" | "confirmed" | "completed" | "cancelled" | "in_room" | "no_show",
          notes: data.notes || null,
          total_price: totalPrice,
          specialist_id: data.specialist_id || null,
          cabin_id: data.cabin_id || null,
          tenant_id: tenantId,
        }])
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      if (data.selectedServices.length > 0) {
        const appointmentServices = data.selectedServices.map(serviceId => {
          const service = services?.find(s => s.id === serviceId);
          return {
            appointment_id: appointment.id,
            service_id: serviceId,
            price_at_time: service?.price || 0,
            tenant_id: tenantId,
          };
        });

        const { error: servicesError } = await supabase
          .from("appointment_services")
          .insert(appointmentServices);

        if (servicesError) throw servicesError;
      }

      await logAudit({ tenantId, action: "create", entityType: "appointment", entityId: appointment.id, details: { client_id: data.client_id, date: data.date } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", undefined, tenantId] });
      queryClient.invalidateQueries({ queryKey: ["todayAppointments", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["todayAppointmentsCount", tenantId] });
      closeDialog();
      toast.success("Cita creada exitosamente");
    },
    onError: () => {
      toast.error("Error al crear la cita");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      if (!tenantId) throw new Error("No tenant ID");
      const startTime = new Date(`${data.date}T${data.time}`);

      const selectedServicesList = services?.filter(s => data.selectedServices.includes(s.id)) || [];
      const totalPrice = selectedServicesList.reduce((sum, s) => sum + Number(s.price), 0);
      const totalDuration = selectedServicesList.reduce((sum, s) => sum + s.duration, 0);
      const endTime = new Date(startTime.getTime() + totalDuration * 60000);

      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          client_id: data.client_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: data.status as "pending" | "confirmed" | "completed" | "cancelled" | "in_room" | "no_show",
          notes: data.notes || null,
          total_price: totalPrice,
          specialist_id: data.specialist_id || null,
          cabin_id: data.cabin_id || null,
        })
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (updateError) throw updateError;

      // Atomic replacement of appointment_services (prevents data loss if insert fails)
      const servicesPayload = data.selectedServices.map(serviceId => {
        const service = services?.find(s => s.id === serviceId);
        return { service_id: serviceId, price_at_time: service?.price || 0 };
      });

      const { error: replaceError } = await supabase.rpc(
        "replace_appointment_services",
        {
          p_appointment_id: id,
          p_tenant_id: tenantId,
          p_services: servicesPayload,
        }
      );
      if (replaceError) throw replaceError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", undefined, tenantId] });
      queryClient.invalidateQueries({ queryKey: ["todayAppointments", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["todayAppointmentsCount", tenantId] });
      closeDialog();
      toast.success("Cita actualizada exitosamente");
    },
    onError: () => {
      toast.error("Error al actualizar la cita");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { error } = await supabase
        .from("appointments")
        .update({ status: status as "pending" | "confirmed" | "completed" | "cancelled" | "in_room" | "no_show" })
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", undefined, tenantId] });
      queryClient.invalidateQueries({ queryKey: ["todayAppointments", tenantId] });
      toast.success("Estado actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar el estado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error("No tenant ID");
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
      await logAudit({ tenantId, action: "delete", entityType: "appointment", entityId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", undefined, tenantId] });
      queryClient.invalidateQueries({ queryKey: ["todayAppointments", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["todayAppointmentsCount", tenantId] });
      toast.success("Cita eliminada exitosamente");
    },
    onError: () => {
      toast.error("Error al eliminar la cita");
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      client_id: "",
      date: "",
      time: "",
      status: "pending",
      notes: "",
      selectedServices: [],
      specialist_id: "",
      cabin_id: "",
    });
  };

  const openEdit = (appointment: Appointment) => {
    const startDate = new Date(appointment.start_time);
    setEditingId(appointment.id);
    setFormData({
      client_id: appointment.client_id,
      date: format(startDate, "yyyy-MM-dd"),
      time: format(startDate, "HH:mm"),
      status: appointment.status,
      notes: appointment.notes || "",
      selectedServices: appointment.appointment_services?.map(s => s.service_id) ?? [],
      specialist_id: appointment.specialist_id || "",
      cabin_id: appointment.cabin_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (!formData.date || !formData.time) {
      toast.error("Selecciona fecha y hora");
      return;
    }
    if (formData.selectedServices.length === 0) {
      toast.error("Selecciona al menos un servicio");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId],
    }));
  };

  const calculateTotal = () => {
    if (!services) return 0;
    return formData.selectedServices.reduce((sum, id) => {
      const service = services.find(s => s.id === id);
      return sum + (service?.price || 0);
    }, 0);
  };

  const isUpcoming = (startTime: string) => {
    const aptTime = new Date(startTime);
    const minutesUntil = differenceInMinutes(aptTime, now);
    return minutesUntil > 0 && minutesUntil <= 60;
  };

  const selectedDayAppointments = appointments?.filter(apt =>
    isSameDay(new Date(apt.start_time), selectedDate)
  );

  const datesWithAppointments = appointments?.map(apt => new Date(apt.start_time)) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gestión de citas y calendario</p>
        </div>
        <AppointmentFormDialog
          open={isDialogOpen}
          onOpenChange={(open) => !open && closeDialog()}
          onSubmit={handleSubmit}
          editingId={editingId}
          formData={formData}
          setFormData={setFormData}
          clients={clients}
          services={services}
          teamMembers={teamMembers}
          cabins={cabins}
          isLoading={createMutation.isPending || updateMutation.isPending}
          calculateTotal={calculateTotal}
          toggleService={toggleService}
          triggerButton={
            <Button className="gap-2" onClick={() => {
              setEditingId(null);
              setFormData(prev => ({
                ...prev,
                date: format(selectedDate, "yyyy-MM-dd"),
              }));
              setIsDialogOpen(true);
            }}>
              <Plus className="h-4 w-4" />
              Nueva Cita
            </Button>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Calendar */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={es}
            className="w-full"
            modifiers={{
              hasAppointment: datesWithAppointments,
            }}
            modifiersStyles={{
              hasAppointment: {
                fontWeight: "bold",
                textDecoration: "underline",
                textDecorationColor: "hsl(var(--primary))",
              },
            }}
          />
        </div>

        {/* Day View */}
        <AppointmentDayView
          appointments={selectedDayAppointments}
          isLoading={isLoading}
          selectedDate={selectedDate}
          onEdit={openEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
          onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
          statusConfig={statusConfig}
          isOwner={isOwner}
          isUpcoming={isUpcoming}
        />
      </div>
    </div>
  );
}
