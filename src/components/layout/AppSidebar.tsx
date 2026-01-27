import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Calendar, Scissors, Package, Menu, X, ShoppingCart, BarChart3, LogOut, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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
  title: "Reportes",
  path: "/reports",
  icon: BarChart3,
  adminOnly: false
}, {
  title: "Usuarios",
  path: "/users",
  icon: UserCog,
  adminOnly: true
}];
export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    signOut,
    user
  } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await signOut();
    toast.success("Sesión cerrada");
    navigate("/auth");
  };

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return <>
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 lg:hidden bg-card shadow-md" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn("fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar transition-transform duration-300 lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-full flex-col">
          {/* Logo / Brand */}
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Scissors className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-primary-foreground">Agenda PRO</h1>
              <p className="text-xs text-sidebar-foreground/60">Sistema de gestión</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {filteredNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-success-foreground font-mono text-center bg-sidebar-primary", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
                  <item.icon className={cn("h-5 w-5", isActive && "text-sidebar-primary")} />
                  <span>{item.title}</span>
                  {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
                </NavLink>;
          })}
          </nav>

          {/* User & Logout */}
          <div className="border-t border-sidebar-border p-4 space-y-3">
            {user && <div className="px-3 py-2">
                <p className="text-xs text-sidebar-foreground/50">Conectado como</p>
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.email}
                </p>
              </div>}
            <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </Button>
            <p className="text-xs text-sidebar-foreground/50 text-center">
              © 2024 GestorPro
            </p>
          </div>
        </div>
      </aside>
    </>;
}