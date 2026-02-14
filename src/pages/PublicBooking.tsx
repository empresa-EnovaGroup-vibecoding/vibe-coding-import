import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  Upload,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface ServiceInfo {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface BookingInfo {
  id: string;
  name: string;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  business_hours: Record<string, { enabled: boolean; open: string; close: string }> | null;
  services: ServiceInfo[];
}

interface BookedSlot {
  start_time: string;
  end_time: string;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function generateTimeSlots(
  open: string,
  close: string,
  durationMin: number,
  booked: BookedSlot[],
  selectedDate: string
): string[] {
  const [openH, openM] = open.split(":").map(Number);
  const [closeH, closeM] = close.split(":").map(Number);
  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;
  const slots: string[] = [];

  for (let t = openTotal; t + durationMin <= closeTotal; t += 30) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    const slotStart = new Date(`${selectedDate}T${hh}:${mm}:00`);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

    const hasConflict = booked.some((b) => {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return slotStart < bEnd && slotEnd > bStart;
    });

    if (!hasConflict) {
      slots.push(`${hh}:${mm}`);
    }
  }

  // Filter out past times if date is today
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  if (selectedDate === today) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.filter((s) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m > currentMinutes + 30; // at least 30 min from now
    });
  }

  return slots;
}

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps: 1=services, 2=date/time, 3=info+receipt, 4=success
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    service_name: string;
    start_time: string;
    end_time: string;
    price: number;
  } | null>(null);

  // Fetch tenant info
  const { data: info, isLoading } = useQuery({
    queryKey: ["publicBooking", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_get_booking_info", {
        p_slug: slug!,
      });
      if (error) throw error;
      return data as BookingInfo | null;
    },
    enabled: !!slug,
  });

  // Fetch booked slots for selected date
  const { data: bookedSlots } = useQuery({
    queryKey: ["bookedSlots", info?.id, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_get_booked_slots", {
        p_tenant_id: info!.id,
        p_date: selectedDate,
      });
      if (error) throw error;
      return (data as BookedSlot[]) ?? [];
    },
    enabled: !!info?.id && !!selectedDate,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede pesar mas de 5MB");
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile || !info?.id) return null;
    const ext = receiptFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${info.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("public-receipts")
      .upload(filePath, receiptFile);

    if (error) {
      console.error("Receipt upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("public-receipts")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      toast.error("Tu nombre es requerido");
      return;
    }
    if (!clientPhone.trim()) {
      toast.error("Tu telefono es requerido");
      return;
    }
    if (!selectedService || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    try {
      // Upload receipt if exists
      const receiptUrl = receiptFile ? await uploadReceipt() : null;

      const startTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

      const { data, error } = await supabase.rpc("public_create_booking", {
        p_slug: slug!,
        p_client_name: clientName.trim(),
        p_client_phone: clientPhone.trim(),
        p_client_email: clientEmail.trim(),
        p_service_id: selectedService.id,
        p_start_time: startTime,
        p_receipt_url: receiptUrl,
      });

      if (error) {
        if (error.message.includes("Horario no disponible")) {
          toast.error("Ese horario ya fue reservado. Elige otro.");
        } else {
          toast.error("Error al reservar. Intenta de nuevo.");
        }
        return;
      }

      setBookingResult(data as typeof bookingResult);
      setStep(4);
    } catch {
      toast.error("Error de conexion. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available time slots
  const dayName = selectedDate ? DAY_NAMES[new Date(selectedDate + "T12:00:00").getDay()] : null;
  const dayHours = dayName && info?.business_hours ? info.business_hours[dayName] : null;
  const isDayClosed = !dayHours?.enabled;

  const timeSlots =
    dayHours?.enabled && selectedService && selectedDate && bookedSlots
      ? generateTimeSlots(dayHours.open, dayHours.close, selectedService.duration, bookedSlots, selectedDate)
      : [];

  // Date limits
  const minDate = new Date().toISOString().split("T")[0];
  const maxDate = addDays(new Date(), 30).toISOString().split("T")[0];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Not found
  if (!info) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <h1 className="text-xl font-bold text-gray-800">Negocio no encontrado</h1>
          <p className="text-gray-500 mt-2">El link de reserva no es valido o el negocio no esta activo.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          {info.logo_url && (
            <img src={info.logo_url} alt={info.name} className="h-10 w-10 rounded-lg object-cover" />
          )}
          <div>
            <h1 className="font-bold text-lg text-gray-900">{info.name}</h1>
            <p className="text-xs text-gray-500">Reserva tu cita online</p>
          </div>
        </div>
      </div>

      {/* Steps indicator */}
      {step < 4 && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    s === step
                      ? "bg-blue-600 text-white"
                      : s < step
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s < step ? "\u2713" : s}
                </div>
                {s < 3 && <div className={`h-0.5 w-8 ${s < step ? "bg-primary" : "bg-gray-200"}`} />}
              </div>
            ))}
            <span className="ml-2 text-xs">
              {step === 1 ? "Servicio" : step === 2 ? "Fecha y hora" : "Tus datos"}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-800">Elige un servicio</h2>
            {info.services.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay servicios disponibles.</p>
            ) : (
              info.services.map((svc) => (
                <Card
                  key={svc.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedService?.id === svc.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => {
                    setSelectedService(svc);
                    setSelectedDate("");
                    setSelectedTime("");
                    setStep(2);
                  }}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-gray-900">{svc.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {svc.duration} min
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-blue-600">Q{Number(svc.price).toFixed(2)}</span>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && selectedService && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Cambiar servicio
            </button>

            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <span className="font-medium">{selectedService.name}</span>
              <span className="text-gray-500 ml-2">({selectedService.duration} min - Q{Number(selectedService.price).toFixed(2)})</span>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Elige una fecha
              </Label>
              <Input
                type="date"
                min={minDate}
                max={maxDate}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime("");
                }}
              />
            </div>

            {selectedDate && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Elige una hora
                </Label>
                {isDayClosed ? (
                  <p className="text-amber-600 text-sm bg-amber-50 rounded-lg p-3">
                    El negocio esta cerrado este dia. Elige otra fecha.
                  </p>
                ) : timeSlots.length === 0 ? (
                  <p className="text-amber-600 text-sm bg-amber-50 rounded-lg p-3">
                    No hay horarios disponibles este dia. Elige otra fecha.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          selectedTime === time
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTime && (
              <Button className="w-full mt-4" onClick={() => setStep(3)}>
                Continuar
              </Button>
            )}
          </div>
        )}

        {/* Step 3: Client Info + Receipt */}
        {step === 3 && selectedService && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Cambiar fecha/hora
            </button>

            <div className="bg-blue-50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium">{selectedService.name}</p>
              <p className="text-gray-600">
                {selectedDate && format(new Date(selectedDate + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })} a las {selectedTime}
              </p>
              <p className="text-blue-600 font-bold">Q{Number(selectedService.price).toFixed(2)}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Tus datos</h3>

              <div className="space-y-2">
                <Label htmlFor="client-name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre completo *
                </Label>
                <Input
                  id="client-name"
                  placeholder="Ej: Maria Lopez"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefono / WhatsApp *
                </Label>
                <Input
                  id="client-phone"
                  type="tel"
                  placeholder="Ej: 5555 1234"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email (opcional)
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Receipt upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Comprobante de pago (opcional)
              </Label>
              <p className="text-xs text-gray-500">
                Si ya realizaste el pago, sube una foto del comprobante.
              </p>

              {receiptPreview ? (
                <div className="relative">
                  <img
                    src={receiptPreview}
                    alt="Comprobante"
                    className="w-full max-h-48 object-contain rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setReceiptFile(null);
                      setReceiptPreview(null);
                    }}
                  >
                    Quitar
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Toca para subir foto</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP. Max 5MB</p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <Button
              className="w-full gap-2 h-12 text-base"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Reservando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Confirmar Reserva
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && bookingResult && (
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

            {info?.phone && (
              <a
                href={`https://wa.me/${info.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
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
        )}
      </div>
    </div>
  );
}
