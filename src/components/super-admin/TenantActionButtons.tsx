import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Crown,
  CalendarPlus,
  XCircle,
  Eye,
  CheckCircle2,
  Loader2,
  Trash2,
  MessageCircle,
} from "lucide-react";

interface TenantActionButtonsProps {
  tenant: {
    id: string;
    name: string;
    subscription_status: string;
    phone?: string | null;
  };
  ownerEmail?: string | null;
  onActivatePlan: (planType: string) => void;
  isActivating: boolean;
  onExtendTrial: (days: number) => void;
  isExtending: boolean;
  onSuspend: () => void;
  isSuspending: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  onImpersonate: () => void;
}

export function TenantActionButtons({
  tenant,
  ownerEmail,
  onActivatePlan,
  isActivating,
  onExtendTrial,
  isExtending,
  onSuspend,
  isSuspending,
  onDelete,
  isDeleting,
  onImpersonate,
}: TenantActionButtonsProps) {
  const [activateOpen, setActivateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendDays, setExtendDays] = useState<string>("7");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleActivatePlan = () => {
    onActivatePlan(selectedPlan);
    setActivateOpen(false);
  };

  const handleExtendTrial = () => {
    onExtendTrial(parseInt(extendDays));
    setExtendOpen(false);
  };

  const handleSuspend = () => {
    onSuspend();
    setSuspendOpen(false);
  };

  const handleDelete = () => {
    onDelete();
    setDeleteOpen(false);
    setDeleteConfirmText("");
  };

  const handleWhatsApp = () => {
    const phone = tenant.phone?.replace(/\D/g, "");
    if (phone) {
      window.open(`https://wa.me/${phone}`, "_blank");
    } else if (ownerEmail) {
      // Fallback: search by email context
      window.open(`https://wa.me/?text=Hola, te contacto desde Agenda PRO respecto a tu negocio "${tenant.name}"`, "_blank");
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Activate Plan Dialog */}
      {tenant.subscription_status !== "active" && (
        <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Crown className="h-4 w-4 mr-2" />
              Activar Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activar Plan para {tenant.name}</DialogTitle>
              <DialogDescription>
                Selecciona el tipo de plan. La fecha de vencimiento se calcula automaticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual ($49/mes) - Vence en 1 mes</SelectItem>
                    <SelectItem value="annual">Anual ($399/ano) - Vence en 12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="text-sm">
                  <strong>Resumen:</strong> Plan {selectedPlan === "annual" ? "Anual" : "Mensual"},
                  vence en {selectedPlan === "annual" ? "12 meses" : "1 mes"} desde hoy.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActivateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleActivatePlan}
                disabled={isActivating}
              >
                {isActivating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Confirmar Activacion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Extend Trial Dialog */}
      {(tenant.subscription_status === "trial" || tenant.subscription_status === "expired") && (
        <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <CalendarPlus className="h-4 w-4 mr-2" />
              Extender Trial
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extender Trial de {tenant.name}</DialogTitle>
              <DialogDescription>
                Agrega dias adicionales al periodo de prueba.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Dias a agregar</Label>
                <Select value={extendDays} onValueChange={setExtendDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="14">14 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExtendOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleExtendTrial}
                disabled={isExtending}
              >
                {isExtending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CalendarPlus className="h-4 w-4 mr-2" />
                )}
                Extender Trial
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Suspend Dialog (with confirmation) */}
      {tenant.subscription_status === "active" && (
        <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <XCircle className="h-4 w-4 mr-2" />
              Suspender
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspender {tenant.name}?</DialogTitle>
              <DialogDescription>
                El negocio perdera acceso a la plataforma. Podras reactivarlo despues.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 my-2">
              <p className="text-sm text-destructive font-medium">
                El dueno y sus empleados no podran usar la app hasta que reactives el plan.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuspendOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleSuspend}
                disabled={isSuspending}
              >
                {isSuspending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Si, Suspender
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog (with double confirmation) */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteConfirmText(""); }}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar {tenant.name} permanentemente?</DialogTitle>
            <DialogDescription>
              Esta accion NO se puede deshacer. Se eliminara el negocio y todos sus datos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive font-medium">
                Se eliminara: clientes, citas, servicios, inventario, ventas, equipo, cabinas y paquetes de este negocio.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Escribe <strong>{tenant.name}</strong> para confirmar:</Label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={tenant.name}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirmText(""); }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || deleteConfirmText !== tenant.name}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Contact */}
      <Button variant="outline" onClick={handleWhatsApp}>
        <MessageCircle className="h-4 w-4 mr-2" />
        WhatsApp
      </Button>

      {/* Impersonate */}
      <Button onClick={onImpersonate}>
        <Eye className="h-4 w-4 mr-2" />
        Impersonar
      </Button>
    </div>
  );
}
