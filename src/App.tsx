import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { RoleSetup } from "@/components/auth/RoleSetup";
import Index from "./pages/Index";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import Inventory from "./pages/Inventory";
import Appointments from "./pages/Appointments";
import POS from "./pages/POS";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/role-setup" element={<RoleSetup />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Index />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/clients"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Clients />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/services"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Services />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/inventory"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Inventory />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/appointments"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Appointments />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/pos"
              element={
                <RequireAuth>
                  <MainLayout>
                    <POS />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route
              path="/reports"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Reports />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
