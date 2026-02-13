import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Scissors, Package, Menu, X, ShoppingCart, BarChart3, LogOut, UserCog, Gift, UserCheck, DoorOpen, Crown, Settings, TrendingDown } from "lucide-react";
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
    toast.success("Sesión cerrada");
    navigate("/auth");
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
      <aside className={cn("fixed left-0 top-0 z-40 h-screen w-64 bg-stone-900/90 dark:bg-stone-950/80 backdrop-blur-2xl border-r border-amber-900/20 transition-transform duration-300 lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-full flex-col">
          {/* Logo / Brand */}
          <div className="flex h-16 items-center gap-3 border-b border-amber-800/20 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Scissors className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-primary-foreground truncate">
                {tenant?.name ?? "Agenda PRO"}
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {filteredNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200", isActive ? "bg-amber-600/20 backdrop-blur-sm text-amber-100 shadow-sm" : "text-stone-300 hover:bg-white/10 hover:text-white")}>
                  <item.icon className={cn("h-5 w-5", isActive ? "text-amber-400" : "text-stone-400")} />
                  <span>{item.title}</span>
                  {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />}
                </NavLink>;
          })}
          </nav>

          {/* User & Logout */}
          <div className="border-t border-amber-800/20 p-4 space-y-3 mt-4">
            {isSuperAdmin && (
              <NavLink
                to="/super-admin"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium bg-red-900/50 text-red-200 hover:bg-red-900 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Crown className="h-4 w-4" />
                Super Admin Panel
              </NavLink>
            )}
            {user && <div className="px-3 py-2">
                <p className="text-xs text-white/60">Conectado como</p>
                <p className="text-sm font-medium text-white truncate">
                  {user.email}
                </p>
              </div>}
            <Button
              variant="destructive"
              className="w-full justify-start gap-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium mt-2"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>
    </>;
}