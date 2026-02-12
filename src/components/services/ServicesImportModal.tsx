import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Link } from "lucide-react";
import FileUploadTab from "@/components/inventory/FileUploadTab";
import GoogleSheetsTab from "@/components/inventory/GoogleSheetsTab";
import ServiceColumnMappingStep from "./ServiceColumnMappingStep";
import ServiceImportPreviewStep from "./ServiceImportPreviewStep";

interface ServicesImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export type ImportStep = "source" | "mapping" | "preview";

export interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ServiceColumnMapping {
  name: string | null;
  description: string | null;
  duration: string | null;
  price: string | null;
}

export const SERVICE_FIELD_LABELS: Record<string, string> = {
  name: "Nombre del Servicio",
  description: "Descripcion / Detalle",
  duration: "Duracion (min)",
  price: "Precio (Q)",
};

export default function ServicesImportModal({
  open,
  onOpenChange,
  onImportComplete,
}: ServicesImportModalProps) {
  const [step, setStep] = useState<ImportStep>("source");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ServiceColumnMapping>({
    name: null,
    description: null,
    duration: null,
    price: null,
  });

  const handleDataParsed = (data: ParsedData) => {
    setParsedData(data);
    const autoMapping = autoMapColumns(data.headers);
    setColumnMapping(autoMapping);
    setStep("mapping");
  };

  const autoMapColumns = (headers: string[]): ServiceColumnMapping => {
    const normalizeHeader = (h: string) =>
      h.toLowerCase().trim().replace(/[^a-z0-9áéíóúñ]/g, "");

    const mapping: ServiceColumnMapping = {
      name: null,
      description: null,
      duration: null,
      price: null,
    };

    const aliases: Record<keyof ServiceColumnMapping, string[]> = {
      name: ["nombre", "servicio", "service", "tratamiento", "name", "nombredelservicio"],
      description: ["detalle", "descripcion", "description", "detail", "nota", "notas"],
      duration: ["duracion", "tiempo", "minutos", "minutes", "min", "duration", "time", "tiempomin"],
      price: ["precio", "tarifa", "price", "rate", "valor", "precioq"],
    };

    // Words that disqualify a header from matching duration (e.g. "DETALLE / DURACION")
    const durationExclude = ["detalle", "descripcion", "detail"];

    headers.forEach((header) => {
      const normalized = normalizeHeader(header);
      for (const [field, fieldAliases] of Object.entries(aliases)) {
        if (field === "duration" && durationExclude.some((ex) => normalized.includes(ex))) {
          continue;
        }
        if (fieldAliases.some((alias) => normalized.includes(alias))) {
          if (!mapping[field as keyof ServiceColumnMapping]) {
            mapping[field as keyof ServiceColumnMapping] = header;
          }
        }
      }
    });

    return mapping;
  };

  const handleMappingConfirm = (mapping: ServiceColumnMapping) => {
    setColumnMapping(mapping);
    setStep("preview");
  };

  const handleBack = () => {
    if (step === "preview") {
      setStep("mapping");
    } else if (step === "mapping") {
      setStep("source");
      setParsedData(null);
    }
  };

  const handleClose = () => {
    setStep("source");
    setParsedData(null);
    setColumnMapping({ name: null, description: null, duration: null, price: null });
    onOpenChange(false);
  };

  const handleImportSuccess = () => {
    onImportComplete();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "source" && "Importar Servicios"}
            {step === "mapping" && "Mapear Columnas"}
            {step === "preview" && "Vista Previa"}
          </DialogTitle>
          <DialogDescription>
            {step === "source" && "Sube un archivo o sincroniza desde Google Sheets"}
            {step === "mapping" && "Asigna cada columna del archivo a los campos del servicio"}
            {step === "preview" && "Revisa los datos antes de importar"}
          </DialogDescription>
        </DialogHeader>

        {step === "source" && (
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="gap-2">
                <Upload className="h-4 w-4" />
                Subir Archivo
              </TabsTrigger>
              <TabsTrigger value="sheets" className="gap-2">
                <Link className="h-4 w-4" />
                Google Sheets
              </TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="mt-4">
              <FileUploadTab onDataParsed={handleDataParsed} />
            </TabsContent>
            <TabsContent value="sheets" className="mt-4">
              <GoogleSheetsTab onDataParsed={handleDataParsed} />
            </TabsContent>
          </Tabs>
        )}

        {step === "mapping" && parsedData && (
          <ServiceColumnMappingStep
            headers={parsedData.headers}
            mapping={columnMapping}
            onConfirm={handleMappingConfirm}
            onBack={handleBack}
          />
        )}

        {step === "preview" && parsedData && (
          <ServiceImportPreviewStep
            data={parsedData}
            mapping={columnMapping}
            onBack={handleBack}
            onImportSuccess={handleImportSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
