import { useSearchParams } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, CreditCard, Sparkles, ExternalLink, Headphones, BookOpen, Users, Zap } from "lucide-react";

const SKOOL_URL = "https://www.skool.com/gestorq-8720";

const MONTHLY_PRICE = 49;
const ANNUAL_PRICE = 399;
const ANNUAL_MONTHLY_EQUIVALENT = Math.round(ANNUAL_PRICE / 12);
const ANNUAL_SAVINGS = (MONTHLY_PRICE * 12) - ANNUAL_PRICE;

const features = [
  "Clientes ilimitados",
  "Agenda con calendario",
  "Punto de Venta completo",
  "Gestion de inventario",
  "Reportes y estadisticas",
  "Historial clinico facial",
  "Paquetes de sesiones",
  "Gestion de equipo y cabinas",
  "Soporte prioritario",
];

const benefits = [
  {
    icon: Headphones,
    title: "Soporte Exclusivo",
    description: "Acceso prioritario a nuestro equipo de soporte",
  },
  {
    icon: BookOpen,
    title: "Acceso a Cursos",
    description: "Formacion completa sobre gestion de negocios",
  },
  {
    icon: Users,
    title: "Comunidad Privada",
    description: "Conecta con otros profesionales del sector",
  },
  {
    icon: Zap,
    title: "Gestion Ilimitada",
    description: "Sin limites en clientes, citas o inventario",
  },
];

export default function Membership() {
  const { tenant, subscriptionStatus, isOwner } = useTenant();
  const [searchParams] = useSearchParams();

  const isSuccess = searchParams.get("success") === "true";

  const handleJoinClick = () => {
    window.open(SKOOL_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {subscriptionStatus === "active" ? "Tu Plan Actual" : "Elige tu Plan"}
        </h1>
        <p className="text-muted-foreground">
          {tenant?.name ?? "Tu negocio"} - Todas las herramientas para gestionar tu negocio
        </p>
      </div>

      {isSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <p className="text-primary font-medium">
            Tu plan ha sido activado exitosamente.
          </p>
        </div>
      )}

      {/* Active subscription card */}
      {subscriptionStatus === "active" && (
        <Card className="mb-8 border-primary">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold text-lg">Plan Activo</p>
                <p className="text-sm text-muted-foreground">
                  {tenant?.plan_type === "annual" ? "Plan Anual" : "Plan Mensual"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-primary text-primary">
              <Check className="h-3 w-3 mr-1" />
              Activo
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Pricing cards - show when not active */}
      {subscriptionStatus !== "active" && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Monthly */}
          <Card className="relative">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Plan Mensual</CardTitle>
              <CardDescription>Pago mensual, cancela cuando quieras</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${MONTHLY_PRICE}</span>
                <span className="text-muted-foreground"> /mes</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Annual */}
          <Card className="relative border-2 border-primary">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                Ahorra ${ANNUAL_SAVINGS}/ano
              </Badge>
            </div>
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-xl">Plan Anual</CardTitle>
              <CardDescription>Mejor precio, 2 meses gratis</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${ANNUAL_PRICE}</span>
                <span className="text-muted-foreground"> /ano</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Equivale a ${ANNUAL_MONTHLY_EQUIVALENT}/mes
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Benefits section */}
      <Card className="mb-8 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <Crown className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">GestorQ Pro / Comunidad</CardTitle>
          <CardDescription>Acceso exclusivo a soporte, cursos y comunidad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <benefit.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{benefit.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {benefit.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* CTA - Skool payment */}
          {isOwner && subscriptionStatus !== "active" && (
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleJoinClick}
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
              >
                <Crown className="mr-2 h-5 w-5" />
                Unete ahora y Paga Seguro en Skool
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Pagos procesados de forma segura a traves de la plataforma Skool.
                Una vez realizado el pago, tu plan se activara en minutos.
              </p>
            </div>
          )}

          {subscriptionStatus === "active" && (
            <div className="text-center pt-2">
              <Button
                onClick={handleJoinClick}
                variant="outline"
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Acceder a mi cuenta en Skool
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Pagos procesados de forma segura a traves de Skool. Puedes cancelar en cualquier momento.
      </p>
    </div>
  );
}
