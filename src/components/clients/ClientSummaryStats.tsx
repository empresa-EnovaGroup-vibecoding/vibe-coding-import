import { DollarSign, TrendingUp, Calendar, Scissors } from "lucide-react";
import { formatDate } from "./ClientAppointmentCard";

interface ClientSummaryStatsProps {
  totalSpent: number;
  totalVisits: number;
  lastVisit: string | null;
  topService: [string, number] | null;
}

export function ClientSummaryStats({
  totalSpent,
  totalVisits,
  lastVisit,
  topService,
}: ClientSummaryStatsProps) {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <DollarSign className="h-4 w-4" />
          <span className="text-xs font-medium">Total Gastado</span>
        </div>
        <p className="text-xl font-bold text-foreground">Q{totalSpent.toFixed(2)}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">Visitas</span>
        </div>
        <p className="text-xl font-bold text-foreground">{totalVisits}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-medium">Ultima Visita</span>
        </div>
        <p className="text-sm font-bold text-foreground">
          {lastVisit ? formatDate(lastVisit, "d MMM yyyy") : "Sin visitas"}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Scissors className="h-4 w-4" />
          <span className="text-xs font-medium">Servicio Favorito</span>
        </div>
        <p className="text-sm font-bold text-foreground truncate">
          {topService ? `${topService[0]} (${topService[1]}x)` : "N/A"}
        </p>
      </div>
    </div>
  );
}
