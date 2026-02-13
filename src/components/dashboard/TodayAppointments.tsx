import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, User, CheckCircle2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/appointments/WhatsAppButton";
import { BulkReminderButton } from "@/components/dashboard/BulkReminderButton";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Pendiente", class: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  confirmed: { label: "Confirmada", class: "bg-blue-100 text-blue-800 border-blue-300" },
  in_room: { label: "En Sala", class: "bg-purple-100 text-purple-800 border-purple-300" },
  completed: { label: "Completada", class: "bg-green-100 text-green-800 border-green-300" },
  no_show: { label: "No asistió", class: "bg-red-100 text-red-800 border-red-300" },
  cancelled: { label: "Cancelada", class: "bg-gray-100 text-gray-800 border-gray-300" },
};

export function TodayAppointments() {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["todayAppointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients (name, phone),
          appointment_services (
            id,
            services (name)
          )
        `)
        .gte("start_time", startOfDay)
        .lte("start_time", endOfDay)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Citas de Hoy</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/30 dark:bg-white/5 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Citas de Hoy</h3>
        <div className="flex items-center gap-3">
          {appointments && appointments.length > 0 && (
            <BulkReminderButton appointments={appointments} />
          )}
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </span>
        </div>
      </div>

      {!appointments || appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No hay citas programadas para hoy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const status = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending;
            const serviceNames = appointment.appointment_services
              ?.map((s: { services: { name: string } | null }) => s.services?.name)
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={appointment.id}
                className="flex items-center gap-4 rounded-xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-sm p-4 transition-all hover:bg-white/60 dark:hover:bg-white/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {appointment.clients?.name || "Cliente no encontrado"}
                  </p>
                  {serviceNames && (
                    <p className="text-xs text-primary font-medium truncate">
                      {serviceNames}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(appointment.start_time), "HH:mm")} hrs
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <WhatsAppButton
                    phone={appointment.clients?.phone ?? null}
                    clientName={appointment.clients?.name || "Cliente"}
                    appointmentTime={appointment.start_time}
                    appointmentId={appointment.id}
                    confirmationToken={appointment.confirmation_token}
                  />
                  {appointment.confirmed_at && appointment.status === 'confirmed' ? (
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Confirmo
                    </Badge>
                  ) : appointment.reminder_sent_at && !appointment.confirmed_at ? (
                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200 gap-1">
                      <Send className="h-3 w-3" />
                      Enviado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={cn("text-xs", status?.class)}>
                      {status?.label}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
