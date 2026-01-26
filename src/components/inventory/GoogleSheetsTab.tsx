import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, HelpCircle } from "lucide-react";
import Papa from "papaparse";
import type { ParsedData } from "./InventoryImportModal";

interface GoogleSheetsTabProps {
  onDataParsed: (data: ParsedData) => void;
}

export default function GoogleSheetsTab({ onDataParsed }: GoogleSheetsTabProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractSheetId = (url: string): string | null => {
    // Handle various Google Sheets URL formats
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]+)$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleImport = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const sheetId = extractSheetId(url.trim());
      
      if (!sheetId) {
        throw new Error("URL de Google Sheets inválida. Verifica el enlace.");
      }

      // Use the public CSV export URL
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      // Fetch the CSV data
      const response = await fetch(csvUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Hoja de cálculo no encontrada. Verifica que exista.");
        }
        throw new Error("No se pudo acceder a la hoja. Asegúrate de que sea pública o esté compartida.");
      }

      const csvText = await response.text();
      
      // Check if we got a valid CSV (not an HTML error page)
      if (csvText.includes("<!DOCTYPE html>") || csvText.includes("<html")) {
        throw new Error("La hoja no es accesible públicamente. Publica la hoja o compártela con 'Cualquier persona con el enlace'.");
      }

      // Parse the CSV
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError("Error al leer los datos: " + results.errors[0].message);
            setIsLoading(false);
            return;
          }
          
          if (!results.data || results.data.length === 0) {
            setError("La hoja de cálculo está vacía");
            setIsLoading(false);
            return;
          }

          const headers = results.meta.fields || [];
          const rows = results.data as Record<string, string>[];
          onDataParsed({ headers, rows });
          setIsLoading(false);
        },
        error: (err) => {
          setError("Error al procesar los datos: " + err.message);
          setIsLoading(false);
        },
      });
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="sheets-url">URL de Google Sheets</Label>
        <Input
          id="sheets-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="font-mono text-sm"
        />
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <HelpCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">¿Cómo publicar tu hoja?</p>
            <ol className="list-decimal list-inside space-y-0.5 text-xs">
              <li>Abre tu hoja de Google Sheets</li>
              <li>Ve a Archivo → Compartir → Publicar en la web</li>
              <li>Selecciona "Documento completo" y "CSV"</li>
              <li>Haz clic en "Publicar" y copia el enlace de tu hoja</li>
            </ol>
          </div>
        </div>
      </div>

      <Button
        onClick={handleImport}
        disabled={!url.trim() || isLoading}
        className="w-full gap-2"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Importando...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Importar desde Google Sheets
          </>
        )}
      </Button>
    </div>
  );
}
