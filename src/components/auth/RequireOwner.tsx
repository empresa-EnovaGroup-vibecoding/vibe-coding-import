import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";

interface RequireOwnerProps {
  children: React.ReactNode;
}

export function RequireOwner({ children }: RequireOwnerProps) {
  const { isOwner, loading } = useTenant();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isOwner) {
      toast.error("No tienes permiso para acceder a esta pagina");
      navigate("/");
    }
  }, [isOwner, loading, navigate]);

  if (loading) {
    return null; // RequireAuth already shows loader
  }

  if (!isOwner) {
    return null;
  }

  return <>{children}</>;
}
