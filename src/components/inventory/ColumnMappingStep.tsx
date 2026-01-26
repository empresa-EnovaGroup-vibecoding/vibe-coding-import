import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, AlertTriangle } from "lucide-react";
import { type ColumnMapping, FIELD_LABELS } from "./InventoryImportModal";

interface ColumnMappingStepProps {
  headers: string[];
  mapping: ColumnMapping;
  onConfirm: (mapping: ColumnMapping) => void;
  onBack: () => void;
}

const REQUIRED_FIELDS: (keyof ColumnMapping)[] = ["name", "sale_price", "stock_level"];
const ALL_FIELDS: (keyof ColumnMapping)[] = ["name", "sku", "stock_level", "cost_price", "sale_price", "supplier"];

export default function ColumnMappingStep({
  headers,
  mapping,
  onConfirm,
  onBack,
}: ColumnMappingStepProps) {
  const [currentMapping, setCurrentMapping] = useState<ColumnMapping>(mapping);

  const handleFieldChange = (field: keyof ColumnMapping, value: string) => {
    setCurrentMapping((prev) => ({
      ...prev,
      [field]: value === "_none_" ? null : value,
    }));
  };

  const isMappingValid = REQUIRED_FIELDS.every((field) => currentMapping[field]);

  const getMappedCount = () => {
    return ALL_FIELDS.filter((field) => currentMapping[field]).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Columnas detectadas: <span className="font-medium text-foreground">{headers.length}</span>
        </p>
        <Badge variant={isMappingValid ? "default" : "secondary"}>
          {getMappedCount()}/{ALL_FIELDS.length} campos mapeados
        </Badge>
      </div>

      <div className="grid gap-4">
        {ALL_FIELDS.map((field) => {
          const isRequired = REQUIRED_FIELDS.includes(field);
          const isMapped = !!currentMapping[field];

          return (
            <div key={field} className="grid grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-2">
                <Label className="text-sm">
                  {FIELD_LABELS[field]}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
                {isMapped && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </div>
              <Select
                value={currentMapping[field] || "_none_"}
                onValueChange={(value) => handleFieldChange(field, value)}
              >
                <SelectTrigger className={!isMapped && isRequired ? "border-destructive/50" : ""}>
                  <SelectValue placeholder="Seleccionar columna" />
                </SelectTrigger>
              <SelectContent>
                  <SelectItem value="_none_">
                    <span className="text-muted-foreground">-- No mapear --</span>
                  </SelectItem>
                  {headers
                    .filter((header) => header && header.trim() !== "")
                    .map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {!isMappingValid && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Los campos marcados con * son obligatorios. Por favor, mapea todas las columnas requeridas.
          </span>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </Button>
        <Button
          onClick={() => onConfirm(currentMapping)}
          disabled={!isMappingValid}
        >
          Continuar a Vista Previa
        </Button>
      </div>
    </div>
  );
}
