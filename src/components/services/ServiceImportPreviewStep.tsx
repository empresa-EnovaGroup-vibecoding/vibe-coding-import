import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { ArrowLeft, Upload, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import { type ParsedData, type ServiceColumnMapping, SERVICE_FIELD_LABELS } from "./ServicesImportModal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServiceImportPreviewStepProps {
  data: ParsedData;
  mapping: ServiceColumnMapping;
  onBack: () => void;
  onImportSuccess: () => void;
}

interface MappedService {
  name: string;
  duration: number;
  price: number;
  isValid: boolean;
  errors: string[];
}

export default function ServiceImportPreviewStep({
  data,
  mapping,
  onBack,
  onImportSuccess,
}: ServiceImportPreviewStepProps) {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  const parseNumericValue = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;
    let cleaned = value.toString().replace(/[Q$€\s]/gi, "");
    // Detect thousands separator: comma followed by exactly 3 digits (e.g. 1,200)
    if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(/,/g, ".");
    }
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const mappedServices: MappedService[] = useMemo(() => {
    return data.rows.map((row) => {
      const errors: string[] = [];

      const name = mapping.name ? String(row[mapping.name] || "").trim() : "";
      const duration = mapping.duration
        ? Math.round(parseNumericValue(row[mapping.duration]))
        : 30;
      const price = mapping.price
        ? parseNumericValue(row[mapping.price])
        : 0;

      if (!name) errors.push("Nombre vacio");
      if (price <= 0) errors.push("Precio invalido");
      if (duration <= 0) errors.push("Duracion invalida");

      return {
        name,
        duration,
        price,
        isValid: errors.length === 0,
        errors,
      };
    });
  }, [data.rows, mapping]);

  const validServices = mappedServices.filter((s) => s.isValid);
  const invalidServices = mappedServices.filter((s) => !s.isValid);

  const importMutation = useMutation({
    mutationFn: async (services: MappedService[]) => {
      const servicesToInsert = services.map(({ isValid, errors, ...service }) => ({
        ...service,
        tenant_id: tenantId,
      }));

      const { error } = await supabase.from("services").insert(servicesToInsert);

      if (error) throw error;
      return servicesToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(`${count} servicios importados exitosamente`);
      onImportSuccess();
    },
    onError: () => {
      toast.error("Error al importar servicios");
    },
  });

  const handleImport = () => {
    if (validServices.length === 0) {
      toast.error("No hay servicios validos para importar");
      return;
    }
    importMutation.mutate(validServices);
  };

  const displayColumns = ["name", "duration", "price"] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          {validServices.length} validos
        </Badge>
        {invalidServices.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {invalidServices.length} con errores
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          Total: {mappedServices.length} filas
        </span>
      </div>

      {invalidServices.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Las filas con errores seran ignoradas durante la importacion.</span>
        </div>
      )}

      <ScrollArea className="h-64 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">#</TableHead>
              {displayColumns.map((col) => (
                <TableHead key={col}>{SERVICE_FIELD_LABELS[col]}</TableHead>
              ))}
              <TableHead className="w-24">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedServices.slice(0, 50).map((service, index) => (
              <TableRow
                key={index}
                className={!service.isValid ? "bg-destructive/5" : ""}
              >
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{service.name || "-"}</TableCell>
                <TableCell>{service.duration} min</TableCell>
                <TableCell>Q{service.price.toFixed(2)}</TableCell>
                <TableCell>
                  {service.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="text-xs text-destructive">
                      {service.errors.join(", ")}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {mappedServices.length > 50 && (
          <p className="text-center text-sm text-muted-foreground py-2">
            Mostrando 50 de {mappedServices.length} filas...
          </p>
        )}
      </ScrollArea>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Atras
        </Button>
        <Button
          onClick={handleImport}
          disabled={validServices.length === 0 || importMutation.isPending}
          className="gap-2"
        >
          {importMutation.isPending ? (
            <>
              <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Importar {validServices.length} Servicios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
