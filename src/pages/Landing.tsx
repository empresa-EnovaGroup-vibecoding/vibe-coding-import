import { Link } from "react-router-dom";
import {
  Calendar,
  ShoppingCart,
  Users,
  BarChart3,
  Globe,
  Building2,
  Check,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        {/* Gradient Background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

        <div className="mx-auto max-w-6xl text-center">
          {/* Logo/Brand */}
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 md:text-7xl">
            Aura
          </h1>

          {/* Subtitle */}
          <p className="mb-4 text-2xl font-semibold text-gray-800 md:text-3xl">
            La plataforma todo-en-uno para gestionar tu negocio
          </p>

          {/* Pain Point Description */}
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
            Deja atrás las agendas de papel, las planillas desordenadas y los
            mensajes perdidos. Aura centraliza tus citas, clientes, ventas y
            reportes en un solo lugar, para que te enfoques en lo que realmente
            importa: hacer crecer tu negocio.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/auth">
              <Button
                size="lg"
                className="group w-full gap-2 px-8 py-6 text-lg shadow-lg transition-all hover:scale-105 sm:w-auto"
              >
                Empieza gratis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            <a href="#" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 px-8 py-6 text-lg shadow-sm transition-all hover:scale-105 sm:w-auto"
              >
                <MessageCircle className="h-5 w-5" />
                Contáctanos
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Todo lo que necesitas en una sola plataforma
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Diseñado específicamente para salones de belleza, clínicas,
              barberías, spas, consultorios y más
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1: Agenda */}
            <Card className="group transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Calendar className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Agenda inteligente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Gestiona citas, horarios y disponibilidad en tiempo real. Sin
                  dobles reservas ni confusiones.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2: POS */}
            <Card className="group transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Punto de venta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Registra ventas de productos y servicios con un clic. Control
                  total de tu inventario y facturación.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3: Clients */}
            <Card className="group transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Gestión de clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Historial completo, fichas clínicas y seguimiento
                  personalizado. Conoce a tus clientes como nunca antes.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4: Reports */}
            <Card className="group transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Reportes financieros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Métricas de ingresos, gastos y rentabilidad. Toma decisiones
                  basadas en datos reales.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5: Online Booking */}
            <Card className="group transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Globe className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Reservas online</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Tus clientes agendan desde su celular 24/7. Aumenta tus
                  reservas sin trabajo extra.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6: Multi-location */}
            <Card className="group transition-all hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <Building2 className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Multi-sucursal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Administra varios locales desde una sola cuenta. Centraliza
                  el control de tu cadena de negocios.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              Precios simples y transparentes
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Sin costos ocultos. Todas las funciones incluidas en ambos planes
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Monthly Plan */}
            <Card className="transition-all hover:shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="mb-2 text-2xl">Plan Mensual</CardTitle>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">$49</span>
                  <span className="text-gray-600">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {[
                    "Agenda ilimitada",
                    "Gestión de clientes",
                    "Punto de venta integrado",
                    "Reportes y estadísticas",
                    "Reservas online",
                    "Soporte prioritario",
                    "Actualizaciones incluidas",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block">
                  <Button
                    variant="outline"
                    className="w-full py-6 text-lg"
                    size="lg"
                  >
                    Empezar ahora
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Annual Plan (Recommended) */}
            <Card className="relative border-2 border-primary shadow-xl transition-all hover:shadow-2xl">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4 py-1">
                Ahorra $189
              </Badge>
              <CardHeader className="text-center">
                <CardTitle className="mb-2 text-2xl">Plan Anual</CardTitle>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">$399</span>
                  <span className="text-gray-600">/año</span>
                </div>
                <p className="text-sm text-primary">
                  Equivalente a $33/mes
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {[
                    "Agenda ilimitada",
                    "Gestión de clientes",
                    "Punto de venta integrado",
                    "Reportes y estadísticas",
                    "Reservas online",
                    "Soporte prioritario",
                    "Actualizaciones incluidas",
                    "2 meses gratis",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block">
                  <Button className="w-full py-6 text-lg shadow-lg" size="lg">
                    Empezar ahora
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Transforma tu negocio hoy mismo
          </h2>
          <p className="mb-8 text-lg text-gray-600 md:text-xl">
            Únete a cientos de negocios que ya están creciendo con Aura.
            Comienza tu prueba gratuita sin tarjeta de crédito.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/auth">
              <Button
                size="lg"
                className="group w-full gap-2 px-8 py-6 text-lg shadow-lg transition-all hover:scale-105 sm:w-auto"
              >
                Crear cuenta gratis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            <a href="#" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 px-8 py-6 text-lg shadow-sm transition-all hover:scale-105 sm:w-auto"
              >
                <MessageCircle className="h-5 w-5" />
                Habla con ventas
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-gray-600">
          <p>&copy; 2026 Aura. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
