import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { UserX, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InactiveClients() {
  const { tenantId } = useTenant();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: inactiveClients, isLoading } = useQuery({
    queryKey: ["inactiveClients", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      // Get all clients with phone
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, name, phone")
        .eq("tenant_id", tenantId)
        .not("phone", "is", null);
      if (clientsError) throw clientsError;

      // Get clients with recent appointments (last 30 days)
      const { data: recentAppointments, error: apptError } = await supabase
        .from("appointments")
        .select("client_id")
        .eq("tenant_id", tenantId)
        .gte("start_time", thirtyDaysAgo.toISOString());
      if (apptError) throw apptError;

      const activeClientIds = new Set(
        recentAppointments?.map((a) => a.client_id)
      );

      return clients?.filter((c) => !activeClientIds.has(c.id)) ?? [];
    },
    enabled: !!tenantId,
  });

  const handleReengage = (client: { name: string; phone: string }) => {
    const cleanPhone = client.phone.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `Hola ${client.name}! Te echamos de menos en el spa. Tenemos novedades increibles esperandote. Te gustaria agendar una cita? Te esperamos!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  if (isLoading || !inactiveClients || inactiveClients.length === 0)
    return null;

  return (
    <div className="rounded-xl border border-orange-200 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserX className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-foreground">
            Clientes Inactivos
          </h3>
        </div>
        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium">
          {inactiveClients.length} sin visita en 30+ dias
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Clientes que no han agendado cita en los ultimos 30 dias. Enviales un
        mensaje para que vuelvan.
      </p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {inactiveClients.slice(0, 10).map((client) => (
          <div
            key={client.id}
            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{client.name}</p>
              <p className="text-xs text-muted-foreground">{client.phone}</p>
            </div>
            <Button
              size="sm"
              className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none gap-1.5 h-8 shrink-0"
              onClick={() =>
                handleReengage(client as { name: string; phone: string })
              }
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Re-enganchar
            </Button>
          </div>
        ))}
        {inactiveClients.length > 10 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            y {inactiveClients.length - 10} clientes mas...
          </p>
        )}
      </div>
    </div>
  );
}
