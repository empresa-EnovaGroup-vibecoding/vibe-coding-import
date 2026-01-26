import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Stethoscope, Sparkles, ClipboardList, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { ProductRecommendationSelector } from "./ProductRecommendationSelector";

const formSchema = z.object({
  // Medical data
  has_skin_disease: z.boolean().default(false),
  skin_disease_details: z.string().optional(),
  has_allergies: z.boolean().default(false),
  allergy_details: z.string().optional(),
  takes_medication: z.boolean().default(false),
  medication_details: z.string().optional(),
  recent_treatments: z.boolean().default(false),
  treatment_details: z.string().optional(),
  uses_sunscreen: z.boolean().default(false),
  smokes_alcohol: z.boolean().default(false),
  pregnancy_lactation: z.boolean().default(false),
  
  // Current routine
  cleaning_frequency: z.enum(["once", "twice", "occasional"]).default("once"),
  cleanser_brand: z.string().optional(),
  serum_brand: z.string().optional(),
  cream_brand: z.string().optional(),
  sunscreen_brand: z.string().optional(),
  uses_makeup: z.boolean().default(false),
  removes_makeup_properly: z.boolean().default(false),
  uses_exfoliants: z.boolean().default(false),
  
  // Professional evaluation
  skin_type: z.enum(["normal", "dry", "combination", "oily", "sensitive", "acneic"]),
  skin_analysis: z.string().optional(),
  treatment_performed: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SelectedProduct {
  id: string;
  name: string;
  notes: string;
}

interface FacialEvaluationFormProps {
  clientId: string;
  onBack: () => void;
  onSuccess: () => void;
}

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

export function FacialEvaluationForm({ clientId, onBack, onSuccess }: FacialEvaluationFormProps) {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      has_skin_disease: false,
      has_allergies: false,
      takes_medication: false,
      recent_treatments: false,
      uses_sunscreen: false,
      smokes_alcohol: false,
      pregnancy_lactation: false,
      cleaning_frequency: "once",
      uses_makeup: false,
      removes_makeup_properly: false,
      uses_exfoliants: false,
      skin_type: "normal",
    },
  });

  const watchSkinDisease = form.watch("has_skin_disease");
  const watchAllergies = form.watch("has_allergies");
  const watchMedication = form.watch("takes_medication");
  const watchTreatments = form.watch("recent_treatments");

  const createEvaluationMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Create the evaluation
      const { data: evaluation, error: evalError } = await supabase
        .from("facial_evaluations")
        .insert([{
          client_id: clientId,
          has_skin_disease: values.has_skin_disease,
          skin_disease_details: values.skin_disease_details || null,
          has_allergies: values.has_allergies,
          allergy_details: values.allergy_details || null,
          takes_medication: values.takes_medication,
          medication_details: values.medication_details || null,
          recent_treatments: values.recent_treatments,
          treatment_details: values.treatment_details || null,
          uses_sunscreen: values.uses_sunscreen,
          smokes_alcohol: values.smokes_alcohol,
          pregnancy_lactation: values.pregnancy_lactation,
          cleaning_frequency: values.cleaning_frequency,
          cleanser_brand: values.cleanser_brand || null,
          serum_brand: values.serum_brand || null,
          cream_brand: values.cream_brand || null,
          sunscreen_brand: values.sunscreen_brand || null,
          uses_makeup: values.uses_makeup,
          removes_makeup_properly: values.removes_makeup_properly,
          uses_exfoliants: values.uses_exfoliants,
          skin_type: values.skin_type,
          skin_analysis: values.skin_analysis || null,
          treatment_performed: values.treatment_performed || null,
        }])
        .select()
        .single();

      if (evalError) throw evalError;

      // Add product recommendations if any
      if (selectedProducts.length > 0) {
        const recommendations = selectedProducts.map((product) => ({
          evaluation_id: evaluation.id,
          product_id: product.id,
          notes: product.notes || null,
        }));

        const { error: recError } = await supabase
          .from("evaluation_product_recommendations")
          .insert(recommendations);

        if (recError) throw recError;
      }

      return evaluation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientEvaluations", clientId] });
      toast.success("Evaluación guardada exitosamente");
      onSuccess();
    },
    onError: (error) => {
      console.error("Error creating evaluation:", error);
      toast.error("Error al guardar la evaluación");
    },
  });

  const onSubmit = (values: FormValues) => {
    createEvaluationMutation.mutate(values);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Nueva Evaluación Facial</h1>
          <p className="text-muted-foreground mt-1">Complete la ficha de evaluación del cliente</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Block A: Medical Data */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5 text-primary" />
                Datos Médicos y Antecedentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Skin Disease */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="has_skin_disease"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        ¿Enfermedad dermatológica?
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {watchSkinDisease && (
                  <FormField
                    control={form.control}
                    name="skin_disease_details"
                    render={({ field }) => (
                      <FormItem className="pl-7">
                        <FormControl>
                          <Input placeholder="¿Cuál?" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="has_allergies"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        ¿Alergias?
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {watchAllergies && (
                  <FormField
                    control={form.control}
                    name="allergy_details"
                    render={({ field }) => (
                      <FormItem className="pl-7">
                        <FormControl>
                          <Input placeholder="¿A qué?" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Medication */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="takes_medication"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        ¿Toma medicamentos?
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {watchMedication && (
                  <FormField
                    control={form.control}
                    name="medication_details"
                    render={({ field }) => (
                      <FormItem className="pl-7">
                        <FormControl>
                          <Input placeholder="¿Cuáles?" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Recent Treatments */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="recent_treatments"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        ¿Tratamientos en los últimos 6 meses?
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {watchTreatments && (
                  <FormField
                    control={form.control}
                    name="treatment_details"
                    render={({ field }) => (
                      <FormItem className="pl-7">
                        <FormControl>
                          <Input placeholder="Describa los tratamientos" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Simple Yes/No toggles */}
              <div className="grid gap-4 sm:grid-cols-3 pt-4 border-t border-border">
                <FormField
                  control={form.control}
                  name="uses_sunscreen"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                      <FormLabel className="text-sm font-normal">¿Usa protector solar?</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smokes_alcohol"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                      <FormLabel className="text-sm font-normal">¿Fuma/Alcohol?</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pregnancy_lactation"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                      <FormLabel className="text-sm font-normal">¿Embarazo/Lactancia?</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Block B: Current Routine */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Rutina Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cleaning Frequency */}
              <FormField
                control={form.control}
                name="cleaning_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia de limpieza facial</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        {Object.entries(cleaningFrequencyLabels).map(([value, label]) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={`freq-${value}`} />
                            <Label htmlFor={`freq-${value}`} className="font-normal cursor-pointer">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Product Brands */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="cleanser_brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca de limpiador</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: CeraVe, La Roche-Posay" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serum_brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca de sérum</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: The Ordinary, Paula's Choice" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cream_brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca de crema</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Neutrogena, Olay" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sunscreen_brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca de protector solar</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Isdin, Eucerin" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Toggles */}
              <div className="grid gap-4 sm:grid-cols-3 pt-4 border-t border-border">
                <FormField
                  control={form.control}
                  name="uses_makeup"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                      <FormLabel className="text-sm font-normal">¿Se maquilla?</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="removes_makeup_properly"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                      <FormLabel className="text-sm font-normal">¿Se desmaquilla bien?</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uses_exfoliants"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                      <FormLabel className="text-sm font-normal">¿Usa exfoliantes?</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Block C: Professional Evaluation */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                Evaluación Profesional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Skin Type */}
              <FormField
                control={form.control}
                name="skin_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Piel *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                      >
                        {Object.entries(skinTypeLabels).map(([value, label]) => (
                          <div
                            key={value}
                            className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                              field.value === value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={value} id={`skin-${value}`} />
                            <Label htmlFor={`skin-${value}`} className="font-normal cursor-pointer flex-1">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Skin Analysis */}
              <FormField
                control={form.control}
                name="skin_analysis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Análisis de la Piel</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describa el estado actual de la piel del cliente, observaciones, áreas problemáticas..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Treatment Performed */}
              <FormField
                control={form.control}
                name="treatment_performed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tratamiento Realizado</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describa el tratamiento realizado hoy, productos utilizados, técnicas aplicadas..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Block D: Product Recommendations */}
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

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createEvaluationMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {createEvaluationMutation.isPending ? "Guardando..." : "Guardar Evaluación"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
