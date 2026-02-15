import { useState, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { POSProductGrid } from "@/components/pos/POSProductGrid";
import { POSCart } from "@/components/pos/POSCart";
import { QrCode } from "lucide-react";

const QRScanner = lazy(() => import("@/components/pos/QRScanner").then(m => ({ default: m.QRScanner })));
import { toast } from "sonner";
import { toTitleCase } from "@/lib/utils";
import { useTenant } from "@/hooks/useTenant";
import { useClientsList } from "@/hooks/queries/useClientsList";
import { useServicesList, type ServiceListItem } from "@/hooks/queries/useServicesList";

interface CartItem {
  id: string;
  type: "product" | "service";
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productId?: string;
  serviceId?: string;
  stock?: number;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  stock_level: number;
  qr_code: string | null;
}

export default function POS() {
  const { tenantId } = useTenant();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "services">("products");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | null>(null);
  const [discountValue, setDiscountValue] = useState<string>("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, sku, sale_price, stock_level, qr_code")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!tenantId,
  });

  const { data: services, isLoading: isLoadingServices } = useServicesList();
  const { data: clients } = useClientsList();

  const saleMutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("No tenant ID");
      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            client_id: selectedClient || null,
            total_amount: calculateTotal(),
            notes: notes || null,
            tenant_id: tenantId,
            payment_method: paymentMethod,
            discount_type: discountType,
            discount_value: parseFloat(discountValue) || 0,
            discount_amount: calculateDiscountAmount(),
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.productId || null,
        service_id: item.serviceId || null,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        tenant_id: tenantId,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update inventory for products
      for (const item of cart) {
        if (item.productId) {
          const product = products?.find((p) => p.id === item.productId);
          if (product) {
            const { error: updateError } = await supabase
              .from("inventory")
              .update({ stock_level: product.stock_level - item.quantity })
              .eq("id", item.productId)
              .eq("tenant_id", tenantId);

            if (updateError) throw updateError;
          }
        }
      }

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["inventory", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["lowStockCount", tenantId] });
      setCart([]);
      setSelectedClient("");
      setNotes("");
      setPaymentMethod("cash");
      setDiscountType(null);
      setDiscountValue("");
      toast.success("¡Venta registrada con éxito!");
    },
    onError: () => {
      toast.error("Error al registrar la venta");
    },
  });

  const handleQRScan = (result: string) => {
    const product = products?.find(
      (p) => p.qr_code === result || p.sku === result
    );
    if (product) {
      addToCart(product, "product");
      toast.success(`Producto añadido: ${toTitleCase(product.name)}`);
    } else {
      toast.error("Producto no encontrado con ese código");
    }
  };

  const addToCart = (item: Product | ServiceListItem, type: "product" | "service") => {
    const existingIndex = cart.findIndex(
      (c) =>
        (type === "product" && c.productId === item.id) ||
        (type === "service" && c.serviceId === item.id)
    );

    if (existingIndex >= 0) {
      const existing = cart[existingIndex];
      if (type === "product") {
        const product = item as Product;
        if (existing.quantity >= product.stock_level) {
          toast.error("Stock insuficiente");
          return;
        }
      }
      updateQuantity(existingIndex, existing.quantity + 1);
    } else {
      const price = type === "product" ? (item as Product).sale_price : (item as ServiceListItem).price;
      const newItem: CartItem = {
        id: `${type}-${item.id}`,
        type,
        name: item.name,
        quantity: 1,
        unitPrice: Number(price),
        subtotal: Number(price),
        productId: type === "product" ? item.id : undefined,
        serviceId: type === "service" ? item.id : undefined,
        stock: type === "product" ? (item as Product).stock_level : undefined,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(index);
      return;
    }

    const item = cart[index];
    if (item.type === "product" && item.stock && newQuantity > item.stock) {
      toast.error("Stock insuficiente");
      return;
    }

    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      quantity: newQuantity,
      subtotal: item.unitPrice * newQuantity,
    };
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    const val = parseFloat(discountValue) || 0;
    if (!discountType || val <= 0) return 0;
    if (discountType === "percentage") {
      return Math.min(subtotal, subtotal * (Math.min(val, 100) / 100));
    }
    return Math.min(subtotal, val);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      toast.error("Agrega productos o servicios al carrito");
      return;
    }
    saleMutation.mutate();
  };

  const handleQuantityChange = (index: number, delta: number) => {
    const item = cart[index];
    updateQuantity(index, item.quantity + delta);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Punto de Venta
          </h1>
          <p className="text-muted-foreground mt-1">
            Registra ventas de productos y servicios
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setIsScannerOpen(true)}
        >
          <QrCode className="h-4 w-4" />
          Escanear QR
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Products/Services Selection */}
        <POSProductGrid
          products={products}
          services={services}
          activeTab={activeTab}
          searchQuery={searchQuery}
          isLoadingProducts={isLoadingProducts}
          isLoadingServices={isLoadingServices}
          onAddToCart={addToCart}
          onSearchChange={setSearchQuery}
          onTabChange={setActiveTab}
        />

        {/* Cart */}
        <POSCart
          cart={cart}
          clients={clients}
          selectedClient={selectedClient}
          notes={notes}
          paymentMethod={paymentMethod}
          discountType={discountType}
          discountValue={discountValue}
          subtotal={calculateSubtotal()}
          discountAmount={calculateDiscountAmount()}
          total={calculateTotal()}
          isLoading={saleMutation.isPending}
          onClientChange={setSelectedClient}
          onNotesChange={setNotes}
          onPaymentMethodChange={setPaymentMethod}
          onDiscountTypeChange={setDiscountType}
          onDiscountValueChange={setDiscountValue}
          onClearDiscount={() => {
            setDiscountType(null);
            setDiscountValue("");
          }}
          onQuantityChange={handleQuantityChange}
          onRemoveItem={removeFromCart}
          onFinalize={handleFinalizeSale}
        />
      </div>

      {isScannerOpen && (
        <Suspense fallback={null}>
          <QRScanner
            isOpen={isScannerOpen}
            onOpenChange={setIsScannerOpen}
            onScan={handleQRScan}
          />
        </Suspense>
      )}
    </div>
  );
}
