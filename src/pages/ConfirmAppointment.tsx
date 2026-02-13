import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Clock,
  User,
  Building2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AppointmentData {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  confirmed_at: string | null;
  client_name: string;
  service_names: string;
  specialist_name: string | null;
  tenant_name: string;
  tenant_logo: string | null;
  tenant_phone: string | null;
}

type ResponseStatus = 'idle' | 'confirming' | 'cancelling' | 'confirmed' | 'cancelled';

export default function ConfirmAppointment() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<ResponseStatus>('idle');

  useEffect(() => {
    if (!token) {
      setError("Token invalido o no proporcionado");
      setLoading(false);
      return;
    }

    async function fetchAppointment() {
      try {
        const { data, error: rpcError } = await supabase.rpc('public_get_appointment_by_token', {
          p_token: token!,
        });

        if (rpcError) {
          console.error("RPC error:", rpcError);
          setError("No se pudo cargar la cita. El link puede ser invalido o la cita ya paso.");
          return;
        }

        if (!data) {
          setError("Cita no encontrada");
          return;
        }

        setAppointment(data as AppointmentData);

        // Check if already responded
        if (data.status === 'confirmed') {
          setResponseStatus('confirmed');
        } else if (data.status === 'cancelled') {
          setResponseStatus('cancelled');
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
        setError("Error de conexion. Verifica tu internet.");
      } finally {
        setLoading(false);
      }
    }

    fetchAppointment();
  }, [token]);

  const handleResponse = async (response: 'confirm' | 'cancel') => {
    if (!token || !appointment) return;

    setResponseStatus(response === 'confirm' ? 'confirming' : 'cancelling');

    try {
      const { data, error: rpcError } = await supabase.rpc('public_respond_appointment', {
        p_token: token,
        p_response: response,
      });

      if (rpcError) {
        console.error("Response error:", rpcError);
        setError("Error al procesar tu respuesta. Intenta de nuevo.");
        setResponseStatus('idle');
        return;
      }

      // Handle already_responded case
      if (data && 'already_responded' in data && data.already_responded) {
        setError(`Ya respondiste esta cita anteriormente (${data.status})`);
        setResponseStatus(data.status === 'confirmed' ? 'confirmed' : 'cancelled');
        return;
      }

      // Success
      if (data && 'success' in data && data.success) {
        setResponseStatus(data.new_status === 'confirmed' ? 'confirmed' : 'cancelled');
        // Update local appointment status
        setAppointment(prev => prev ? { ...prev, status: data.new_status } : null);
      }
    } catch (err) {
      console.error("Error responding to appointment:", err);
      setError("Error de conexion. Intenta de nuevo.");
      setResponseStatus('idle');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Oops...</h2>
              <p className="text-gray-600 mt-2">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Cita no encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state: Confirmed
  if (responseStatus === 'confirmed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="relative">
              <div className="h-20 w-20 mx-auto rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <Sparkles className="h-6 w-6 text-green-500 absolute top-0 right-1/3 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tu cita esta confirmada</h2>
              <p className="text-gray-600 mt-2">
                Nos vemos el{" "}
                {format(new Date(appointment.start_time), "EEEE d 'de' MMMM", { locale: es })} a las{" "}
                {format(new Date(appointment.start_time), "HH:mm")}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-left space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Servicio:</span>{" "}
                <span className="font-medium text-gray-900">{appointment.service_names}</span>
              </p>
              {appointment.specialist_name && (
                <p>
                  <span className="text-gray-500">Especialista:</span>{" "}
                  <span className="font-medium text-gray-900">{appointment.specialist_name}</span>
                </p>
              )}
            </div>
            {appointment.tenant_phone && (
              <p className="text-xs text-gray-500">
                Si tienes alguna duda, llama al{" "}
                <a
                  href={`tel:${appointment.tenant_phone}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {appointment.tenant_phone}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state: Cancelled
  if (responseStatus === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="h-20 w-20 mx-auto rounded-full bg-orange-100 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cita cancelada</h2>
              <p className="text-gray-600 mt-2">
                Gracias por avisarnos. Tu cita ha sido cancelada.
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-sm text-gray-700">
              <p>
                Si quieres reagendar, contacta a{" "}
                <span className="font-medium">{appointment.tenant_name}</span>
                {appointment.tenant_phone && (
                  <>
                    {" "}al{" "}
                    <a
                      href={`tel:${appointment.tenant_phone}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {appointment.tenant_phone}
                    </a>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main state: Pending response
  const startDate = new Date(appointment.start_time);
  const endDate = new Date(appointment.end_time);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto py-6 space-y-6">
        {/* Business Logo & Name */}
        <div className="text-center space-y-3">
          {appointment.tenant_logo ? (
            <img
              src={appointment.tenant_logo}
              alt={appointment.tenant_name}
              className="h-20 w-20 mx-auto rounded-lg object-cover shadow-md"
            />
          ) : (
            <div className="h-20 w-20 mx-auto rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{appointment.tenant_name}</h1>
          <p className="text-gray-500 text-sm">Confirmacion de cita</p>
        </div>

        {/* Appointment Details Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-center text-lg">Detalles de tu cita</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Client */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Cliente</p>
                <p className="font-medium text-gray-900">{appointment.client_name}</p>
              </div>
            </div>

            {/* Service */}
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Servicio</p>
                <p className="font-medium text-gray-900">{appointment.service_names}</p>
              </div>
            </div>

            {/* Specialist */}
            {appointment.specialist_name && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Especialista</p>
                  <p className="font-medium text-gray-900">{appointment.specialist_name}</p>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha</p>
                <p className="font-medium text-gray-900 capitalize">
                  {format(startDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Hora</p>
                <p className="font-medium text-gray-900">
                  {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="pt-2 flex justify-center">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                Pendiente de confirmacion
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all transform active:scale-95"
            onClick={() => handleResponse('confirm')}
            disabled={responseStatus === 'confirming' || responseStatus === 'cancelling'}
          >
            {responseStatus === 'confirming' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Confirmo mi cita
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full h-14 text-lg font-semibold border-2 border-red-300 text-red-600 hover:bg-red-50 shadow-md transition-all transform active:scale-95"
            onClick={() => handleResponse('cancel')}
            disabled={responseStatus === 'confirming' || responseStatus === 'cancelling'}
          >
            {responseStatus === 'cancelling' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Cancelando...
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 mr-2" />
                No puedo ir
              </>
            )}
          </Button>
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-gray-500 mt-6">
          {appointment.tenant_phone && (
            <>
              ¿Necesitas ayuda?{" "}
              <a
                href={`tel:${appointment.tenant_phone}`}
                className="text-blue-600 hover:underline font-medium"
              >
                Llamanos al {appointment.tenant_phone}
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
