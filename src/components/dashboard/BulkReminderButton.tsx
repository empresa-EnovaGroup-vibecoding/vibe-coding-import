import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageCircle, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

interface Appointment {
  id: string;
  start_time: string;
  status: string;
  confirmation_token: string | null;
  reminder_sent_at: string | null;
  clients: { name: string; phone: string | null } | null;
  appointment_services: { id: string; services: { name: string } | null }[];
}

interface BulkReminderButtonProps {
  appointments: Appointment[];
}

export function BulkReminderButton({ appointments }: BulkReminderButtonProps) {
  const { tenantId } = useTenant();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const remindable = appointments.filter(
    (a) =>
      ["pending", "confirmed"].includes(a.status) &&
      a.clients?.phone
  );

  if (remindable.length === 0) return null;

  const sentCount = remindable.filter((a) => sentIds.has(a.id)).length;

  const handleSendReminder = async (appointment: Appointment) => {
    const phone = appointment.clients?.phone;
    const clientName = appointment.clients?.name ?? "Cliente";
    if (!phone) return;

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const date = new Date(appointment.start_time);
    const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });
    const formattedTime = format(date, "HH:mm");

    try {
      // Generate confirmation token if not exists
      let token = appointment.confirmation_token;
      if (!token) {
        token = crypto.randomUUID();
        const { error } = await supabase
          .from("appointments")
          .update({
            confirmation_token: token,
            reminder_sent_at: new Date().toISOString(),
          })
          .eq("id", appointment.id)
          .eq("tenant_id", tenantId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("appointments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", appointment.id)
          .eq("tenant_id", tenantId);
        if (error) throw error;
      }

      // Build confirmation link
      const confirmLink = `${window.location.origin}/confirm/${token}`;

      const serviceNames = appointment.appointment_services
        ?.map((s) => s.services?.name)
        .filter(Boolean)
        .join(", ");

      const message = encodeURIComponent(
        `Hola ${clientName}, te recordamos tu cita` +
        (serviceNames ? ` de *${serviceNames}*` : "") +
        ` para el ${formattedDate} a las ${formattedTime} hrs.\n\n` +
        `Confirma o cancela aqui:\n${confirmLink}\n\n` +
        `Te esperamos!`
      );

      window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
      setSentIds((prev) => new Set(prev).add(appointment.id));
    } catch {
      toast.error("Error al enviar recordatorio");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Recordar a todos ({remindable.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            Enviar Recordatorios ({sentCount}/{remindable.length})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {remindable.map((appointment) => {
            const sent = sentIds.has(appointment.id);
            const alreadySent = !!appointment.reminder_sent_at && !sent;
            const serviceNames = appointment.appointment_services
              ?.map((s) => s.services?.name)
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={appointment.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  sent
                    ? "bg-green-50 border-green-200"
                    : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {appointment.clients?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(appointment.start_time), "HH:mm")} -{" "}
                    {serviceNames || "Sin servicio"}
                  </p>
                  {alreadySent && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Recordatorio previo enviado
                    </p>
                  )}
                </div>
                {sent ? (
                  <div className="flex items-center gap-1 text-green-600 text-xs font-medium shrink-0">
                    <Check className="h-4 w-4" />
                    Enviado
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none gap-1.5 h-8 shrink-0"
                    onClick={() => handleSendReminder(appointment)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Enviar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {sentCount === remindable.length && (
          <p className="text-center text-green-600 font-medium text-sm py-2">
            Todos los recordatorios enviados
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
