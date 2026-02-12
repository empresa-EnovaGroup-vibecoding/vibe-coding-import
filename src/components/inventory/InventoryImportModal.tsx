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
import FileUploadTab from "./FileUploadTab";
import GoogleSheetsTab from "./GoogleSheetsTab";
import ColumnMappingStep from "./ColumnMappingStep";
import ImportPreviewStep from "./ImportPreviewStep";

interface InventoryImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export type ImportStep = "source" | "mapping" | "preview";

export interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ColumnMapping {
  name: string | null;
  sku: string | null;
  stock_level: string | null;
  cost_price: string | null;
  sale_price: string | null;
  supplier: string | null;
}

const REQUIRED_FIELDS = ["name", "sale_price", "stock_level"] as const;
const OPTIONAL_FIELDS = ["sku", "cost_price", "supplier"] as const;

export const FIELD_LABELS: Record<string, string> = {
  name: "Nombre del Producto",
  sku: "Código SKU",
  stock_level: "Stock",
  cost_price: "Precio Costo (Q)",
  sale_price: "Precio Venta (Q)",
  supplier: "Proveedor",
};

export default function InventoryImportModal({
  open,
  onOpenChange,
  onImportComplete,
}: InventoryImportModalProps) {
  const [step, setStep] = useState<ImportStep>("source");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: null,
    sku: null,
    stock_level: null,
    cost_price: null,
    sale_price: null,
    supplier: null,
  });

  const handleDataParsed = (data: ParsedData) => {
    setParsedData(data);
    // Try to auto-map columns
    const autoMapping = autoMapColumns(data.headers);
    setColumnMapping(autoMapping);
    setStep("mapping");
  };

  const autoMapColumns = (headers: string[]): ColumnMapping => {
    const normalizeHeader = (h: string) => h.toLowerCase().trim().replace(/[^a-z0-9áéíóúñ]/g, "");

    const mapping: ColumnMapping = {
      name: null,
      sku: null,
      stock_level: null,
      cost_price: null,
      sale_price: null,
      supplier: null,
    };

    const aliases: Record<keyof ColumnMapping, string[]> = {
      name: ["nombre", "nombredelproducto", "producto", "product", "name", "descripcion"],
      sku: ["sku", "codigo", "codigoqr", "code", "barcode", "codigodebarras", "qr"],
      stock_level: ["stock", "cantidad", "inventario", "qty", "quantity", "existencia", "existencias"],
      cost_price: ["costo", "preciocosto", "costprice", "cost", "preciodecompra"],
      sale_price: ["precio", "precioventa", "saleprice", "price", "preciodeventa", "preciounidad", "precioq"],
      supplier: ["proveedor", "supplier", "vendor", "marca"],
    };

    headers.forEach((header) => {
      const normalized = normalizeHeader(header);
      for (const [field, fieldAliases] of Object.entries(aliases)) {
        if (fieldAliases.some(alias => normalized.includes(alias))) {
          if (!mapping[field as keyof ColumnMapping]) {
            mapping[field as keyof ColumnMapping] = header;
          }
        }
      }
    });

    return mapping;
  };

  const handleMappingConfirm = (mapping: ColumnMapping) => {
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
    setColumnMapping({
      name: null,
      sku: null,
      stock_level: null,
      cost_price: null,
      sale_price: null,
      supplier: null,
    });
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
            {step === "source" && "Importar Inventario"}
            {step === "mapping" && "Mapear Columnas"}
            {step === "preview" && "Vista Previa"}
          </DialogTitle>
          <DialogDescription>
            {step === "source" && "Sube un archivo o sincroniza desde Google Sheets"}
            {step === "mapping" && "Asigna cada columna del archivo a los campos del inventario"}
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
          <ColumnMappingStep
            headers={parsedData.headers}
            mapping={columnMapping}
            onConfirm={handleMappingConfirm}
            onBack={handleBack}
          />
        )}

        {step === "preview" && parsedData && (
          <ImportPreviewStep
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
