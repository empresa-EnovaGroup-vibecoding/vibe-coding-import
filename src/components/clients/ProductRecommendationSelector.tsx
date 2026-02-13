import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Package, Plus } from "lucide-react";
import { toTitleCase } from "@/lib/utils";

interface SelectedProduct {
  id: string;
  name: string;
  notes: string;
}

interface ProductRecommendationSelectorProps {
  selectedProducts: SelectedProduct[];
  onProductsChange: (products: SelectedProduct[]) => void;
}

export function ProductRecommendationSelector({
  selectedProducts,
  onProductsChange,
}: ProductRecommendationSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, sale_price, stock_level")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedProducts.some((sp) => sp.id === product.id)
  );

  const handleAddProduct = (product: { id: string; name: string }) => {
    onProductsChange([
      ...selectedProducts,
      { id: product.id, name: product.name, notes: "" },
    ]);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemoveProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((p) => p.id !== productId));
  };

  const handleUpdateNotes = (productId: string, notes: string) => {
    onProductsChange(
      selectedProducts.map((p) =>
        p.id === productId ? { ...p, notes } : p
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar productos del inventario..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="pl-10"
        />

        {/* Dropdown */}
        {showDropdown && searchTerm.length > 0 && (
          <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-lg">
            <ScrollArea className="max-h-60">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Cargando productos...
                </div>
              ) : filteredProducts && filteredProducts.length > 0 ? (
                <div className="py-1">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{toTitleCase(product.name)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          Q{Number(product.sale_price).toFixed(2)}
                        </span>
                        <Badge
                          variant={product.stock_level > 0 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          Stock: {product.stock_level}
                        </Badge>
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No se encontraron productos
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Selected products */}
      {selectedProducts.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Productos seleccionados ({selectedProducts.length})
          </p>
          <div className="space-y-2">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      {toTitleCase(product.name)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Agregar notas sobre la recomendación..."
                    value={product.notes}
                    onChange={(e) => handleUpdateNotes(product.id, e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            Busque y seleccione productos para recomendar al cliente
          </p>
        </div>
      )}
    </div>
  );
}
