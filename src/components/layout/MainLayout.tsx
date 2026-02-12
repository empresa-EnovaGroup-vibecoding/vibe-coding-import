import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import { AppSidebar } from "./AppSidebar";
import { TrialBanner } from "./TrialBanner";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  // Realtime: listen for new online bookings
  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel("online-bookings")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const notes = (payload.new as { notes?: string }).notes;
          if (notes?.includes("Reserva online")) {
            toast.info("Nueva reserva online recibida", {
              description: "Un cliente acaba de agendar una cita desde el link de reservas.",
              duration: 15000,
              action: {
                label: "Ver agenda",
                onClick: () => window.location.assign("/appointments"),
              },
            });

            // Invalidate queries so appointment lists refresh
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            queryClient.invalidateQueries({ queryKey: ["todayAppointments", tenantId] });
            queryClient.invalidateQueries({ queryKey: ["todayAppointmentsCount", tenantId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, queryClient]);

  return (
    <div className="min-h-screen bg-background">
      <TrialBanner />
      <AppSidebar />
      <main className="lg:pl-64">
        <div className="min-h-screen p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
