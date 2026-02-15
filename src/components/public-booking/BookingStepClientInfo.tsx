import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Phone,
  Mail,
  Upload,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BookingStepClientInfoProps {
  selectedService: { name: string; duration: number; price: number };
  selectedDate: string;
  selectedTime: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  receiptPreview: string | null;
  isSubmitting: boolean;
  onClientNameChange: (v: string) => void;
  onClientPhoneChange: (v: string) => void;
  onClientEmailChange: (v: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearReceipt: () => void;
  onSubmit: () => void;
  onBack: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function BookingStepClientInfo({
  selectedService,
  selectedDate,
  selectedTime,
  clientName,
  clientPhone,
  clientEmail,
  receiptPreview,
  isSubmitting,
  onClientNameChange,
  onClientPhoneChange,
  onClientEmailChange,
  onFileSelect,
  onClearReceipt,
  onSubmit,
  onBack,
  fileInputRef,
}: BookingStepClientInfoProps) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
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
            onChange={(e) => onClientNameChange(e.target.value)}
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
            onChange={(e) => onClientPhoneChange(e.target.value)}
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
            onChange={(e) => onClientEmailChange(e.target.value)}
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
              onClick={onClearReceipt}
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
          onChange={onFileSelect}
        />
      </div>

      <Button
        className="w-full gap-2 h-12 text-base"
        onClick={onSubmit}
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
  );
}
