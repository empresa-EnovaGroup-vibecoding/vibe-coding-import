import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Papa from "papaparse";
import type { ParsedData } from "./InventoryImportModal";

interface FileUploadTabProps {
  onDataParsed: (data: ParsedData) => void;
}

export default function FileUploadTab({ onDataParsed }: FileUploadTabProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);

    const extension = file.name.split(".").pop()?.toLowerCase();

    try {
      if (extension === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setError("Error al leer el archivo CSV: " + results.errors[0].message);
              setIsProcessing(false);
              return;
            }
            const headers = results.meta.fields || [];
            const rows = results.data as Record<string, string>[];
            onDataParsed({ headers, rows });
            setIsProcessing(false);
          },
          error: (err) => {
            setError("Error al procesar el archivo: " + err.message);
            setIsProcessing(false);
          },
        });
      } else {
        setError("Formato de archivo no soportado. Usa archivos CSV.");
        setIsProcessing(false);
      }
    } catch {
      setError("Error al procesar el archivo");
      setIsProcessing(false);
    }
  }, [onDataParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      processFile(droppedFile);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  }, [processFile]);

  const clearFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
          }
        `}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-foreground font-medium mb-1">
              Arrastra y suelta tu archivo aquí
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              o haz clic para seleccionar
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Formato soportado: CSV
            </p>
          </>
        )}
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Procesando archivo...
        </div>
      )}
    </div>
  );
}
