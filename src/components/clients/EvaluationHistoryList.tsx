import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Calendar } from "lucide-react";
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

interface EvaluationHistoryListProps {
  clientId: string;
  onNewEvaluation: () => void;
  onViewEvaluation: (evaluationId: string) => void;
}

export function EvaluationHistoryList({
  clientId,
  onNewEvaluation,
  onViewEvaluation,
}: EvaluationHistoryListProps) {
  const { data: evaluations, isLoading } = useQuery({
    queryKey: ["clientEvaluations", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facial_evaluations")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      {/* Header with New Evaluation button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Historial Clínico</h3>
        <Button onClick={onNewEvaluation} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Evaluación
        </Button>
      </div>

      {/* Evaluations list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !evaluations || evaluations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-border">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-4">No hay evaluaciones registradas</p>
          <Button onClick={onNewEvaluation} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Crear Primera Evaluación
          </Button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {evaluations.map((evaluation) => (
            <button
              key={evaluation.id}
              onClick={() => onViewEvaluation(evaluation.id)}
              className="w-full text-left rounded-lg border border-border bg-muted/30 p-4 hover:bg-muted/50 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {formatDate(evaluation.created_at, "d 'de' MMMM, yyyy")}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Piel {skinTypeLabels[evaluation.skin_type] || evaluation.skin_type}
                </Badge>
              </div>

              {evaluation.treatment_performed && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  <span className="font-medium text-foreground">Tratamiento:</span>{" "}
                  {evaluation.treatment_performed}
                </p>
              )}

              {evaluation.skin_analysis && !evaluation.treatment_performed && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  <span className="font-medium text-foreground">Análisis:</span>{" "}
                  {evaluation.skin_analysis}
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                {formatDate(evaluation.created_at, "HH:mm")} hrs • Clic para ver detalles
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
