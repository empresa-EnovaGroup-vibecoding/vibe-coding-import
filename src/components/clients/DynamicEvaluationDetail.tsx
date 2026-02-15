import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFormDef } from "@/lib/evaluation-forms";
import type { FieldDef, SectionDef } from "@/lib/evaluation-forms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isValid, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  Sparkles,
  Waves,
  Zap,
  HeartPulse,
  Scissors,
  Palette,
  Activity,
  Hand,
  ArrowLeft,
  Calendar,
  ClipboardList,
  ShoppingBag,
  Camera,
  Check,
  X,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Waves,
  Zap,
  HeartPulse,
  Scissors,
  Palette,
  Activity,
  Hand,
  ClipboardList,
  ShoppingBag,
  Camera,
};

interface DynamicEvaluationDetailProps {
  evaluationId: string;
  onBack: () => void;
}

interface ProductRecommendation {
  product_id: string;
  notes: string | null;
  inventory: {
    name: string;
    sale_price: number | null;
  } | null;
}

const formatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return "Fecha no disponible";
  const date = typeof dateString === "string" ? parseISO(dateString) : new Date(dateString);
  return isValid(date) ? format(date, formatStr, { locale: es }) : "Fecha invalida";
};

function BooleanIndicator({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={value ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}

export default function DynamicEvaluationDetail({
  evaluationId,
  onBack,
}: DynamicEvaluationDetailProps) {
  // Fetch evaluation
  const { data: evaluation, isLoading: loadingEvaluation } = useQuery({
    queryKey: ["evaluation", evaluationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_evaluations")
        .select("*")
        .eq("id", evaluationId)
        .single();

      if (error) {
        toast.error("Error al cargar la evaluacion");
        throw error;
      }

      return data;
    },
  });

  // Fetch product recommendations
  const { data: products = [] } = useQuery({
    queryKey: ["evaluation-products", evaluationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinical_evaluation_products")
        .select(
          `
          product_id,
          notes,
          inventory:product_id (
            name,
            sale_price
          )
        `
        )
        .eq("evaluation_id", evaluationId);

      if (error) {
        return [];
      }

      return (data || []).map((d: Record<string, unknown>) => ({
        product_id: d.product_id,
        notes: d.notes,
        inventory: Array.isArray(d.inventory) ? d.inventory[0] ?? null : d.inventory ?? null,
      })) as ProductRecommendation[];
    },
    enabled: !!evaluation,
  });

  if (loadingEvaluation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando evaluacion...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Evaluacion no encontrada</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const formDef = getFormDef(evaluation.form_type);

  if (!formDef) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">
          Tipo de formulario no reconocido: {evaluation.form_type}
        </p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const FormIcon = ICON_MAP[formDef.icon] || ClipboardList;
  const formData = (evaluation.form_data || {}) as Record<string, unknown>;
  const photos = (evaluation.photos || []) as string[];

  // Helper to check if a field should be shown based on conditionalOn
  const shouldShowField = (field: FieldDef): boolean => {
    if (!field.conditionalOn) return true;
    const conditionValue = formData[field.conditionalOn];
    return conditionValue === true || conditionValue === "yes";
  };

  // Render a single field (read-only)
  const renderField = (field: FieldDef) => {
    if (!shouldShowField(field)) return null;

    const value = formData[field.key];

    // Skip empty fields for text/textarea/select/radio
    if (
      (field.type === "text" ||
        field.type === "textarea" ||
        field.type === "select" ||
        field.type === "radio") &&
      (!value || value === "")
    ) {
      return null;
    }

    switch (field.type) {
      case "boolean":
        return (
          <BooleanIndicator
            key={field.key}
            value={value === true}
            label={field.label}
          />
        );

      case "text":
      case "number":
        return (
          <div key={field.key}>
            <p className="text-sm font-medium text-foreground mb-1">
              {field.label}
            </p>
            <p className="text-sm text-muted-foreground bg-background rounded-lg p-3 border border-border">
              {String(value)}
            </p>
          </div>
        );

      case "textarea":
        return (
          <div key={field.key}>
            <p className="text-sm font-medium text-foreground mb-1">
              {field.label}
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background rounded-lg p-3 border border-border">
              {String(value)}
            </p>
          </div>
        );

      case "select":
      case "radio": {
        if (!field.options) return null;
        const selectedOption = field.options.find(
          (opt) => opt.value === value
        );
        if (!selectedOption) return null;
        return (
          <div key={field.key}>
            <p className="text-sm font-medium text-foreground mb-1">
              {field.label}
            </p>
            <p className="text-sm text-muted-foreground bg-background rounded-lg p-3 border border-border">
              {selectedOption.label}
            </p>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Render a section
  const renderSection = (section: SectionDef, index: number) => {
    const SectionIcon = ICON_MAP[section.icon] || ClipboardList;

    // Separate boolean fields for grid layout
    const booleanFields = section.fields.filter(
      (f) => f.type === "boolean" && shouldShowField(f)
    );
    const otherFields = section.fields.filter(
      (f) => f.type !== "boolean" && shouldShowField(f)
    );

    // Don't render empty sections
    const hasContent =
      booleanFields.length > 0 ||
      otherFields.some((f) => {
        const value = formData[f.key];
        return value !== null && value !== undefined && value !== "";
      });

    if (!hasContent) return null;

    return (
      <Card key={index}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SectionIcon className="h-5 w-5" />
            {section.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Boolean fields in grid */}
          {booleanFields.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {booleanFields.map((field) => renderField(field))}
            </div>
          )}

          {/* Other fields stacked */}
          {otherFields.map((field) => renderField(field))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button onClick={onBack} variant="ghost" size="icon">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FormIcon className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Evaluacion {formDef.label}</h2>
            <Badge
              variant="outline"
              style={{
                borderColor: formDef.color,
                color: formDef.color,
              }}
            >
              {formDef.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(
                evaluation.created_at,
                "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Diagnosis & Treatment Card (highlighted) */}
      {(evaluation.diagnosis ||
        evaluation.treatment_cabin ||
        evaluation.treatment_home ||
        evaluation.cost) && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Diagnostico y Tratamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {evaluation.diagnosis && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Diagnostico
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background rounded-lg p-3 border border-border">
                  {evaluation.diagnosis}
                </p>
              </div>
            )}

            {evaluation.treatment_cabin && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Tratamiento en Cabina
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background rounded-lg p-3 border border-border">
                  {evaluation.treatment_cabin}
                </p>
              </div>
            )}

            {evaluation.treatment_home && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Tratamiento en Casa
                </p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background rounded-lg p-3 border border-border">
                  {evaluation.treatment_home}
                </p>
              </div>
            )}

            {evaluation.cost !== null && evaluation.cost !== undefined && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Costo Estimado
                </p>
                <p className="text-sm text-muted-foreground bg-background rounded-lg p-3 border border-border">
                  ${Number(evaluation.cost).toLocaleString("es-AR")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dynamic Sections */}
      {formDef.sections.map((section, index) => renderSection(section, index))}

      {/* Photos */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Fotos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="rounded-lg aspect-square object-cover w-full border border-border"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Recommendations */}
      {formDef.hasProductRecommendations && products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Productos Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.product_id}
                  className="flex items-start justify-between p-3 bg-background rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {product.inventory?.name || "Producto desconocido"}
                    </p>
                    {product.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.notes}
                      </p>
                    )}
                  </div>
                  {product.inventory?.sale_price != null && (
                    <p className="text-sm font-semibold text-primary ml-4">
                      $
                      {Number(product.inventory!.sale_price).toLocaleString(
                        "es-AR"
                      )}
                    </p>
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
