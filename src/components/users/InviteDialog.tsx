import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Copy, Check, Link, Loader2, Shield, Users } from "lucide-react";
import { toast } from "sonner";

interface InviteDialogProps {
  onInviteCreated: () => void;
}

const ROLES = [
  {
    value: "admin",
    label: "Administrador",
    description: "CRUD completo, inventario, reportes",
    icon: Shield,
  },
  {
    value: "staff",
    label: "Miembro",
    description: "Citas, ventas, lectura de inventario",
    icon: Users,
  },
] as const;

type InviteRole = (typeof ROLES)[number]["value"];

export function InviteDialog({ onInviteCreated }: InviteDialogProps) {
  const { tenantId, tenant } = useTenant();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<InviteRole>("staff");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInvite = async () => {
    if (!tenantId || !user) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("tenant_invites")
        .insert({
          tenant_id: tenantId,
          role: selectedRole,
          invited_by: user.id,
        } as Record<string, unknown>)
        .select("token")
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
      onInviteCreated();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al crear invitacion";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setInviteLink(null);
      setCopied(false);
      setSelectedRole("staff");
    }
  };

  const selectedRoleLabel = ROLES.find((r) => r.value === selectedRole)?.label ?? "Miembro";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
          <DialogDescription>
            Genera un link de invitacion y compartelo por WhatsApp u otro medio.
            El usuario creara su cuenta y quedara conectado a "{tenant?.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!inviteLink ? (
            <>
              {/* Role selector */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Rol del usuario</p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                        selectedRole === role.value
                          ? "border-primary bg-primary/5"
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <role.icon className={`h-5 w-5 ${selectedRole === role.value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${selectedRole === role.value ? "text-primary" : ""}`}>
                        {role.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-tight">
                        {role.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateInvite}
                disabled={creating}
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Generar link de invitacion
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Este link expira en 7 dias. El usuario entrara como {selectedRoleLabel}.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setInviteLink(null)}
              >
                Generar otro link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
