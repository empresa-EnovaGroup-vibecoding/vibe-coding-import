import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Copy, Check, Link, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InviteDialogProps {
  onInviteCreated: () => void;
}

export function InviteDialog({ onInviteCreated }: InviteDialogProps) {
  const { tenantId, tenant } = useTenant();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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
          role: "staff",
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
      console.error("Error creating invite:", error);
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
    }
  };

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
                Este link expira en 7 dias. El usuario entrara como Staff.
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
