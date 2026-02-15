import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2, AlertCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface InviteInfo {
  tenant_name: string;
  tenant_slug: string;
  role: string;
  expires_at: string;
  status: string;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { refetch } = useTenant();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  // Signup form
  const [isSignup, setIsSignup] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // Fetch invite info
  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) {
        setError("Link de invitacion invalido");
        setLoadingInfo(false);
        return;
      }

      const { data, error: rpcError } = await supabase
        .rpc("get_invite_info", { _token: token });

      if (rpcError || !data || data.length === 0) {
        setError("Invitacion no encontrada");
        setLoadingInfo(false);
        return;
      }

      const info = data[0] as InviteInfo;

      if (info.status !== "pending") {
        setError("Esta invitacion ya fue utilizada");
        setLoadingInfo(false);
        return;
      }

      if (new Date(info.expires_at) < new Date()) {
        setError("Esta invitacion ha expirado");
        setLoadingInfo(false);
        return;
      }

      setInviteInfo(info);
      setLoadingInfo(false);
    };

    fetchInvite();
  }, [token]);

  const acceptInvite = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      const { error: rpcError } = await supabase
        .rpc("accept_invite", { _token: token });

      if (rpcError) {
        if (rpcError.message.includes("Ya eres miembro")) {
          toast.error("Ya eres miembro de este negocio");
        } else {
          toast.error(rpcError.message);
        }
        return;
      }

      toast.success(`Te uniste a ${inviteInfo?.tenant_name}`);
      await refetch();
      navigate("/");
    } catch (err) {
      void err;
      toast.error("Error al aceptar la invitacion");
    } finally {
      setAccepting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("El email es requerido");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    setAccepting(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName },
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      // After signup, accept the invite
      // Small delay to let session establish
      await new Promise((r) => setTimeout(r, 500));
      await acceptInvite();
    } catch (err) {
      void err;
      toast.error("Error al crear la cuenta");
    } finally {
      setAccepting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error("Email y contrasena son requeridos");
      return;
    }

    setAccepting(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        toast.error(loginError.message);
        setAccepting(false);
        return;
      }

      await new Promise((r) => setTimeout(r, 500));
      await acceptInvite();
    } catch (err) {
      void err;
      toast.error("Error al iniciar sesion");
      setAccepting(false);
    }
  };

  // Loading
  if (loadingInfo || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-lg font-medium">{error}</p>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User already logged in - just accept
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
                <Building2 className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">{inviteInfo?.tenant_name}</CardTitle>
              <CardDescription>
                Te han invitado a unirte como {inviteInfo?.role === "staff" ? "usuario" : inviteInfo?.role}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Estas conectado como <strong>{user.email}</strong>
            </p>
            <Button
              onClick={acceptInvite}
              disabled={accepting}
              className="w-full h-12 text-base"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uniendose...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Unirme al negocio
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in - show signup/login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">{inviteInfo?.tenant_name}</CardTitle>
            <CardDescription>
              Te han invitado a unirte como {inviteInfo?.role === "staff" ? "usuario" : inviteInfo?.role}.
              {isSignup ? " Crea tu cuenta para continuar." : " Inicia sesion para continuar."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena *</Label>
              <Input
                id="password"
                type="password"
                placeholder={isSignup ? "Minimo 6 caracteres" : "Tu contrasena"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              disabled={accepting}
              className="w-full h-12 text-base"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isSignup ? "Creando cuenta..." : "Iniciando sesion..."}
                </>
              ) : (
                isSignup ? "Crear cuenta y unirme" : "Iniciar sesion y unirme"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isSignup ? "Ya tienes cuenta?" : "No tienes cuenta?"}{" "}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => setIsSignup(!isSignup)}
              >
                {isSignup ? "Inicia sesion" : "Crear cuenta"}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
