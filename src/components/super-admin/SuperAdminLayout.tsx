import { ReactNode, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, DollarSign, LogOut, Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    title: "Dashboard",
    path: "/super-admin",
    icon: LayoutDashboard,
  },
  {
    title: "Negocios",
    path: "/super-admin/tenants",
    icon: Building2,
  },
  {
    title: "Ingresos",
    path: "/super-admin/revenue",
    icon: DollarSign,
  },
];

/**
 * Layout para el panel de Super Admin.
 *
 * Características:
 * - Sidebar rojo oscuro (identifica visualmente el modo super-admin)
 * - Navegación dedicada para gestión de la plataforma
 * - Header con título distintivo
 * - Logout para salir del modo super-admin
 */
export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success("Sesión cerrada");
    navigate("/auth");
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-card shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-red-950 dark:bg-red-950 transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo / Brand */}
          <div className="flex h-16 items-center gap-3 border-b border-red-900 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-800">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Super Admin Panel</h1>
              <p className="text-xs text-red-200">Control total de la plataforma</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-red-800 text-white"
                      : "text-red-100 hover:bg-red-900/50 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-red-900 p-4">
            <Button
              variant="destructive"
              className="w-full justify-start gap-3 bg-red-800 hover:bg-red-700 text-white font-medium"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </Button>
            <p className="text-xs text-red-200 text-center mt-3">
              Modo Super Administrador
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold">Super Admin Panel</h2>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
