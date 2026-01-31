import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WhatsAppButtonProps {
  phone: string | null;
  clientName: string;
  appointmentTime: string;
  className?: string;
}

export function WhatsAppButton({
  phone,
  clientName,
  appointmentTime,
  className,
}: WhatsAppButtonProps) {
  if (!phone) return null;

  const handleClick = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const date = new Date(appointmentTime);
    const formattedDate = format(date, "EEEE d 'de' MMMM", { locale: es });
    const formattedTime = format(date, "HH:mm");
    const message = encodeURIComponent(
      `Hola ${clientName}, te recordamos tu cita para el ${formattedDate} a las ${formattedTime} hrs. ¡Te esperamos!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={`bg-[#25D366] hover:bg-[#128C7E] text-white border-none gap-2 ${className}`}
      onClick={handleClick}
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp
    </Button>
  );
}
