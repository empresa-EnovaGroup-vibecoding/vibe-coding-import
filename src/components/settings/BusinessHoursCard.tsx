import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miercoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sabado",
  sunday: "Domingo",
};

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DEFAULT_HOURS: BusinessHours = {
  monday:    { enabled: true,  open: "09:00", close: "18:00" },
  tuesday:   { enabled: true,  open: "09:00", close: "18:00" },
  wednesday: { enabled: true,  open: "09:00", close: "18:00" },
  thursday:  { enabled: true,  open: "09:00", close: "18:00" },
  friday:    { enabled: true,  open: "09:00", close: "18:00" },
  saturday:  { enabled: true,  open: "09:00", close: "14:00" },
  sunday:    { enabled: false, open: "09:00", close: "14:00" },
};

export function BusinessHoursCard() {
  const { tenant, tenantId, refetch } = useTenant();
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenant?.business_hours) {
      setHours(tenant.business_hours as unknown as BusinessHours);
    }
  }, [tenant]);

  const updateDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof BusinessHours], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!tenantId) return;

    // Validate: close must be after open for enabled days
    for (const day of DAY_ORDER) {
      const schedule = hours[day as keyof BusinessHours];
      if (schedule.enabled && schedule.close <= schedule.open) {
        toast.error(`${DAY_LABELS[day]}: la hora de cierre debe ser despues de la apertura`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({ business_hours: hours } as Record<string, unknown>)
        .eq("id", tenantId);

      if (error) throw error;

      await refetch();
      toast.success("Horario actualizado");
    } catch (err) {
      console.error("Error saving hours:", err);
      toast.error("Error al guardar el horario");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horario del Negocio
        </CardTitle>
        <CardDescription>
          Configura los dias y horas de atencion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAY_ORDER.map((day) => {
          const schedule = hours[day as keyof BusinessHours];
          return (
            <div
              key={day}
              className="flex items-center gap-4 py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-3 w-32">
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={(checked) => updateDay(day, "enabled", checked)}
                />
                <Label className={schedule.enabled ? "font-medium" : "text-muted-foreground"}>
                  {DAY_LABELS[day]}
                </Label>
              </div>

              {schedule.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={schedule.open}
                    onChange={(e) => updateDay(day, "open", e.target.value)}
                    className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <span className="text-muted-foreground text-sm">a</span>
                  <input
                    type="time"
                    value={schedule.close}
                    onChange={(e) => updateDay(day, "close", e.target.value)}
                    className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Cerrado</span>
              )}
            </div>
          );
        })}

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto mt-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar horario"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
