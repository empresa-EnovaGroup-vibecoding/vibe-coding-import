import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";

interface RequireSuperAdminProps {
  children: ReactNode;
}

/**
 * Guard component que protege rutas exclusivas del super-admin.
 *
 * Comportamiento:
 * - Muestra spinner mientras carga
 * - Redirige a "/" si el usuario NO es super_admin
 * - Renderiza children solo si ES super_admin
 */
export function RequireSuperAdmin({ children }: RequireSuperAdminProps) {
  const { isSuperAdmin, loading } = useTenant();

  // Mostrar spinner durante la carga inicial
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Redirigir si NO es super admin
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // Renderizar contenido protegido
  return <>{children}</>;
}
