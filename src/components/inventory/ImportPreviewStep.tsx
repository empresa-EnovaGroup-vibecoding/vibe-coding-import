import { useState, useMemo } from "react";
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
import { type ParsedData, type ColumnMapping, FIELD_LABELS } from "./InventoryImportModal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportPreviewStepProps {
  data: ParsedData;
  mapping: ColumnMapping;
  onBack: () => void;
  onImportSuccess: () => void;
}

interface MappedProduct {
  name: string;
  sku: string | null;
  stock_level: number;
  cost_price: number;
  sale_price: number;
  supplier: string | null;
  isValid: boolean;
  errors: string[];
}

export default function ImportPreviewStep({
  data,
  mapping,
  onBack,
  onImportSuccess,
}: ImportPreviewStepProps) {
  const queryClient = useQueryClient();

  const parseNumericValue = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;
    // Remove currency symbols, spaces, and handle both comma and dot
    const cleaned = value.toString().replace(/[Q$€\s]/gi, "").replace(",", ".");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const mappedProducts: MappedProduct[] = useMemo(() => {
    return data.rows.map((row) => {
      const errors: string[] = [];
      
      const name = mapping.name ? String(row[mapping.name] || "").trim() : "";
      const sku = mapping.sku ? String(row[mapping.sku] || "").trim() || null : null;
      const stock_level = mapping.stock_level 
        ? Math.round(parseNumericValue(row[mapping.stock_level]))
        : 0;
      const cost_price = mapping.cost_price 
        ? parseNumericValue(row[mapping.cost_price])
        : 0;
      const sale_price = mapping.sale_price 
        ? parseNumericValue(row[mapping.sale_price])
        : 0;
      const supplier = mapping.supplier 
        ? String(row[mapping.supplier] || "").trim() || null
        : null;

      if (!name) errors.push("Nombre vacío");
      if (sale_price <= 0) errors.push("Precio inválido");
      if (stock_level < 0) errors.push("Stock negativo");

      return {
        name,
        sku,
        stock_level,
        cost_price,
        sale_price,
        supplier,
        isValid: errors.length === 0,
        errors,
      };
    });
  }, [data.rows, mapping]);

  const validProducts = mappedProducts.filter((p) => p.isValid);
  const invalidProducts = mappedProducts.filter((p) => !p.isValid);

  const importMutation = useMutation({
    mutationFn: async (products: MappedProduct[]) => {
      const productsToInsert = products.map(({ isValid, errors, ...product }) => product);
      
      const { error } = await supabase.from("inventory").insert(productsToInsert);
      
      if (error) throw error;
      return productsToInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockCount"] });
      toast.success(`${count} productos importados exitosamente`);
      onImportSuccess();
    },
    onError: (error) => {
      console.error("Import error:", error);
      toast.error("Error al importar productos: " + (error as Error).message);
    },
  });

  const handleImport = () => {
    if (validProducts.length === 0) {
      toast.error("No hay productos válidos para importar");
      return;
    }
    importMutation.mutate(validProducts);
  };

  const displayColumns = ["name", "sku", "stock_level", "sale_price"] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          {validProducts.length} válidos
        </Badge>
        {invalidProducts.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {invalidProducts.length} con errores
          </Badge>
        )}
        <span className="text-sm text-muted-foreground">
          Total: {mappedProducts.length} filas
        </span>
      </div>

      {invalidProducts.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            Las filas con errores serán ignoradas durante la importación.
          </span>
        </div>
      )}

      <ScrollArea className="h-64 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">#</TableHead>
              {displayColumns.map((col) => (
                <TableHead key={col}>{FIELD_LABELS[col]}</TableHead>
              ))}
              <TableHead className="w-24">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedProducts.slice(0, 50).map((product, index) => (
              <TableRow 
                key={index}
                className={!product.isValid ? "bg-destructive/5" : ""}
              >
                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="font-medium">{product.name || "-"}</TableCell>
                <TableCell className="text-muted-foreground">{product.sku || "-"}</TableCell>
                <TableCell>{product.stock_level}</TableCell>
                <TableCell>Q{product.sale_price.toFixed(2)}</TableCell>
                <TableCell>
                  {product.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <span className="text-xs text-destructive">
                      {product.errors.join(", ")}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {mappedProducts.length > 50 && (
          <p className="text-center text-sm text-muted-foreground py-2">
            Mostrando 50 de {mappedProducts.length} filas...
          </p>
        )}
      </ScrollArea>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </Button>
        <Button
          onClick={handleImport}
          disabled={validProducts.length === 0 || importMutation.isPending}
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
              Importar {validProducts.length} Productos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
