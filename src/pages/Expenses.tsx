import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus, Trash2, TrendingDown, TrendingUp, DollarSign, Calendar, ChevronLeft, ChevronRight,
  Camera, Upload, Loader2, ImageIcon, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  rent: { label: "Alquiler", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  utilities: { label: "Servicios", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  supplies: { label: "Insumos", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  payroll: { label: "Nomina", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  marketing: { label: "Marketing", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  other: { label: "Otro", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
};

const PIE_COLORS: Record<string, string> = {
  rent: "hsl(221, 83%, 53%)",
  utilities: "hsl(38, 92%, 50%)",
  supplies: "hsl(142, 71%, 45%)",
  payroll: "hsl(262, 83%, 58%)",
  marketing: "hsl(330, 81%, 60%)",
  other: "hsl(215, 16%, 47%)",
};

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  notes: string | null;
  created_at: string;
  receipt_url: string | null;
  extracted_data: Record<string, unknown> | null;
}

export default function Expenses() {
  const { tenantId, isOwner } = useTenant();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [period, setPeriod] = useState<"week" | "month">("month");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "other",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReceiptUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen es muy grande (max 5MB)");
      return;
    }

    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setIsExtracting(true);

    try {
      // Convert to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Call edge function directly
      const res = await fetch(
        "https://oisqrlhwwnuilurvvvdf.supabase.co/functions/v1/extract-expense-receipt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pc3FybGh3d251aWx1cnZ2dmRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzA5MzAsImV4cCI6MjA4NTA0NjkzMH0.LaPbqMZt3lAaqTIdA_a8fnFvWM_ez_axXV-C-MppbBM",
          },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        }
      );
      const result = await res.json();

      if (result.success && result.data) {
        const d = result.data;
        if (d.confidence < 0.3) {
          toast.warning("No pude leer bien el comprobante. Revisa los datos.");
        } else {
          toast.success("Datos extraidos del comprobante");
        }
        setFormData((prev) => ({
          ...prev,
          description: d.description || prev.description,
          amount: d.amount ? String(d.amount) : prev.amount,
          category: d.category || prev.category,
          expense_date: d.date || prev.expense_date,
          notes: d.vendor ? `Proveedor: ${d.vendor}` : prev.notes,
        }));
      } else {
        toast.error("No pude leer el comprobante. Llena los datos manual.");
      }
    } catch {
      toast.error("Error al procesar la imagen");
    } finally {
      setIsExtracting(false);
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Compute date ranges for current and previous period
  const { periodStart, periodEnd, prevStart, prevEnd, periodLabel } = useMemo(() => {
    if (period === "week") {
      const ref = addWeeks(new Date(), weekOffset);
      const s = startOfWeek(ref, { weekStartsOn: 1 });
      const e = endOfWeek(ref, { weekStartsOn: 1 });
      const ps = startOfWeek(addWeeks(ref, -1), { weekStartsOn: 1 });
      const pe = endOfWeek(addWeeks(ref, -1), { weekStartsOn: 1 });
      const label = `${format(s, "d MMM", { locale: es })} – ${format(e, "d MMM yyyy", { locale: es })}`;
      return { periodStart: s, periodEnd: e, prevStart: ps, prevEnd: pe, periodLabel: label };
    }
    const [y, m] = selectedMonth.split("-").map(Number);
    const s = startOfMonth(new Date(y, m - 1));
    const e = endOfMonth(new Date(y, m - 1));
    const ps = startOfMonth(subMonths(s, 1));
    const pe = endOfMonth(subMonths(s, 1));
    return {
      periodStart: s, periodEnd: e, prevStart: ps, prevEnd: pe,
      periodLabel: format(s, "MMMM yyyy", { locale: es }),
    };
  }, [period, weekOffset, selectedMonth]);

  const startDate = periodStart.toISOString().split("T")[0];
  const endDate = periodEnd.toISOString().split("T")[0];

  // Expenses for table display
  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses", tenantId, startDate, endDate],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("expenses").select("*").eq("tenant_id", tenantId)
        .gte("expense_date", startDate).lte("expense_date", endDate)
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!tenantId,
  });

  // Revenue (sales + appointments) + comparison with previous period
  const { data: financial } = useQuery({
    queryKey: ["financial", tenantId, prevStart.toISOString(), periodEnd.toISOString()],
    queryFn: async () => {
      if (!tenantId) return { curRev: 0, prevRev: 0, curExp: 0, prevExp: 0 };
      const rangeStart = prevStart.toISOString();
      const rangeEnd = periodEnd.toISOString();

      const [salesRes, apptsRes, expRes] = await Promise.all([
        supabase.from("sales").select("total_amount, created_at")
          .eq("tenant_id", tenantId).gte("created_at", rangeStart).lte("created_at", rangeEnd),
        supabase.from("appointments").select("total_price, start_time")
          .eq("tenant_id", tenantId).eq("status", "completed")
          .gte("start_time", rangeStart).lte("start_time", rangeEnd),
        supabase.from("expenses").select("amount, expense_date")
          .eq("tenant_id", tenantId)
          .gte("expense_date", rangeStart.split("T")[0]).lte("expense_date", rangeEnd.split("T")[0]),
      ]);

      const inRange = (d: string, s: Date, e: Date) => {
        const dt = new Date(d);
        return dt >= s && dt <= e;
      };

      const sumSales = (s: Date, e: Date) =>
        salesRes.data?.filter(x => inRange(x.created_at, s, e)).reduce((a, x) => a + Number(x.total_amount), 0) || 0;
      const sumAppts = (s: Date, e: Date) =>
        apptsRes.data?.filter(x => inRange(x.start_time, s, e)).reduce((a, x) => a + Number(x.total_price), 0) || 0;
      const sumExp = (s: Date, e: Date) =>
        expRes.data?.filter(x => inRange(x.expense_date + "T12:00:00", s, e)).reduce((a, x) => a + Number(x.amount), 0) || 0;

      return {
        curRev: sumSales(periodStart, periodEnd) + sumAppts(periodStart, periodEnd),
        prevRev: sumSales(prevStart, prevEnd) + sumAppts(prevStart, prevEnd),
        curExp: sumExp(periodStart, periodEnd),
        prevExp: sumExp(prevStart, prevEnd),
      };
    },
    enabled: !!tenantId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!tenantId) throw new Error("No tenant ID");

      let receiptUrl: string | null = null;

      // Upload receipt image if exists
      if (receiptFile) {
        const ext = receiptFile.name.split(".").pop() || "jpg";
        const path = `${tenantId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("expense-receipts")
          .upload(path, receiptFile, { contentType: receiptFile.type });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("expense-receipts")
          .getPublicUrl(path);
        receiptUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("expenses").insert([{
        tenant_id: tenantId, description: data.description,
        amount: parseFloat(data.amount), category: data.category,
        expense_date: data.expense_date, notes: data.notes || null, created_by: user?.id,
        receipt_url: receiptUrl,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      setIsDialogOpen(false);
      setFormData({ description: "", amount: "", category: "other", expense_date: new Date().toISOString().split("T")[0], notes: "" });
      clearReceipt();
      toast.success("Gasto registrado");
    },
    onError: () => toast.error("Error al registrar el gasto"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      toast.success("Gasto eliminado");
    },
    onError: () => toast.error("Error al eliminar"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) { toast.error("La descripcion es requerida"); return; }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { toast.error("El monto debe ser mayor a 0"); return; }
    createMutation.mutate(formData);
  };

  // Computed values
  const revenue = financial?.curRev ?? 0;
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const profit = revenue - totalExpenses;
  const prevRev = financial?.prevRev ?? 0;
  const prevExp = financial?.prevExp ?? 0;
  const prevProfit = prevRev - prevExp;

  const pct = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;
  const compLabel = period === "week" ? "vs semana anterior" : "vs mes anterior";

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    const groups: Record<string, number> = {};
    expenses.forEach(e => { groups[e.category] = (groups[e.category] || 0) + Number(e.amount); });
    return Object.entries(groups)
      .map(([cat, amount]) => ({ name: CATEGORIES[cat]?.label || cat, value: amount, color: PIE_COLORS[cat] || PIE_COLORS.other }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: format(d, "MMMM yyyy", { locale: es }) };
  });

  function ComparisonText({ current, previous, invertColor }: { current: number; previous: number; invertColor?: boolean }) {
    if (previous === 0 && current === 0) return null;
    const change = pct(current, previous);
    const isPositive = invertColor ? change <= 0 : change >= 0;
    return (
      <p className={`text-xs flex items-center gap-1 mt-1 ${isPositive ? "text-green-600" : "text-red-500"}`}>
        {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {change >= 0 ? "+" : ""}{change.toFixed(1)}% {compLabel}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Period Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setPeriod("week")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${period === "week" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted"}`}>
              Semanal
            </button>
            <button onClick={() => setPeriod("month")}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${period === "month" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted"}`}>
              Mensual
            </button>
          </div>

          {period === "month" ? (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <Calendar className="h-4 w-4 mr-2" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-1 rounded-lg border border-border px-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(o => o - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">{periodLabel}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(o => Math.min(o + 1, 0))} disabled={weekOffset >= 0}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /><span className="hidden sm:inline">Nuevo Gasto</span></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Receipt Upload */}
                <div className="space-y-2">
                  <Label>Comprobante (opcional)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReceiptUpload(file);
                    }}
                  />
                  {receiptPreview ? (
                    <div className="relative rounded-xl border border-border overflow-hidden">
                      <img src={receiptPreview} alt="Comprobante" className="w-full h-40 object-cover" />
                      {isExtracting && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="flex items-center gap-2 text-white text-sm">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Leyendo comprobante...
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={clearReceipt}
                        className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="h-4 w-4" />
                        Tomar Foto
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.removeAttribute("capture");
                            fileInputRef.current.click();
                            fileInputRef.current.setAttribute("capture", "environment");
                          }
                        }}
                      >
                        <Upload className="h-4 w-4" />
                        Subir Imagen
                      </Button>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">La IA leera el comprobante y llenara los datos automaticamente</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripcion *</Label>
                  <Input id="description" value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej: Pago de renta local" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto (Q) *</Label>
                    <Input id="amount" type="number" min="0" step="0.01" value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORIES).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense_date">Fecha</Label>
                  <Input id="expense_date" type="date" value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Detalles adicionales..." rows={2} />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Q{revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Ventas + Servicios</p>
            <ComparisonText current={revenue} previous={prevRev} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Q{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{expenses?.length || 0} registros</p>
            <ComparisonText current={totalExpenses} previous={prevExp} invertColor />
          </CardContent>
        </Card>
        <Card className={profit >= 0 ? "border-green-200 dark:border-green-900" : "border-red-200 dark:border-red-900"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
              Q{profit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Ingresos - Gastos</p>
            <ComparisonText current={profit} previous={prevProfit} />
          </CardContent>
        </Card>
      </div>

      {/* Category Chart + Expense Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        {categoryData.length > 0 && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En que se va el dinero</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" labelLine={false}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`Q${value.toFixed(2)}`, ""]}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">Q{item.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense Table */}
        <div className={`rounded-xl border border-border bg-card shadow-sm overflow-hidden ${categoryData.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando gastos...</div>
          ) : !expenses || expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingDown className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No hay gastos registrados en este periodo</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>Registrar primer gasto</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  {isOwner && <TableHead className="w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const cat = CATEGORIES[expense.category] ?? CATEGORIES.other;
                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(expense.expense_date + "T12:00:00"), "d MMM", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <div>
                            <p className="font-medium text-foreground">{expense.description}</p>
                            {expense.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{expense.notes}</p>}
                          </div>
                          {expense.receipt_url && (
                            <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer"
                              className="shrink-0 mt-0.5" title="Ver comprobante">
                              <ImageIcon className="h-4 w-4 text-primary/60 hover:text-primary transition-colors" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cat.color}>{cat.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">Q{Number(expense.amount).toFixed(2)}</TableCell>
                      {isOwner && (
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteMutation.mutate(expense.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
