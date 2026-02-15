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
import { Camera, Upload, Loader2, X } from "lucide-react";
import { CATEGORIES } from "./expense-constants";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    description: string;
    amount: string;
    category: string;
    expense_date: string;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    description: string;
    amount: string;
    category: string;
    expense_date: string;
    notes: string;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  receiptPreview: string | null;
  isExtracting: boolean;
  onReceiptUpload: (file: File) => void;
  onClearReceipt: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isPending,
  receiptPreview,
  isExtracting,
  onReceiptUpload,
  onClearReceipt,
  fileInputRef,
}: ExpenseFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <span className="text-lg leading-none">+</span>
          <span className="hidden sm:inline">Nuevo Gasto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
                if (file) onReceiptUpload(file);
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
                  onClick={onClearReceipt}
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
            <p className="text-[11px] text-muted-foreground">
              La IA leera el comprobante y llenara los datos automaticamente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Pago de renta local"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto (Q) *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense_date">Fecha</Label>
            <Input
              id="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalles adicionales..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
