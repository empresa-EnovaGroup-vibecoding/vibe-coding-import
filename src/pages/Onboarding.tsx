import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const onboardingSchema = z.object({
  businessName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 63);
}

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch, hasTenant } = useTenant();
  const navigate = useNavigate();

  // Si ya tiene negocio, redirigir al dashboard
  useEffect(() => {
    if (hasTenant) {
      navigate("/", { replace: true });
    }
  }, [hasTenant, navigate]);

  const [formData, setFormData] = useState({
    businessName: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const currentSlug = generateSlug(formData.businessName);

  const checkSlugAvailability = async (slug: string) => {
    if (slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    setCheckingSlug(true);
    const { data } = await supabase.rpc("is_slug_available", { _slug: slug });
    setSlugAvailable(data === true);
    setCheckingSlug(false);
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, businessName: name });
    const slug = generateSlug(name);
    if (slug.length >= 3) {
      checkSlugAvailability(slug);
    } else {
      setSlugAvailable(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      onboardingSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    if (!user) {
      toast.error("Debes estar autenticado");
      return;
    }

    const slug = currentSlug;
    if (slug.length < 3) {
      setErrors({ businessName: "El nombre es muy corto para generar una URL" });
      return;
    }

    setIsCreating(true);
    try {
      const { data: tenantId, error } = await supabase.rpc("create_tenant", {
        _name: formData.businessName.trim(),
        _slug: slug,
        _phone: formData.phone || null,
        _address: formData.address || null,
      });

      if (error) {
        if (error.message.includes("duplicate key") || error.message.includes("unique")) {
          toast.error("Ya existe un negocio con ese nombre. Intenta con otro.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Negocio creado exitosamente");
      await refetch();
      navigate("/");
    } catch (err) {
      console.error("Error creating tenant:", err);
      toast.error("Error al crear el negocio");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Configura tu negocio</CardTitle>
            <CardDescription>
              Crea tu espacio de trabajo. Tendras 7 dias gratis para probar todas las funciones.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="business-name">Nombre del negocio *</Label>
              <Input
                id="business-name"
                type="text"
                placeholder="Ej: Spa Bella Luna"
                value={formData.businessName}
                onChange={(e) => handleNameChange(e.target.value)}
                className={errors.businessName ? "border-destructive" : ""}
              />
              {errors.businessName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.businessName}
                </p>
              )}
              {currentSlug.length >= 3 && (
                <div className="flex items-center gap-1 text-xs">
                  {checkingSlug ? (
                    <span className="text-muted-foreground">Verificando disponibilidad...</span>
                  ) : slugAvailable === true ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      URL disponible: {currentSlug}
                    </span>
                  ) : slugAvailable === false ? (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      URL no disponible. Intenta con otro nombre.
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-phone">Telefono (opcional)</Label>
              <Input
                id="business-phone"
                type="tel"
                placeholder="+57 300 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-address">Direccion (opcional)</Label>
              <Textarea
                id="business-address"
                placeholder="Calle 123, Ciudad"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isCreating || slugAvailable === false}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creando negocio...
                </>
              ) : (
                "Crear mi negocio y comenzar trial gratis"
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              7 dias gratis. No se requiere tarjeta de credito.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
