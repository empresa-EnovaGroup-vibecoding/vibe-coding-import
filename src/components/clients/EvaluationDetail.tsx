import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Stethoscope, Sparkles, ClipboardList, ShoppingBag, Check, X } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const formatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return "Fecha no disponible";
  const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
  return isValid(date) ? format(date, formatStr, { locale: es }) : "Fecha inválida";
};

const skinTypeLabels: Record<string, string> = {
  normal: "Normal",
  dry: "Seca",
  combination: "Mixta",
  oily: "Grasa",
  sensitive: "Sensible",
  acneic: "Acneica",
};

const cleaningFrequencyLabels: Record<string, string> = {
  once: "1 vez al día",
  twice: "2 veces al día",
  occasional: "Ocasionalmente",
};

interface EvaluationDetailProps {
  evaluationId: string;
  onBack: () => void;
}

function BooleanIndicator({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={value ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

export function EvaluationDetail({ evaluationId, onBack }: EvaluationDetailProps) {
  const { data: evaluation, isLoading } = useQuery({
    queryKey: ["evaluationDetail", evaluationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facial_evaluations")
        .select("*")
        .eq("id", evaluationId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: recommendations } = useQuery({
    queryKey: ["evaluationProducts", evaluationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_product_recommendations")
        .select(`
          *,
          inventory (name, sale_price)
        `)
        .eq("evaluation_id", evaluationId);

      if (error) throw error;
      return data;
    },
    enabled: !!evaluationId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-12 bg-muted animate-pulse rounded-lg w-1/3" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Evaluación no encontrada</p>
        <Button onClick={onBack} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Evaluación Facial
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(evaluation.created_at, "EEEE, d 'de' MMMM yyyy 'a las' HH:mm")}</span>
          </div>
        </div>
      </div>

      {/* Professional Evaluation (Highlighted) */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Evaluación Profesional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tipo de Piel:</span>
            <Badge className="text-sm">{skinTypeLabels[evaluation.skin_type] || evaluation.skin_type}</Badge>
          </div>

          {evaluation.skin_analysis && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Análisis de la Piel</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background rounded-lg p-3 border border-border">
                {evaluation.skin_analysis}
              </p>
            </div>
          )}

          {evaluation.treatment_performed && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Tratamiento Realizado</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background rounded-lg p-3 border border-border">
                {evaluation.treatment_performed}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Medical Data */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-primary" />
              Datos Médicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <BooleanIndicator value={evaluation.has_skin_disease} label="Enfermedad dermatológica" />
            {evaluation.has_skin_disease && evaluation.skin_disease_details && (
              <p className="text-sm text-muted-foreground pl-6 -mt-1">{evaluation.skin_disease_details}</p>
            )}

            <BooleanIndicator value={evaluation.has_allergies} label="Alergias" />
            {evaluation.has_allergies && evaluation.allergy_details && (
              <p className="text-sm text-muted-foreground pl-6 -mt-1">{evaluation.allergy_details}</p>
            )}

            <BooleanIndicator value={evaluation.takes_medication} label="Toma medicamentos" />
            {evaluation.takes_medication && evaluation.medication_details && (
              <p className="text-sm text-muted-foreground pl-6 -mt-1">{evaluation.medication_details}</p>
            )}

            <BooleanIndicator value={evaluation.recent_treatments} label="Tratamientos recientes" />
            {evaluation.recent_treatments && evaluation.treatment_details && (
              <p className="text-sm text-muted-foreground pl-6 -mt-1">{evaluation.treatment_details}</p>
            )}

            <div className="pt-3 border-t border-border space-y-2">
              <BooleanIndicator value={evaluation.uses_sunscreen} label="Usa protector solar" />
              <BooleanIndicator value={evaluation.smokes_alcohol} label="Fuma / Consume alcohol" />
              <BooleanIndicator value={evaluation.pregnancy_lactation} label="Embarazo / Lactancia" />
            </div>
          </CardContent>
        </Card>

        {/* Current Routine */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Rutina Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Frecuencia de limpieza:</span>
              <p className="text-sm font-medium text-foreground">
                {cleaningFrequencyLabels[evaluation.cleaning_frequency] || evaluation.cleaning_frequency}
              </p>
            </div>

            {(evaluation.cleanser_brand || evaluation.serum_brand || evaluation.cream_brand || evaluation.sunscreen_brand) && (
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Marcas que usa</p>
                {evaluation.cleanser_brand && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Limpiador:</span>
                    <span className="text-foreground">{evaluation.cleanser_brand}</span>
                  </div>
                )}
                {evaluation.serum_brand && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sérum:</span>
                    <span className="text-foreground">{evaluation.serum_brand}</span>
                  </div>
                )}
                {evaluation.cream_brand && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Crema:</span>
                    <span className="text-foreground">{evaluation.cream_brand}</span>
                  </div>
                )}
                {evaluation.sunscreen_brand && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Protector solar:</span>
                    <span className="text-foreground">{evaluation.sunscreen_brand}</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-border space-y-2">
              <BooleanIndicator value={evaluation.uses_makeup} label="Se maquilla" />
              <BooleanIndicator value={evaluation.removes_makeup_properly} label="Se desmaquilla correctamente" />
              <BooleanIndicator value={evaluation.uses_exfoliants} label="Usa exfoliantes" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Productos Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-start justify-between rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {rec.inventory?.name || "Producto no disponible"}
                    </p>
                    {rec.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{rec.notes}</p>
                    )}
                  </div>
                  {rec.inventory?.sale_price && (
                    <Badge variant="secondary">
                      Q{Number(rec.inventory.sale_price).toFixed(2)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
