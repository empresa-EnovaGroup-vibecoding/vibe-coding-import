import { useNavigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";

interface RequireSubscriptionProps {
  children: React.ReactNode;
}

export function RequireSubscription({ children }: RequireSubscriptionProps) {
  const { subscriptionStatus, loading, isSuperAdmin } = useTenant();
  const navigate = useNavigate();

  if (loading) {
    return null;
  }

  // Super admins siempre tienen acceso
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Trial activo o plan activo = acceso permitido
  if (subscriptionStatus === "active" || subscriptionStatus === "trial") {
    return <>{children}</>;
  }

  // Expired, cancelled, past_due = bloquear
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Tu plan ha vencido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Tu periodo de prueba gratuito ha terminado. Activa tu plan para seguir
            usando todas las funciones de tu negocio.
          </p>
          <Button
            onClick={() => navigate("/membership")}
            size="lg"
            className="w-full h-12 text-base"
          >
            <Crown className="mr-2 h-5 w-5" />
            Ver planes y activar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
