import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ImpersonationBanner() {
  const { isImpersonating, tenant, stopImpersonating } = useTenant();
  const navigate = useNavigate();

  if (!isImpersonating || !tenant) return null;

  const handleExit = () => {
    stopImpersonating();
    navigate("/super-admin");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm">
      <Eye className="h-4 w-4 shrink-0" />
      <span>
        Impersonando: <strong>{tenant.name}</strong>
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 bg-transparent border-white/50 text-white hover:bg-white/20 hover:text-white"
        onClick={handleExit}
      >
        <X className="h-3 w-3 mr-1" />
        Salir
      </Button>
    </div>
  );
}
