import { AppointmentCard } from "./AppointmentCard";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

interface AppointmentDayViewProps {
  appointments: Appointment[] | undefined;
  isLoading: boolean;
  selectedDate: Date;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  statusConfig: StatusConfig;
  isOwner: boolean;
  isUpcoming: (startTime: string) => boolean;
}

export function AppointmentDayView({
  appointments,
  isLoading,
  selectedDate,
  onEdit,
  onDelete,
  onStatusChange,
  statusConfig,
  isOwner,
  isUpcoming,
}: AppointmentDayViewProps) {
  return (
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
      ) : !appointments || appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No hay citas para este día</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              isUpcoming={isUpcoming(appointment.start_time)}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              statusConfig={statusConfig}
              isOwner={isOwner}
            />
          ))}
        </div>
      )}
    </div>
  );
}
