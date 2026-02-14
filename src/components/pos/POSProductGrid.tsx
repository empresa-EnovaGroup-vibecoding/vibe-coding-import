import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Scissors, Search } from "lucide-react";
import { toast } from "sonner";
import { cn, toTitleCase } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  stock_level: number;
  qr_code: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface POSProductGridProps {
  products: Product[] | undefined;
  services: Service[] | undefined;
  activeTab: "products" | "services";
  searchQuery: string;
  isLoadingProducts?: boolean;
  isLoadingServices?: boolean;
  onAddToCart: (item: Product | Service, type: "product" | "service") => void;
  onSearchChange: (query: string) => void;
  onTabChange: (tab: "products" | "services") => void;
}

export function POSProductGrid({
  products,
  services,
  activeTab,
  searchQuery,
  isLoadingProducts = false,
  isLoadingServices = false,
  onAddToCart,
  onSearchChange,
  onTabChange,
}: POSProductGridProps) {
  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services?.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos o servicios..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "products" ? "default" : "outline"}
            onClick={() => onTabChange("products")}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Productos
          </Button>
          <Button
            variant={activeTab === "services" ? "default" : "outline"}
            onClick={() => onTabChange("services")}
            className="gap-2"
          >
            <Scissors className="h-4 w-4" />
            Servicios
          </Button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {activeTab === "products" ? (
          filteredProducts?.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                if (product.stock_level < 1) {
                  toast.error("Producto sin stock");
                  return;
                }
                onAddToCart(product, "product");
              }}
              disabled={product.stock_level < 1}
              className={cn(
                "rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md",
                product.stock_level < 1 && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 border border-primary/15">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                {product.stock_level < 5 ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {product.stock_level} uds
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">{product.stock_level} uds</span>
                )}
              </div>
              <p className="font-medium text-foreground truncate">
                {toTitleCase(product.name)}
              </p>
              <p className="text-lg font-bold text-primary">
                Q{Number(product.sale_price).toFixed(2)}
              </p>
            </button>
          ))
        ) : (
          filteredServices?.map((service) => (
            <button
              key={service.id}
              onClick={() => onAddToCart(service, "service")}
              className="rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                  <Scissors className="h-5 w-5 text-accent-foreground" />
                </div>
                <Badge variant="outline">{service.duration} min</Badge>
              </div>
              <p className="font-medium text-foreground truncate">
                {service.name}
              </p>
              <p className="text-lg font-bold text-primary">
                Q{Number(service.price).toFixed(2)}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
