import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Phone } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BookingSuccessProps {
  bookingResult: {
    service_name: string;
    start_time: string;
    end_time: string;
    price: number
  };
  phone: string | null;
}

export function BookingSuccess({ bookingResult, phone }: BookingSuccessProps) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reserva Confirmada</h2>
        <p className="text-gray-500 mt-1">Te contactaremos para confirmar tu cita</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3 text-left">
          <div className="flex justify-between">
            <span className="text-gray-500">Servicio</span>
            <span className="font-medium">{bookingResult.service_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fecha</span>
            <span className="font-medium">
              {format(new Date(bookingResult.start_time), "d 'de' MMMM, yyyy", { locale: es })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Hora</span>
            <span className="font-medium">
              {format(new Date(bookingResult.start_time), "HH:mm")} - {format(new Date(bookingResult.end_time), "HH:mm")}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-blue-600">Q{Number(bookingResult.price).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {phone && (
        <a
          href={`https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
            `Hola! Acabo de reservar ${bookingResult.service_name} para el ${format(new Date(bookingResult.start_time), "d/MM 'a las' HH:mm")}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
        >
          <Phone className="h-5 w-5" />
          Contactar por WhatsApp
        </a>
      )}
    </div>
  );
}
