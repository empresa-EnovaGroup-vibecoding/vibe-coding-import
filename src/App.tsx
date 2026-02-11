import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider, useTenant } from "@/hooks/useTenant";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireSuperAdmin } from "@/components/auth/RequireSuperAdmin";
import { MainLayout } from "@/components/layout/MainLayout";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import Inventory from "./pages/Inventory";
import Appointments from "./pages/Appointments";
import POS from "./pages/POS";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/UserManagement";
import Packages from "./pages/Packages";
import Team from "./pages/Team";
import Cabins from "./pages/Cabins";
import Membership from "./pages/Membership";
import Admin from "./pages/Admin";
import Onboarding from "./pages/Onboarding";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SuperAdminTenants from "./pages/super-admin/SuperAdminTenants";
import SuperAdminRevenue from "./pages/super-admin/SuperAdminRevenue";

const queryClient = new QueryClient();

// Component to protect routes that require a tenant
const RequireTenant = ({ children }: { children: React.ReactNode }) => {
  const { hasTenant, loading } = useTenant();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasTenant) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />

              {/* Onboarding - requires auth but NOT tenant */}
              <Route
                path="/onboarding"
                element={
                  <RequireAuth>
                    <Onboarding />
                  </RequireAuth>
                }
              />

              {/* Super Admin Panel */}
              <Route
                path="/super-admin"
                element={
                  <RequireAuth>
                    <RequireSuperAdmin>
                      <SuperAdminLayout>
                        <SuperAdminDashboard />
                      </SuperAdminLayout>
                    </RequireSuperAdmin>
                  </RequireAuth>
                }
              />
              <Route
                path="/super-admin/tenants"
                element={
                  <RequireAuth>
                    <RequireSuperAdmin>
                      <SuperAdminLayout>
                        <SuperAdminTenants />
                      </SuperAdminLayout>
                    </RequireSuperAdmin>
                  </RequireAuth>
                }
              />
              <Route
                path="/super-admin/revenue"
                element={
                  <RequireAuth>
                    <RequireSuperAdmin>
                      <SuperAdminLayout>
                        <SuperAdminRevenue />
                      </SuperAdminLayout>
                    </RequireSuperAdmin>
                  </RequireAuth>
                }
              />

              {/* Business Panel - requires auth + tenant */}
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <Index />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/clients"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <Clients />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/services"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <Services />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/inventory"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <Inventory />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/appointments"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <Appointments />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/pos"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <POS />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/reports"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <Reports />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/users"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <UserManagement />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/packages"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <Packages />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/team"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <Team />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/cabins"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <Cabins />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/membership"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <MainLayout>
                        <Membership />
                      </MainLayout>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <Admin />
                    </RequireTenant>
                  </RequireAuth>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
