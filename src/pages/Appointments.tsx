import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Calendar } from "@/components/ui/calendar";
import { WhatsAppButton } from "@/components/appointments/WhatsAppButton";
import { Plus, Calendar as CalendarIcon, Clock, User, Trash2, AlertCircle, Users, DoorOpen, ImageIcon, Globe } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, isSameDay, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/useTenant";

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
    price_at_time: number;
    services: { name: string; duration: number } | null;
  }[];
}

interface Client {
  id: string;
  name: string;
  phone: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string | null;
}

interface Cabin {
  id: string;
  name: string;
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

  const { data: clients } = useQuery({
    queryKey: ["clients", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!tenantId,
  });

  const { data: services } = useQuery({
    queryKey: ["services", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!tenantId,
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["teamMembers", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, role")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !!tenantId,
  });

  const { data: cabins } = useQuery({
    queryKey: ["cabins", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("cabins")
        .select("id, name")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Cabin[];
    },
    enabled: !!tenantId,
  });

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
        toast.warning(`Alerta: Cita con ${apt.clients?.name} en ${minutesUntil} minutos`, {
          duration: 10000,
        });
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
    createMutation.mutate(formData);
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
    <div className="space-y-6 pt-12 lg:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Agenda</h1>
          <p className="text-muted-foreground mt-1">Gestión de citas y calendario</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => {
              setFormData(prev => ({
                ...prev,
                date: format(selectedDate, "yyyy-MM-dd"),
              }));
              setIsDialogOpen(true);
            }}>
              <Plus className="h-4 w-4" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Cita</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Fecha *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialist">Especialista</Label>
                  <Select
                    value={formData.specialist_id}
                    onValueChange={(value) => setFormData({ ...formData, specialist_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cabin">Cabina</Label>
                  <Select
                    value={formData.cabin_id}
                    onValueChange={(value) => setFormData({ ...formData, cabin_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {cabins?.map((cabin) => (
                        <SelectItem key={cabin.id} value={cabin.id}>
                          {cabin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Servicios</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {services?.map((service) => (
                    <div key={service.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={service.id}
                          checked={formData.selectedServices.includes(service.id)}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                        <label htmlFor={service.id} className="text-sm cursor-pointer">
                          {service.name}
                        </label>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Q{Number(service.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {(!services || services.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No hay servicios disponibles
                    </p>
                  )}
                </div>
                {formData.selectedServices.length > 0 && (
                  <p className="text-sm font-medium text-right">
                    Total: Q{calculateTotal().toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="in_room">En Sala</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="no_show">No asistió</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </h3>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !selectedDayAppointments || selectedDayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No hay citas para este día</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDayAppointments.map((appointment) => {
                const status = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending;
                const upcoming = isUpcoming(appointment.start_time);
                const serviceNames = appointment.appointment_services
                  .map(s => s.services?.name)
                  .filter(Boolean)
                  .join(", ");
                
                return (
                  <div
                    key={appointment.id}
                    className={cn(
                      "rounded-lg border p-4 transition-all",
                      upcoming 
                        ? "border-warning bg-warning/10 ring-2 ring-warning/50 animate-pulse" 
                        : "border-border bg-muted/30"
                    )}
                  >
                    {upcoming && (
                      <div className="flex items-center gap-2 text-warning font-medium mb-3">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">¡Cita próxima!</span>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {appointment.clients?.name || "Cliente no encontrado"}
                          </p>
                          
                          {/* Service Name - prominently displayed */}
                          {serviceNames && (
                            <p className="text-sm text-primary font-medium mt-0.5">
                              {serviceNames}
                            </p>
                          )}
                          
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(appointment.start_time), "HH:mm")} hrs
                          </p>

                          {/* Specialist and Cabin badges */}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {appointment.team_members?.name && (
                              <Badge variant="outline" className="text-xs gap-1 bg-background">
                                <Users className="h-3 w-3" />
                                {appointment.team_members.name}
                              </Badge>
                            )}
                            {appointment.cabins?.name && (
                              <Badge variant="outline" className="text-xs gap-1 bg-background">
                                <DoorOpen className="h-3 w-3" />
                                {appointment.cabins.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <WhatsAppButton
                          phone={appointment.clients?.phone || null}
                          clientName={appointment.clients?.name || ""}
                          appointmentTime={appointment.start_time}
                        />
                        <Select
                          value={appointment.status}
                          onValueChange={(value) =>
                            updateStatusMutation.mutate({ id: appointment.id, status: value })
                          }
                        >
                          <SelectTrigger className={cn("w-32 h-8 text-xs font-medium", status?.class)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="confirmed">Confirmada</SelectItem>
                            <SelectItem value="in_room">En Sala</SelectItem>
                            <SelectItem value="completed">Completada</SelectItem>
                            <SelectItem value="no_show">No asistió</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("¿Eliminar esta cita?")) {
                                deleteMutation.mutate(appointment.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {appointment.appointment_services.length > 0 && (
                      <div className="border-t border-border pt-3 mt-3">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {appointment.appointment_services.map((s) => (
                            <Badge key={s.id} variant="secondary" className="text-xs">
                              {s.services?.name || "Servicio eliminado"} - Q{Number(s.price_at_time).toFixed(2)}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          Total: Q{Number(appointment.total_price).toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Online booking indicator + receipt */}
                    {(appointment.notes?.includes("Reserva online") || appointment.receipt_url) && (
                      <div className="border-t border-border pt-2 mt-2 flex flex-wrap items-center gap-2">
                        {appointment.notes?.includes("Reserva online") && (
                          <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
                            <Globe className="h-3 w-3" />
                            Reserva online
                          </Badge>
                        )}
                        {appointment.receipt_url && (
                          <a
                            href={appointment.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                          >
                            <ImageIcon className="h-3 w-3" />
                            Ver comprobante
                          </a>
                        )}
                      </div>
                    )}

                    {appointment.notes && !appointment.notes.includes("Reserva online") && (
                      <p className="text-sm text-muted-foreground mt-2 border-t border-border pt-2">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
