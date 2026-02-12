import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFormDef } from "@/lib/evaluation-forms";
import type { FieldDef, SectionDef } from "@/lib/evaluation-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
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
} from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import { ProductRecommendationSelector } from "./ProductRecommendationSelector";
import EvaluationPhotoUploader from "./EvaluationPhotoUploader";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Waves, Zap, HeartPulse, Scissors, Palette, Activity, Hand,
  ClipboardList, ShoppingBag, Camera,
};

interface SelectedProduct {
  id: string;
  name: string;
  notes: string;
}

interface DynamicEvaluationFormProps {
  clientId: string;
  formType: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function DynamicEvaluationForm({
  clientId,
  formType,
  onBack,
  onSuccess,
}: DynamicEvaluationFormProps) {
  const formDef = getFormDef(formType);
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentCabin, setTreatmentCabin] = useState("");
  const [treatmentHome, setTreatmentHome] = useState("");
  const [cost, setCost] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: evaluation, error } = await supabase
        .from("clinical_evaluations")
        .insert([{
          client_id: clientId,
          tenant_id: tenantId,
          form_type: formType,
          form_data: formData,
          diagnosis: diagnosis || null,
          treatment_cabin: treatmentCabin || null,
          treatment_home: treatmentHome || null,
          cost: cost ? parseFloat(cost) : null,
          photos: photos.length > 0 ? photos : null,
        }])
        .select()
        .single();

      if (error) throw error;

      if (selectedProducts.length > 0) {
        const { error: prodError } = await supabase
          .from("clinical_evaluation_products")
          .insert(
            selectedProducts.map((p) => ({
              evaluation_id: evaluation.id,
              product_id: p.id,
              notes: p.notes || null,
              tenant_id: tenantId,
            }))
          );
        if (prodError) throw prodError;
      }

      return evaluation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientEvaluations", clientId] });
      toast.success("Evaluacion guardada exitosamente");
      onSuccess();
    },
    onError: () => {
      toast.error("Error al guardar la evaluacion");
    },
  });

  if (!formDef) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Tipo de formulario no reconocido</p>
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const FormIcon = ICON_MAP[formDef.icon] || ClipboardList;

  const shouldShowField = (field: FieldDef): boolean => {
    if (!field.conditionalOn) return true;
    return formData[field.conditionalOn] === true;
  };

  const renderField = (field: FieldDef) => {
    if (!shouldShowField(field)) return null;

    switch (field.type) {
      case "boolean":
        return (
          <div key={field.key} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
            <Label className="text-sm font-normal cursor-pointer">{field.label}</Label>
            <Switch
              checked={formData[field.key] === true}
              onCheckedChange={(v) => updateField(field.key, v)}
            />
          </div>
        );

      case "text":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-sm font-medium">{field.label}</Label>
            <Input
              value={(formData[field.key] as string) || ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-sm font-medium">{field.label}</Label>
            <Input
              type="number"
              value={(formData[field.key] as string) || ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-sm font-medium">{field.label}</Label>
            <Textarea
              value={(formData[field.key] as string) || ""}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
            />
          </div>
        );

      case "select":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-sm font-medium">{field.label}</Label>
            <Select
              value={(formData[field.key] as string) || ""}
              onValueChange={(v) => updateField(field.key, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "radio":
        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium">{field.label}</Label>
            <RadioGroup
              value={(formData[field.key] as string) || ""}
              onValueChange={(v) => updateField(field.key, v)}
              className="flex flex-wrap gap-3"
            >
              {field.options?.map((opt) => (
                <div
                  key={opt.value}
                  className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                    formData[field.key] === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={opt.value} id={`${field.key}-${opt.value}`} />
                  <Label htmlFor={`${field.key}-${opt.value}`} className="font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSection = (section: SectionDef, index: number) => {
    const SectionIcon = ICON_MAP[section.icon] || ClipboardList;
    const booleanFields = section.fields.filter((f) => f.type === "boolean" && shouldShowField(f));
    const conditionalTextFields = section.fields.filter(
      (f) => f.type !== "boolean" && f.conditionalOn && shouldShowField(f)
    );
    const otherFields = section.fields.filter(
      (f) => f.type !== "boolean" && !f.conditionalOn
    );

    return (
      <Card key={index}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SectionIcon className="h-5 w-5 text-primary" />
            {section.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Non-boolean, non-conditional fields first */}
          {otherFields.map((field) => renderField(field))}

          {/* Boolean fields in grid */}
          {booleanFields.length > 0 && (
            <div className={`grid gap-3 ${otherFields.length > 0 ? "pt-4 border-t border-border" : ""} ${
              booleanFields.length > 2 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"
            }`}>
              {booleanFields.map((field) => renderField(field))}
            </div>
          )}

          {/* Conditional text fields that appear when booleans are on */}
          {conditionalTextFields.map((field) => renderField(field))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <FormIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Evaluacion {formDef.label}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">{formDef.description}</p>
        </div>
      </div>

      {/* Dynamic sections */}
      {formDef.sections.map((section, i) => renderSection(section, i))}

      {/* Common: Diagnosis & Treatment */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Diagnostico y Tratamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Diagnostico</Label>
            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Diagnostico del profesional..."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tratamiento en Cabina</Label>
            <Textarea
              value={treatmentCabin}
              onChange={(e) => setTreatmentCabin(e.target.value)}
              placeholder="Tratamiento realizado en cabina..."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tratamiento en Casa</Label>
            <Textarea
              value={treatmentHome}
              onChange={(e) => setTreatmentHome(e.target.value)}
              placeholder="Recomendaciones para el hogar..."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Costo Estimado (Q)</Label>
            <Input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardContent className="pt-6">
          <EvaluationPhotoUploader
            tenantId={tenantId || ""}
            photos={photos}
            onPhotosChange={setPhotos}
          />
        </CardContent>
      </Card>

      {/* Product Recommendations */}
      {formDef.hasProductRecommendations && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Productos Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductRecommendationSelector
              selectedProducts={selectedProducts}
              onProductsChange={setSelectedProducts}
            />
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Cancelar
        </Button>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Guardando..." : "Guardar Evaluacion"}
        </Button>
      </div>
    </div>
  );
}
