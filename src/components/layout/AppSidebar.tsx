import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Scissors, Package, Menu, X, ShoppingCart, BarChart3, LogOut, UserCog, Gift, UserCheck, DoorOpen, Crown, Settings, TrendingDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { toast } from "sonner";

const navItems = [{
  title: "Dashboard",
  path: "/",
  icon: LayoutDashboard,
  adminOnly: false
}, {
  title: "Clientes",
  path: "/clients",
  icon: Users,
  adminOnly: false
}, {
  title: "Agenda",
  path: "/appointments",
  icon: Calendar,
  adminOnly: false
}, {
  title: "Servicios",
  path: "/services",
  icon: Scissors,
  adminOnly: false
}, {
  title: "Inventario",
  path: "/inventory",
  icon: Package,
  adminOnly: false
}, {
  title: "Punto de Venta",
  path: "/pos",
  icon: ShoppingCart,
  adminOnly: false
}, {
  title: "Paquetes",
  path: "/packages",
  icon: Gift,
  adminOnly: true
}, {
  title: "Equipo",
  path: "/team",
  icon: UserCheck,
  adminOnly: true
}, {
  title: "Cabinas",
  path: "/cabins",
  icon: DoorOpen,
  adminOnly: true
}, {
  title: "Reportes",
  path: "/reports",
  icon: BarChart3,
  adminOnly: false
}, {
  title: "Gastos",
  path: "/expenses",
  icon: TrendingDown,
  adminOnly: true
}, {
  title: "Usuarios",
  path: "/users",
  icon: UserCog,
  adminOnly: true
}, {
  title: "Configuracion",
  path: "/settings",
  icon: Settings,
  adminOnly: true
}, {
  title: "Membresia Pro",
  path: "/membership",
  icon: Crown,
  adminOnly: false
}];
export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    signOut,
    user
  } = useAuth();
  const { isOwner, isSuperAdmin, tenant } = useTenant();
  const navigate = useNavigate();

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

  // Filter nav items: owners see everything, staff sees non-admin items
  const filteredNavItems = navItems.filter(item => !item.adminOnly || isOwner);

  return <>
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 lg:hidden bg-card shadow-md" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn("fixed left-0 top-0 z-40 h-screen w-64 bg-white dark:bg-neutral-950 border-r border-black/[0.06] dark:border-white/10 transition-transform duration-300 lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-full flex-col">
          {/* Logo / Brand */}
          <div className="flex h-16 items-center gap-3 border-b border-black/[0.06] dark:border-white/10 px-6">
            {tenant?.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
                <Scissors className="h-5 w-5 text-sidebar-primary-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {tenant?.name ?? "Agenda PRO"}
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {filteredNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200", isActive ? "bg-primary/10 text-primary shadow-sm" : "text-neutral-700 hover:bg-black/[0.04] hover:text-foreground")}>
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-neutral-500")} />
                  <span>{item.title}</span>
                  {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </NavLink>;
          })}
          </nav>

          {/* User section */}
          <div className="border-t border-black/[0.06] dark:border-white/10 p-3">
            {isSuperAdmin && (
              <NavLink
                to="/super-admin"
                className="flex items-center gap-2 rounded-xl px-3 py-1.5 mb-2 text-[11px] font-medium text-primary/70 hover:bg-primary/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </NavLink>
            )}
            {user && (
              <div className="flex items-center gap-3 rounded-xl bg-black/[0.03] dark:bg-white/5 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(user.email ?? "")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.email?.split("@")[0]}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.email}
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
    </>;
}