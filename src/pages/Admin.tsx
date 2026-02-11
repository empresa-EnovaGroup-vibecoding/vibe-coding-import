import { Navigate } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";

// Admin page now redirects to super-admin panel or back to home
export default function Admin() {
  const { isSuperAdmin } = useTenant();

  if (isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }

  return <Navigate to="/" replace />;
}
