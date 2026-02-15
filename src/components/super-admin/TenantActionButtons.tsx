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
} from "lucide-react";

interface TenantActionButtonsProps {
  tenant: {
    id: string;
    name: string;
    subscription_status: string;
  };
  onActivatePlan: (planType: string) => void;
  isActivating: boolean;
  onExtendTrial: (days: number) => void;
  isExtending: boolean;
  onSuspend: () => void;
  isSuspending: boolean;
  onImpersonate: () => void;
}

export function TenantActionButtons({
  tenant,
  onActivatePlan,
  isActivating,
  onExtendTrial,
  isExtending,
  onSuspend,
  isSuspending,
  onImpersonate,
}: TenantActionButtonsProps) {
  const [activateOpen, setActivateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendDays, setExtendDays] = useState<string>("7");

  const handleActivatePlan = () => {
    onActivatePlan(selectedPlan);
    setActivateOpen(false);
  };

  const handleExtendTrial = () => {
    onExtendTrial(parseInt(extendDays));
    setExtendOpen(false);
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

      {/* Suspend */}
      {tenant.subscription_status === "active" && (
        <Button
          variant="outline"
          onClick={onSuspend}
          disabled={isSuspending}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Suspender
        </Button>
      )}

      {/* Impersonate */}
      <Button onClick={onImpersonate}>
        <Eye className="h-4 w-4 mr-2" />
        Impersonar
      </Button>
    </div>
  );
}
