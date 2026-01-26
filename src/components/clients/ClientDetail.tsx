import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Phone, Mail, FileText, Calendar, Clock, ShoppingBag, Save } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const formatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return "Fecha no disponible";
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  return isValid(date) ? format(date, formatStr, { locale: es }) : "Fecha inválida";
};
import { toast } from "sonner";

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
  const [notes, setNotes] = useState(client.notes || "");
  const queryClient = useQueryClient();

  const { data: appointments, isLoading: loadingAppointments } = useQuery({
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

  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ["clientSales", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items (
            id,
            item_name,
            quantity,
            unit_price,
            subtotal
          )
        `)
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      const { error } = await supabase
        .from("clients")
        .update({ notes: newNotes })
        .eq("id", client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Notas guardadas");
    },
    onError: () => {
      toast.error("Error al guardar las notas");
    },
  });

  const futureAppointments = appointments?.filter(
    (apt) => new Date(apt.start_time) >= new Date()
  );
  const pastAppointments = appointments?.filter(
    (apt) => new Date(apt.start_time) < new Date()
  );

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
                Cliente desde {formatDate(client.created_at, "MMMM yyyy")}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {client.phone && (
              <div className="flex items-center gap-3 text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`https://wa.me/${client.phone.replace(/[\s\-\(\)]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  {client.phone}
                </a>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${client.email}`}
                  className="hover:text-primary hover:underline"
                >
                  {client.email}
                </a>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Notas / Observaciones
              </label>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1"
                onClick={() => updateNotesMutation.mutate(notes)}
                disabled={updateNotesMutation.isPending}
              >
                <Save className="h-3 w-3" />
                Guardar
              </Button>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar notas sobre el cliente..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        {/* Tabs for History */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <Tabs defaultValue="appointments" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="appointments" className="gap-2">
                <Calendar className="h-4 w-4" />
                Citas ({appointments?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="purchases" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Compras ({sales?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appointments" className="mt-0">
              {loadingAppointments ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : !appointments || appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No hay citas registradas</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {/* Future appointments */}
                  {futureAppointments && futureAppointments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Próximas citas</h4>
                      {futureAppointments.map((appointment) => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                    </div>
                  )}

                  {/* Past appointments */}
                  {pastAppointments && pastAppointments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Historial</h4>
                      {pastAppointments.map((appointment) => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchases" className="mt-0">
              {loadingSales ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : !sales || sales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No hay compras registradas</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {sales.map((sale) => (
                    <div
                      key={sale.id}
                      className="rounded-lg border border-border bg-muted/30 p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {formatDate(sale.created_at, "EEEE, d 'de' MMMM yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(sale.created_at, "HH:mm")} hrs
                          </p>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          Q{Number(sale.total_amount).toFixed(2)}
                        </p>
                      </div>

                      {sale.sale_items && sale.sale_items.length > 0 && (
                        <div className="border-t border-border pt-3">
                          <p className="text-xs text-muted-foreground mb-2">Artículos:</p>
                          <div className="space-y-1">
                            {sale.sale_items.map((item: { id: string; item_name: string; quantity: number; subtotal: number }) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>
                                  {item.quantity}x {item.item_name}
                                </span>
                                <span className="text-muted-foreground">
                                  Q{Number(item.subtotal).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sale.notes && (
                        <p className="text-sm text-muted-foreground mt-2 border-t border-border pt-2">
                          {sale.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: {
  id: string;
  start_time: string;
  status: string;
  total_price: number;
  appointment_services: {
    id: string;
    price_at_time: number;
    services: { name: string } | null;
  }[];
}}) {
  const status = statusConfig[appointment.status as keyof typeof statusConfig];
  const services = appointment.appointment_services || [];
  const totalPrice = services.reduce(
    (sum, s) => sum + Number(s.price_at_time),
    0
  );

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-foreground">
            {formatDate(appointment.start_time, "EEEE, d 'de' MMMM yyyy")}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(appointment.start_time, "HH:mm")} hrs
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
            {services.map((s) => (
              <Badge key={s.id} variant="secondary" className="text-xs">
                {s.services?.name || "Servicio eliminado"}
              </Badge>
            ))}
          </div>
          <p className="text-sm font-medium text-foreground mt-3">
            Total: Q{totalPrice.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
