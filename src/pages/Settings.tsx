import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2, Camera, Trash2, Globe, Link2, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { BusinessHoursCard } from "@/components/settings/BusinessHoursCard";
import { InstallAppGuide } from "@/components/pwa/InstallAppGuide";

const settingsSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  phone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});

export default function Settings() {
  const { tenant, tenantId, isOwner, refetch } = useTenant();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Redirect staff users
  useEffect(() => {
    if (!isOwner && tenant) {
      navigate("/");
    }
  }, [isOwner, tenant, navigate]);

  // Load current tenant data
  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        phone: tenant.phone ?? "",
        address: tenant.address ?? "",
      });
      setLogoPreview(tenant.logo_url);
    }
  }, [tenant]);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede pesar mas de 2MB");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !tenantId) return tenant?.logo_url ?? null;

    setIsUploadingLogo(true);
    try {
      const ext = logoFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filePath = `${tenantId}/logo.${ext}`;

      // Delete previous logo if exists
      if (tenant?.logo_url) {
        const oldPath = tenant.logo_url.split("/tenant-logos/")[1];
        if (oldPath) {
          await supabase.storage.from("tenant-logos").remove([oldPath]);
        }
      }

      const { error } = await supabase.storage
        .from("tenant-logos")
        .upload(filePath, logoFile, { upsert: true });

      if (error) {
        toast.error("Error al subir el logo");
        return tenant?.logo_url ?? null;
      }

      const { data: urlData } = supabase.storage
        .from("tenant-logos")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (!tenantId || !tenant?.logo_url) return;

    try {
      const oldPath = tenant.logo_url.split("/tenant-logos/")[1];
      if (oldPath) {
        await supabase.storage.from("tenant-logos").remove([oldPath]);
      }

      const { error } = await supabase
        .from("tenants")
        .update({ logo_url: null } as Record<string, unknown>)
        .eq("id", tenantId);

      if (error) throw error;

      setLogoPreview(null);
      setLogoFile(null);
      await refetch();
      toast.success("Logo eliminado");
    } catch (err) {
      toast.error("Error al eliminar el logo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      settingsSchema.parse(formData);
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

    if (!tenantId) return;

    setIsSaving(true);
    try {
      // Upload logo if changed
      const logoUrl = await uploadLogo();

      const { error } = await supabase
        .from("tenants")
        .update({
          name: formData.name.trim(),
          phone: formData.phone || null,
          address: formData.address || null,
          logo_url: logoUrl,
        } as Record<string, unknown>)
        .eq("id", tenantId);

      if (error) {
        if (error.message.includes("tenants_name_not_empty")) {
          toast.error("El nombre no puede estar vacio");
        } else if (error.message.includes("tenants_name_max_length")) {
          toast.error("El nombre es demasiado largo");
        } else {
          toast.error(error.message);
        }
        return;
      }

      setLogoFile(null);
      await refetch();
      toast.success("Configuracion actualizada");
    } catch (err) {
      toast.error("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  if (!tenant) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion del Negocio</h1>
        <p className="text-muted-foreground">
          Edita los datos de tu negocio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Datos del negocio
          </CardTitle>
          <CardDescription>
            Informacion visible para tu equipo de trabajo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo del negocio</Label>
              <div className="flex items-center gap-4">
                <div
                  className="relative h-20 w-20 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo del negocio"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? "Cambiar" : "Subir logo"}
                  </Button>
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={removeLogo}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG o WebP. Max 2MB.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleLogoSelect}
                />
              </div>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="business-name">Nombre del negocio *</Label>
              <Input
                id="business-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Slug (solo lectura) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                URL del negocio
              </Label>
              <Input
                value={tenant.slug}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                La URL se genera al crear el negocio y no se puede cambiar.
              </p>
            </div>

            {/* Telefono */}
            <div className="space-y-2">
              <Label htmlFor="business-phone">Telefono</Label>
              <Input
                id="business-phone"
                type="tel"
                placeholder="+57 300 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            {/* Direccion */}
            <div className="space-y-2">
              <Label htmlFor="business-address">Direccion</Label>
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
              disabled={isSaving || isUploadingLogo}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <BusinessHoursCard />

      {/* Booking Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link de Reservas Online
          </CardTitle>
          <CardDescription>
            Comparte este link con tus clientes para que reserven citas desde su celular.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={`${window.location.origin}/book/${tenant.slug}`}
              readOnly
              className="bg-muted text-muted-foreground"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/book/${tenant.slug}`);
                setLinkCopied(true);
                toast.success("Link copiado al portapapeles");
                setTimeout(() => setLinkCopied(false), 2000);
              }}
            >
              {linkCopied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tus clientes podran ver tus servicios, elegir fecha/hora, y subir comprobante de pago.
          </p>
        </CardContent>
      </Card>

      <InstallAppGuide />
    </div>
  );
}
