import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Phone, Mail, FileText, Calendar, Clock, ShoppingBag, Save, ClipboardList, Gift, Pencil, DollarSign, TrendingUp, Scissors } from "lucide-react";
import { toTitleCase } from "@/lib/utils";
import { toast } from "sonner";
import { EvaluationHistoryList } from "./EvaluationHistoryList";
import EvaluationFormSelector from "./EvaluationFormSelector";
import DynamicEvaluationForm from "./DynamicEvaluationForm";
import DynamicEvaluationDetail from "./DynamicEvaluationDetail";
import { ClientPackages } from "./ClientPackages";
import { EditClientDialog } from "./EditClientDialog";
import { ClientAppointmentCard, formatDate } from "./ClientAppointmentCard";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
}

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
}

type ViewMode = "detail" | "selectFormType" | "newEvaluation" | "viewEvaluation";

export function ClientDetail({ client, onBack }: ClientDetailProps) {
  const [notes, setNotes] = useState(client.notes || "");
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [selectedFormType, setSelectedFormType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: appointments, isLoading: loadingAppointments } = useQuery({
    queryKey: ["clientAppointments", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          appointment_services (
            id,
            price_at_time,
            services (name, duration)
          )
        `)
        .eq("client_id", client.id)
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: sales, isLoading: loadingSales } = useQuery({
    queryKey: ["clientSales", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items (
            id,
            item_name,
            quantity,
            unit_price,
            subtotal
          )
        `)
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async (newNotes: string) => {
      const { error } = await supabase
        .from("clients")
        .update({ notes: newNotes })
        .eq("id", client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Notas guardadas");
    },
    onError: () => {
      toast.error("Error al guardar las notas");
    },
  });

  const futureAppointments = appointments?.filter(
    (apt) => new Date(apt.start_time) >= new Date()
  );
  const pastAppointments = appointments?.filter(
    (apt) => new Date(apt.start_time) < new Date()
  );

  // Handle sub-views for evaluations
  if (viewMode === "selectFormType") {
    return (
      <EvaluationFormSelector
        onSelect={(formType) => {
          setSelectedFormType(formType);
          setViewMode("newEvaluation");
        }}
        onBack={() => setViewMode("detail")}
      />
    );
  }

  if (viewMode === "newEvaluation" && selectedFormType) {
    return (
      <DynamicEvaluationForm
        clientId={client.id}
        formType={selectedFormType}
        onBack={() => setViewMode("selectFormType")}
        onSuccess={() => {
          setSelectedFormType(null);
          setViewMode("detail");
        }}
      />
    );
  }

  if (viewMode === "viewEvaluation" && selectedEvaluationId) {
    return (
      <DynamicEvaluationDetail
        evaluationId={selectedEvaluationId}
        onBack={() => {
          setViewMode("detail");
          setSelectedEvaluationId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pt-12 lg:pt-0 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{client.name}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-1">Ficha del cliente</p>
        </div>
      </div>

      {/* Edit Client Dialog */}
      <EditClientDialog
        client={client}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Client Summary Stats */}
      {(() => {
        const completedAppointments = appointments?.filter(a => a.status === "completed") || [];
        const totalAppointmentSpend = completedAppointments.reduce((sum, a) => sum + Number(a.total_price), 0);
        const totalSalesSpend = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
        const totalSpent = totalAppointmentSpend + totalSalesSpend;
        const totalVisits = completedAppointments.length;
        const lastVisit = completedAppointments[0]?.start_time;

        // Find most used service
        const serviceCounts: Record<string, number> = {};
        completedAppointments.forEach(a => {
          a.appointment_services?.forEach((s: { services: { name: string } | null }) => {
            const name = s.services?.name;
            if (name) serviceCounts[name] = (serviceCounts[name] || 0) + 1;
          });
        });
        const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

        return (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Total Gastado</span>
              </div>
              <p className="text-xl font-bold text-foreground">Q{totalSpent.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Visitas</span>
              </div>
              <p className="text-xl font-bold text-foreground">{totalVisits}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">Ultima Visita</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {lastVisit ? formatDate(lastVisit, "d MMM yyyy") : "Sin visitas"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Scissors className="h-4 w-4" />
                <span className="text-xs font-medium">Servicio Favorito</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">
                {topService ? `${topService[0]} (${topService[1]}x)` : "N/A"}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Main Tabs: General Data vs Clinical History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="general" className="gap-2">
            <User className="h-4 w-4" />
            Datos Generales
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-2">
            <Gift className="h-4 w-4" />
            Paquetes
          </TabsTrigger>
          <TabsTrigger value="clinical" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Historial Clínico
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: General Data */}
        <TabsContent value="general" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Client Info Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    Cliente desde {formatDate(client.created_at, "MMMM yyyy")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {client.phone && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`https://wa.me/${client.phone.replace(/[\s()-]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-3 text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${client.email}`}
                      className="hover:text-primary hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Notas / Observaciones
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1"
                    onClick={() => updateNotesMutation.mutate(notes)}
                    disabled={updateNotesMutation.isPending}
                  >
                    <Save className="h-3 w-3" />
                    Guardar
                  </Button>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar notas sobre el cliente..."
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Nested Tabs for Appointments/Purchases */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
              <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="appointments" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Citas ({appointments?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="purchases" className="gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Compras ({sales?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="appointments" className="mt-0">
                  {loadingAppointments ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : !appointments || appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No hay citas registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {/* Future appointments */}
                      {futureAppointments && futureAppointments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Próximas citas</h4>
                          {futureAppointments.map((appointment) => (
                            <ClientAppointmentCard key={appointment.id} appointment={appointment} />
                          ))}
                        </div>
                      )}

                      {/* Past appointments */}
                      {pastAppointments && pastAppointments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Historial</h4>
                          {pastAppointments.map((appointment) => (
                            <ClientAppointmentCard key={appointment.id} appointment={appointment} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="purchases" className="mt-0">
                  {loadingSales ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : !sales || sales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No hay compras registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {sales.map((sale) => (
                        <div
                          key={sale.id}
                          className="rounded-lg border border-border bg-muted/30 p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {formatDate(sale.created_at, "EEEE, d 'de' MMMM yyyy")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(sale.created_at, "HH:mm")} hrs
                              </p>
                            </div>
                            <p className="text-lg font-bold text-primary">
                              Q{Number(sale.total_amount).toFixed(2)}
                            </p>
                          </div>

                          {sale.sale_items && sale.sale_items.length > 0 && (
                            <div className="border-t border-border pt-3">
                              <p className="text-xs text-muted-foreground mb-2">Artículos:</p>
                              <div className="space-y-1">
                                {sale.sale_items.map((item: { id: string; item_name: string; quantity: number; subtotal: number }) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span>
                                      {item.quantity}x {toTitleCase(item.item_name)}
                                    </span>
                                    <span className="text-muted-foreground">
                                      Q{Number(item.subtotal).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {sale.notes && (
                            <p className="text-sm text-muted-foreground mt-2 border-t border-border pt-2">
                              {sale.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Packages */}
        <TabsContent value="packages" className="mt-0">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <ClientPackages clientId={client.id} />
          </div>
        </TabsContent>

        {/* Tab 2: Clinical History */}
        <TabsContent value="clinical" className="mt-0">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <EvaluationHistoryList
              clientId={client.id}
              onNewEvaluation={() => setViewMode("selectFormType")}
              onViewEvaluation={(evaluationId) => {
                setSelectedEvaluationId(evaluationId);
                setViewMode("viewEvaluation");
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
