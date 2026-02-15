import { ReactNode, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, DollarSign, LogOut, Menu, X, Shield, ArrowLeft } from "lucide-react";
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
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success("Sesion cerrada");
    navigate("/auth");
  };

  const getInitials = (email: string): string => {
    const name = email.split("@")[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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
          "fixed left-0 top-0 z-40 h-screen h-[100dvh] w-64 bg-white dark:bg-neutral-950 border-r border-black/[0.06] dark:border-white/10 transition-transform duration-300 lg:translate-x-0 pb-[env(safe-area-inset-bottom)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center gap-3 border-b border-black/[0.06] dark:border-white/10 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-600/15">
              <Shield className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">Super Admin</h1>
              <p className="text-[11px] text-muted-foreground">Control de plataforma</p>
            </div>
          </div>

          {/* Back to app */}
          <div className="px-4 pt-3">
            <NavLink
              to="/"
              className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-600 hover:bg-black/[0.04] transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver a la app
            </NavLink>
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
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-red-50 dark:bg-red-600/15 text-red-600 dark:text-red-300 shadow-sm"
                      : "text-neutral-700 hover:bg-black/[0.04] hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-red-500 dark:text-red-400" : "text-neutral-500")} />
                  <span>{item.title}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-black/[0.06] dark:border-white/10 p-3">
            {user && (
              <div className="flex items-center gap-3 rounded-xl bg-black/[0.03] dark:bg-white/5 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-600/15 text-red-500 dark:text-red-400 text-xs font-semibold">
                  {getInitials(user.email ?? "")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.email?.split("@")[0]}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Super Admin
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="shrink-0 rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-black/[0.04] transition-colors"
                  title="Cerrar sesion"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-3 px-6">
              <Shield className="h-4 w-4 text-red-500/70" />
              <h2 className="text-sm font-medium text-muted-foreground">Super Admin</h2>
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
