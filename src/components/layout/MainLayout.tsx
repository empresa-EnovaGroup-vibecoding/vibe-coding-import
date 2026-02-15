import { Suspense, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { TrialBanner } from "./TrialBanner";
import { ErrorBoundary } from "./ErrorBoundary";

const ContentLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground">
        Saltar al contenido principal
      </a>
      <AppSidebar />
      <main id="main-content" className="lg:pl-64">
        <TrialBanner />
        <div className="min-h-screen p-4 lg:p-8">
          <ErrorBoundary>
            <Suspense fallback={<ContentLoader />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
