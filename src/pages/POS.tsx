import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QRScanner } from "@/components/pos/QRScanner";
import {
  ShoppingCart,
  QrCode,
  Package,
  Scissors,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Search,
  Banknote,
  ArrowLeftRight,
  Percent,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/useTenant";

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

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Client {
  id: string;
  name: string;
  phone: string | null;
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

  const { data: products } = useQuery({
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

  const { data: services } = useQuery({
    queryKey: ["services", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!tenantId,
  });

  const { data: clients } = useQuery({
    queryKey: ["clients", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!tenantId,
  });

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
      toast.success(`Producto añadido: ${product.name}`);
    } else {
      toast.error("Producto no encontrado con ese código");
    }
  };

  const addToCart = (item: Product | Service, type: "product" | "service") => {
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
      const price = type === "product" ? (item as Product).sale_price : (item as Service).price;
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

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services?.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pt-12 lg:pt-0">
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
        <div className="space-y-4">
          {/* Search and Tabs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar productos o servicios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "products" ? "default" : "outline"}
                onClick={() => setActiveTab("products")}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Productos
              </Button>
              <Button
                variant={activeTab === "services" ? "default" : "outline"}
                onClick={() => setActiveTab("services")}
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
                    addToCart(product, "product");
                  }}
                  disabled={product.stock_level < 1}
                  className={cn(
                    "rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-md",
                    product.stock_level < 1 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <Badge
                      variant={product.stock_level < 5 ? "destructive" : "secondary"}
                    >
                      {product.stock_level} uds
                    </Badge>
                  </div>
                  <p className="font-medium text-foreground truncate">
                    {product.name}
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
                  onClick={() => addToCart(service, "service")}
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

        {/* Cart */}
        <Card className="h-fit sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrito de Venta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente (opcional)
              </Label>
              <Select value={selectedClient} onValueChange={(value) => setSelectedClient(value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cart Items */}
            <div className="border rounded-lg overflow-hidden">
              {cart.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Carrito vacío</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-24 text-center">Cant.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.type === "product" ? (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Scissors className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm truncate max-w-[120px]">
                              {item.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-medium">
                              Q{item.subtotal.toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas de la venta..."
                rows={2}
              />
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Descuento
              </Label>
              {!discountType ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setDiscountType("percentage")}
                  >
                    <Percent className="h-3.5 w-3.5" />
                    Porcentaje
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setDiscountType("fixed")}
                  >
                    Q Monto fijo
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="0"
                      max={discountType === "percentage" ? "100" : undefined}
                      step="any"
                      placeholder={discountType === "percentage" ? "Ej: 10" : "Ej: 50"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      {discountType === "percentage" ? "%" : "Q"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => { setDiscountType(null); setDiscountValue(""); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {calculateDiscountAmount() > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  -Q{calculateDiscountAmount().toFixed(2)} de descuento
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Metodo de Pago</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all",
                    paymentMethod === "cash"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-border bg-card text-muted-foreground hover:border-green-300"
                  )}
                >
                  <Banknote className="h-5 w-5" />
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all",
                    paymentMethod === "card"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-border bg-card text-muted-foreground hover:border-blue-300"
                  )}
                >
                  <CreditCard className="h-5 w-5" />
                  Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("transfer")}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-sm font-medium transition-all",
                    paymentMethod === "transfer"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-border bg-card text-muted-foreground hover:border-purple-300"
                  )}
                >
                  <ArrowLeftRight className="h-5 w-5" />
                  Transferencia
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4 border-t pt-4">
            {calculateDiscountAmount() > 0 && (
              <div className="w-full space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal:</span>
                  <span>Q{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Descuento ({discountType === "percentage" ? `${discountValue}%` : `Q${discountValue}`}):</span>
                  <span>-Q{calculateDiscountAmount().toFixed(2)}</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between w-full text-lg">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-primary text-2xl">
                Q{calculateTotal().toFixed(2)}
              </span>
            </div>
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleFinalizeSale}
              disabled={cart.length === 0 || saleMutation.isPending}
            >
              <CreditCard className="h-5 w-5" />
              {saleMutation.isPending ? "Procesando..." : "Finalizar Venta"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <QRScanner
        isOpen={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleQRScan}
      />
    </div>
  );
}
