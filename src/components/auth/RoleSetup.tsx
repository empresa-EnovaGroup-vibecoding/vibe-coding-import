import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RoleSetup() {
  const { user } = useAuth();
  const { hasRole, loading: roleLoading, refetch } = useUserRole();
  const navigate = useNavigate();
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [checkingFirstUser, setCheckingFirstUser] = useState(true);

  useEffect(() => {
    if (!user) return;

    const checkIfFirstUser = async () => {
      try {
        // Use secure SECURITY DEFINER function that bypasses RLS
        // This correctly checks ALL admin roles, not just the current user's
        const { data, error } = await supabase.rpc("check_admin_exists");

        if (error) {
          console.error("Error checking admin status:", error);
          setIsFirstUser(false);
        } else {
          // If no admin exists, this is the first user
          setIsFirstUser(data === false);
        }
      } catch (err) {
        console.error("Error:", err);
        setIsFirstUser(false);
      } finally {
        setCheckingFirstUser(false);
      }
    };

    checkIfFirstUser();
  }, [user]);

  useEffect(() => {
    // If user already has a role, redirect to home
    if (!roleLoading && hasRole) {
      navigate("/");
    }
  }, [hasRole, roleLoading, navigate]);

  const assignRole = async (role: "admin" | "staff") => {
    if (!user) return;

    setIsAssigning(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role });

      if (error) {
        // If insert fails because no admin exists yet, this is the first user
        if (error.code === "42501" && role === "admin" && isFirstUser) {
          // Use RPC to insert first admin (needs a special function)
          const { error: rpcError } = await supabase.rpc("assign_first_admin", {
            _user_id: user.id,
          });

          if (rpcError) {
            throw rpcError;
          }
        } else {
          throw error;
        }
      }

      toast.success(
        role === "admin"
          ? "¡Configurado como Administrador!"
          : "¡Configurado como Staff!"
      );
      await refetch();
      navigate("/");
    } catch (err: any) {
      console.error("Error assigning role:", err);
      toast.error(err.message || "Error al asignar rol");
    } finally {
      setIsAssigning(false);
    }
  };

  if (roleLoading || checkingFirstUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando rol...</p>
        </div>
      </div>
    );
  }

  if (hasRole) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Configuración de Rol</CardTitle>
          <CardDescription>
            {isFirstUser
              ? "Eres el primer usuario. Serás configurado como Administrador."
              : "Un administrador debe asignarte un rol para continuar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFirstUser ? (
            <Button
              onClick={() => assignRole("admin")}
              className="w-full h-16 text-lg"
              disabled={isAssigning}
            >
              {isAssigning ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Shield className="mr-2 h-5 w-5" />
              )}
              Configurar como Administrador
            </Button>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Users className="h-16 w-16 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Contacta a un administrador para que te asigne un rol.
              </p>
              <Button variant="outline" onClick={() => navigate("/auth")}>
                Volver al inicio de sesión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
