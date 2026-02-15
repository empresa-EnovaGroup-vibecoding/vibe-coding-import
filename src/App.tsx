import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider, useTenant } from "@/hooks/useTenant";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireSuperAdmin } from "@/components/auth/RequireSuperAdmin";
import { RequireOwner } from "@/components/auth/RequireOwner";
import { RequireSubscription } from "@/components/auth/RequireSubscription";
import { MainLayout } from "@/components/layout/MainLayout";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { Loader2 } from "lucide-react";
import { ReloadPrompt } from "@/components/pwa/ReloadPrompt";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";

// Paginas criticas (carga inmediata)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Paginas lazy (se cargan cuando el usuario las visita)
const Clients = lazy(() => import("./pages/Clients"));
const Services = lazy(() => import("./pages/Services"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Appointments = lazy(() => import("./pages/Appointments"));
const POS = lazy(() => import("./pages/POS"));
const Reports = lazy(() => import("./pages/Reports"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Packages = lazy(() => import("./pages/Packages"));
const Team = lazy(() => import("./pages/Team"));
const Cabins = lazy(() => import("./pages/Cabins"));
const Membership = lazy(() => import("./pages/Membership"));
const Admin = lazy(() => import("./pages/Admin"));
const Settings = lazy(() => import("./pages/Settings"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const PublicBooking = lazy(() => import("./pages/PublicBooking"));
const ConfirmAppointment = lazy(() => import("./pages/ConfirmAppointment"));
const SuperAdminDashboard = lazy(() => import("./pages/super-admin/SuperAdminDashboard").then(m => ({ default: m.SuperAdminDashboard })));
const SuperAdminTenants = lazy(() => import("./pages/super-admin/SuperAdminTenants").then(m => ({ default: m.SuperAdminTenants })));
const SuperAdminRevenue = lazy(() => import("./pages/super-admin/SuperAdminRevenue").then(m => ({ default: m.SuperAdminRevenue })));
const SuperAdminTenantDetail = lazy(() => import("./pages/super-admin/SuperAdminTenantDetail").then(m => ({ default: m.SuperAdminTenantDetail })));
const SuperAdminUsers = lazy(() => import("./pages/super-admin/SuperAdminUsers").then(m => ({ default: m.SuperAdminUsers })));
const SuperAdminActivity = lazy(() => import("./pages/super-admin/SuperAdminActivity").then(m => ({ default: m.SuperAdminActivity })));
const SuperAdminSettings = lazy(() => import("./pages/super-admin/SuperAdminSettings").then(m => ({ default: m.SuperAdminSettings })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/invite/:token" element={<AcceptInvite />} />
              <Route path="/book/:slug" element={<PublicBooking />} />
              <Route path="/confirm/:token" element={<ConfirmAppointment />} />

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
                path="/super-admin/tenants/:tenantId"
                element={
                  <RequireAuth>
                    <RequireSuperAdmin>
                      <SuperAdminLayout>
                        <SuperAdminTenantDetail />
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
              <Route
                path="/super-admin/users"
                element={
                  <RequireAuth>
                    <RequireSuperAdmin>
                      <SuperAdminLayout>
                        <SuperAdminUsers />
                      </SuperAdminLayout>
                    </RequireSuperAdmin>
                  </RequireAuth>
                }
              />
              <Route
                path="/super-admin/activity"
                element={
                  <RequireAuth>
                    <RequireSuperAdmin>
                      <SuperAdminLayout>
                        <SuperAdminActivity />
                      </SuperAdminLayout>
                    </RequireSuperAdmin>
                  </RequireAuth>
                }
              />
              <Route
                path="/super-admin/settings"
                element={
                  <RequireAuth>
                    <RequireSuperAdmin>
                      <SuperAdminLayout>
                        <SuperAdminSettings />
                      </SuperAdminLayout>
                    </RequireSuperAdmin>
                  </RequireAuth>
                }
              />

              {/* Business Panel - requires auth + tenant + active subscription */}
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <MainLayout>
                          <Index />
                        </MainLayout>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/clients"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <MainLayout>
                          <Clients />
                        </MainLayout>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/services"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <MainLayout>
                          <Services />
                        </MainLayout>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/inventory"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <MainLayout>
                          <Inventory />
                        </MainLayout>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/appointments"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <MainLayout>
                          <Appointments />
                        </MainLayout>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/pos"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <MainLayout>
                          <POS />
                        </MainLayout>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/reports"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <MainLayout>
                          <Reports />
                        </MainLayout>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/expenses"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <MainLayout>
                          <Expenses />
                        </MainLayout>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/users"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <RequireOwner>
                          <MainLayout>
                            <UserManagement />
                          </MainLayout>
                        </RequireOwner>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/packages"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <RequireOwner>
                          <MainLayout>
                            <Packages />
                          </MainLayout>
                        </RequireOwner>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/team"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <RequireOwner>
                          <MainLayout>
                            <Team />
                          </MainLayout>
                        </RequireOwner>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />
              <Route
                path="/cabins"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <RequireOwner>
                          <MainLayout>
                            <Cabins />
                          </MainLayout>
                        </RequireOwner>
                      </RequireSubscription>
                    </RequireTenant>
                  </RequireAuth>
                }
              />

              {/* Membership - NO RequireSubscription (must be accessible to pay) */}
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
                path="/settings"
                element={
                  <RequireAuth>
                    <RequireTenant>
                      <RequireSubscription>
                        <RequireOwner>
                          <MainLayout>
                            <Settings />
                          </MainLayout>
                        </RequireOwner>
                      </RequireSubscription>
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
            </Suspense>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    <ReloadPrompt />
    <PWAInstallPrompt />
  </QueryClientProvider>
);

export default App;
