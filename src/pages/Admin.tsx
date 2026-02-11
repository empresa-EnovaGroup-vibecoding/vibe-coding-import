import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Copy, Crown, ArrowLeft } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  subscription_status: string;
  trial_ends_at: string;
  email?: string;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user || !isAdmin) {
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
      fetchEmails();
    }
  }, [isAdmin]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(`Error al cargar usuarios: ${error.message}`);
      setLoading(false);
      return;
    }

    // Fetch emails from auth via user_roles join isn't possible,
    // so we'll use the profile data we have
    setProfiles((data as UserProfile[]) ?? []);
    setLoading(false);
  };

  const fetchEmails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke("get-user-emails");
      if (res.data?.emailMap) {
        setEmailMap(res.data.emailMap);
      }
    } catch (e) {
      console.error("Error fetching emails:", e);
    }
  };

  const getTrialDaysLeft = (trialEndsAt: string) => {
    const days = differenceInDays(new Date(trialEndsAt), new Date());
    return days;
  };

  const getStatusBadge = (status: string, trialEndsAt: string) => {
    if (status === "active") {
      return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25">Active</Badge>;
    }
    const daysLeft = getTrialDaysLeft(trialEndsAt);
    if (status === "trial" && daysLeft >= 0) {
      return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/25">Trial</Badge>;
    }
    return <Badge className="bg-red-500/15 text-red-600 border-red-500/30 hover:bg-red-500/25">Expired</Badge>;
  };

  const handleActivate = async (profile: UserProfile) => {
    setActivating(profile.id);
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: "active" } as any)
      .eq("id", profile.id);

    if (error) {
      toast.error(`Error: ${error.message}`);
    } else {
      toast.success(`Usuario ${profile.full_name || "sin nombre"} activado exitosamente`);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, subscription_status: "active" } : p))
      );
    }
    setActivating(null);
  };

  const copyPaymentLink = () => {
    navigator.clipboard.writeText("https://www.skool.com/gestorq-8720");
    toast.success("Link de pago copiado al portapapeles");
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Panel de Administración</h1>
              <p className="text-sm text-muted-foreground">Gestiona las suscripciones de tus usuarios</p>
            </div>
          </div>
          <Button variant="outline" onClick={copyPaymentLink} className="gap-2">
            <Copy className="h-4 w-4" />
            Ver Link de Pago
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Usuarios", value: profiles.length, color: "text-foreground" },
            { label: "Premium Activos", value: profiles.filter((p) => p.subscription_status === "active").length, color: "text-emerald-600" },
            { label: "En Trial / Vencidos", value: profiles.filter((p) => p.subscription_status !== "active").length, color: "text-amber-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead>Días de Prueba</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.map((profile) => {
                    const daysLeft = getTrialDaysLeft(profile.trial_ends_at);
                    const isActive = profile.subscription_status === "active";
                    return (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{profile.full_name || "Sin nombre"}</p>
                            <p className="text-xs text-muted-foreground">{emailMap[profile.user_id] || profile.user_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(profile.created_at), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          {isActive ? (
                            <span className="text-emerald-600 font-medium">∞</span>
                          ) : daysLeft >= 0 ? (
                            <span className="font-medium">{daysLeft} días</span>
                          ) : (
                            <span className="text-red-500 font-medium">Vencido</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(profile.subscription_status, profile.trial_ends_at)}</TableCell>
                        <TableCell className="text-right">
                          {!isActive && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                              disabled={activating === profile.id}
                              onClick={() => handleActivate(profile)}
                            >
                              {activating === profile.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Crown className="h-3.5 w-3.5" />
                              )}
                              Activar Premium
                            </Button>
                          )}
                          {isActive && (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                              Premium ✓
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
