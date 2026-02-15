import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export const formatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return "Fecha no disponible";
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  return isValid(date) ? format(date, formatStr, { locale: es }) : "Fecha inválida";
};

const statusConfig = {
  pending: { label: "Pendiente", class: "status-pending" },
  confirmed: { label: "Confirmada", class: "status-confirmed" },
  completed: { label: "Completada", class: "status-completed" },
  cancelled: { label: "Cancelada", class: "status-cancelled" },
};

interface ClientAppointmentCardProps {
  appointment: {
    id: string;
    start_time: string;
    status: string;
    total_price: number;
    appointment_services: {
      id: string;
      price_at_time: number;
      services: { name: string } | null;
    }[];
  };
}

export function ClientAppointmentCard({ appointment }: ClientAppointmentCardProps) {
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
