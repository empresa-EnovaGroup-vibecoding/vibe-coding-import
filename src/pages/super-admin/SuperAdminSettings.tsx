import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface PlatformSetting {
  key: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
}

export function SuperAdminSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [platformName, setPlatformName] = useState("");
  const [trialDays, setTrialDays] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [annualPrice, setAnnualPrice] = useState("");

  const [originalValues, setOriginalValues] = useState({
    platformName: "",
    trialDays: "",
    monthlyPrice: "",
    annualPrice: "",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*");

      if (error) throw error;
      return data as PlatformSetting[];
    },
  });

  useEffect(() => {
    if (settings) {
      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      const values = {
        platformName: settingsMap.platform_name || "",
        trialDays: settingsMap.trial_duration_days || "",
        monthlyPrice: settingsMap.monthly_price || "",
        annualPrice: settingsMap.annual_price || "",
      };

      setPlatformName(values.platformName);
      setTrialDays(values.trialDays);
      setMonthlyPrice(values.monthlyPrice);
      setAnnualPrice(values.annualPrice);
      setOriginalValues(values);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuario no autenticado");

      const updates: Array<{ key: string; value: string }> = [];

      if (platformName !== originalValues.platformName) {
        updates.push({ key: "platform_name", value: platformName });
      }
      if (trialDays !== originalValues.trialDays) {
        updates.push({ key: "trial_duration_days", value: trialDays });
      }
      if (monthlyPrice !== originalValues.monthlyPrice) {
        updates.push({ key: "monthly_price", value: monthlyPrice });
      }
      if (annualPrice !== originalValues.annualPrice) {
        updates.push({ key: "annual_price", value: annualPrice });
      }

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert({
            key: update.key,
            value: update.value,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>);

        if (error) throw error;
      }

      return updates.length;
    },
    onSuccess: (updatesCount) => {
      toast.success(`${updatesCount} configuraciones actualizadas correctamente`);
      queryClient.invalidateQueries({ queryKey: ["platform_settings"] });
      setOriginalValues({
        platformName,
        trialDays,
        monthlyPrice,
        annualPrice,
      });
    },
    onError: (error) => {
      toast.error("Error al guardar las configuraciones");
    },
  });

  const hasChanges = () => {
    return (
      platformName !== originalValues.platformName ||
      trialDays !== originalValues.trialDays ||
      monthlyPrice !== originalValues.monthlyPrice ||
      annualPrice !== originalValues.annualPrice
    );
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <CardTitle>Configuración de la Plataforma</CardTitle>
          </div>
          <CardDescription>
            Administra los parámetros globales del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="platformName">Nombre de la Plataforma</Label>
            <Input
              id="platformName"
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="Nombre de tu plataforma"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trialDays">Duración del Periodo de Prueba (días)</Label>
            <Input
              id="trialDays"
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              placeholder="14"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyPrice">Precio Mensual</Label>
            <Input
              id="monthlyPrice"
              type="number"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              placeholder="29.99"
              step="0.01"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualPrice">Precio Anual</Label>
            <Input
              id="annualPrice"
              type="number"
              value={annualPrice}
              onChange={(e) => setAnnualPrice(e.target.value)}
              placeholder="299.99"
              step="0.01"
              min="0"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges() || saveMutation.isPending}
              className="min-w-[150px]"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
