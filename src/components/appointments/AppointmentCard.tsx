import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WhatsAppButton } from "@/components/appointments/WhatsAppButton";
import { User, Clock, Trash2, AlertCircle, Users, DoorOpen, ImageIcon, Globe, Pencil } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

interface StatusConfig {
  [key: string]: {
    label: string;
    class: string;
  };
}

interface AppointmentCardProps {
  appointment: Appointment;
  isUpcoming: boolean;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  statusConfig: StatusConfig;
  isOwner: boolean;
}

export function AppointmentCard({
  appointment,
  isUpcoming,
  onEdit,
  onDelete,
  onStatusChange,
  statusConfig,
  isOwner,
}: AppointmentCardProps) {
  const status = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending;
  const serviceNames = appointment.appointment_services
    .map(s => s.services?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        isUpcoming
          ? "border-warning bg-warning/10 ring-2 ring-warning/50 animate-pulse"
          : "border-border bg-muted/30"
      )}
    >
      {isUpcoming && (
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => onEdit(appointment)}
            title="Editar cita"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <WhatsAppButton
            phone={appointment.clients?.phone || null}
            clientName={appointment.clients?.name || ""}
            appointmentTime={appointment.start_time}
          />
          <Select
            value={appointment.status}
            onValueChange={(value) => onStatusChange(appointment.id, value)}
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
                  onDelete(appointment.id);
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
}
