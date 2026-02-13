import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarCheck, CheckCircle2, Clock, XCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/useTenant";

interface AppointmentWithRelations {
  id: string;
  start_time: string;
  status: string;
  confirmed_at: string | null;
  clients: {
    name: string;
    phone: string;
  } | null;
  appointment_services: Array<{
    id: string;
    services: {
      name: string;
    } | null;
  }>;
}

export function TomorrowSummary() {
  const { tenantId } = useTenant();
  const tomorrow = addDays(new Date(), 1);
  const startDate = startOfDay(tomorrow);
  const endDate = endOfDay(tomorrow);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["tomorrow-appointments", tenantId, startDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients (name, phone),
          appointment_services (id, services (name))
        `)
        .eq("tenant_id", tenantId)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as AppointmentWithRelations[];
    },
    enabled: !!tenantId,
  });

  // Calcular conteos
  const total = appointments?.length ?? 0;
  const confirmed = appointments?.filter(
    (a) => a.confirmed_at && a.status === "confirmed"
  ).length ?? 0;
  const pending = appointments?.filter(
    (a) => !a.confirmed_at && ["pending", "confirmed"].includes(a.status)
  ).length ?? 0;
  const cancelled = appointments?.filter(
    (a) => a.status === "cancelled"
  ).length ?? 0;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 shadow-sm">
        <div className="h-24 bg-white/30 dark:bg-white/5 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Citas de Mañana</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4 capitalize">
        {format(tomorrow, "EEEE d 'de' MMMM", { locale: es })}
      </p>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay citas programadas para mañana
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="bg-background text-foreground border-border"
          >
            <Clock className="h-3 w-3 mr-1" />
            Total: {total}
          </Badge>

          {confirmed > 0 && (
            <Badge
              variant="outline"
              className="bg-green-100 text-green-700 border-green-200"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Confirmadas: {confirmed}
            </Badge>
          )}

          {pending > 0 && (
            <Badge
              variant="outline"
              className="bg-yellow-100 text-yellow-700 border-yellow-200"
            >
              <Clock className="h-3 w-3 mr-1" />
              Pendientes: {pending}
            </Badge>
          )}

          {cancelled > 0 && (
            <Badge
              variant="outline"
              className="bg-red-100 text-red-700 border-red-200"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Canceladas: {cancelled}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
