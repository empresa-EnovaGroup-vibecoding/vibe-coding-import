import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, FileText, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
}

const statusConfig = {
  pending: { label: "Pendiente", class: "status-pending" },
  confirmed: { label: "Confirmada", class: "status-confirmed" },
  completed: { label: "Completada", class: "status-completed" },
  cancelled: { label: "Cancelada", class: "status-cancelled" },
};

export function ClientDetail({ client, onBack }: ClientDetailProps) {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["clientAppointments", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          appointment_services (
            id,
            price_at_time,
            services (name, duration)
          )
        `)
        .eq("client_id", client.id)
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6 pt-12 lg:pt-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{client.name}</h1>
          <p className="text-muted-foreground mt-1">Ficha del cliente</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Info Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
              <p className="text-sm text-muted-foreground">
                Cliente desde {format(new Date(client.created_at), "MMMM yyyy", { locale: es })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {client.phone && (
              <div className="flex items-center gap-3 text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {client.notes && (
              <div className="flex items-start gap-3 pt-4 border-t border-border">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Appointments History */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Citas
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !appointments || appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Este cliente no tiene citas registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const status = statusConfig[appointment.status as keyof typeof statusConfig];
                const services = appointment.appointment_services || [];
                const totalPrice = services.reduce(
                  (sum: number, s: { price_at_time: number }) => sum + Number(s.price_at_time),
                  0
                );

                return (
                  <div
                    key={appointment.id}
                    className="rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {format(new Date(appointment.start_time), "EEEE, d 'de' MMMM yyyy", {
                            locale: es,
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.start_time), "HH:mm")} hrs
                        </p>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", status?.class)}>
                        {status?.label}
                      </Badge>
                    </div>

                    {services.length > 0 && (
                      <div className="border-t border-border pt-3 mt-3">
                        <p className="text-xs text-muted-foreground mb-2">Servicios:</p>
                        <div className="flex flex-wrap gap-2">
                          {services.map((s: { id: string; services: { name: string } | null }) => (
                            <Badge key={s.id} variant="secondary" className="text-xs">
                              {s.services?.name || "Servicio eliminado"}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm font-medium text-foreground mt-3">
                          Total: €{totalPrice.toFixed(2)}
                        </p>
                      </div>
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
