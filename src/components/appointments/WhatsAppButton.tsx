import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";

interface WhatsAppButtonProps {
  phone: string | null;
  clientName: string;
  appointmentTime: string;
  appointmentId?: string;
  confirmationToken?: string | null;
  className?: string;
}

export function WhatsAppButton({
  phone,
  clientName,
  appointmentTime,
  appointmentId,
  confirmationToken,
  className,
}: WhatsAppButtonProps) {
  const { tenantId } = useTenant();
  const [isSending, setIsSending] = useState(false);
  if (!phone) return null;

  const handleClick = async () => {
    if (isSending) return;
    setIsSending(true);
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const date = new Date(appointmentTime);
    const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });
    const formattedTime = format(date, "HH:mm");

    let confirmLink = "";

    if (appointmentId && !confirmationToken) {
      const token = crypto.randomUUID();
      await supabase
        .from("appointments")
        .update({
          confirmation_token: token,
          reminder_sent_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .eq("tenant_id", tenantId);
      confirmLink = `${window.location.origin}/confirm/${token}`;
    } else if (confirmationToken) {
      confirmLink = `${window.location.origin}/confirm/${confirmationToken}`;
      if (appointmentId) {
        await supabase
          .from("appointments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", appointmentId)
          .eq("tenant_id", tenantId);
      }
    }

    let messageText = `Hola ${clientName}, te recordamos tu cita para el ${formattedDate} a las ${formattedTime} hrs.`;

    if (confirmLink) {
      messageText += `\n\nConfirma o cancela aqui:\n${confirmLink}`;
    }

    messageText += `\n\nTe esperamos!`;

    const message = encodeURIComponent(messageText);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
    setIsSending(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`bg-[#25D366] hover:bg-[#128C7E] text-white border-none gap-2 ${className}`}
      onClick={handleClick}
      disabled={isSending}
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp
    </Button>
  );
}
